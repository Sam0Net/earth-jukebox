class EscanerVideo {
  constructor(idVideo, idCanvas) {
    this.video = document.getElementById(idVideo)
    this.canvas = document.getElementById(idCanvas)
    this.canvas.width = 5
    this.canvas.height = 5
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })

    this.contenedorMonitor = document.getElementById('videoMonitor')
    this.backdrop = document.getElementById('videoBackdrop')

    this.pistaActual = 'fires'
    this.estaEscaneando = false
    this.idFrameAnimacion = null
    this.idCallbackVideo = null
    this.urlBlobActual = null
    this.controladorCarga = null
    this.ultimoTiempoScan = 0
    this.intervaloMinimoScan = 70

    this.rutasVideo = {
      fires: 'assets/videos/fires.mp4',
      met: 'assets/videos/wet.mp4',
      ocean: 'assets/videos/ocean.mp4',
      co2: 'assets/videos/co2.mp4',
      o3: 'assets/videos/o3.mp4',
      precipitation: 'assets/videos/precipitation.mp4'
    }

    this.rutasPoster = {
      fires: 'assets/posters/fires.webp',
      met: 'assets/posters/wet.webp',
      ocean: 'assets/posters/ocean.webp',
      co2: 'assets/posters/co2.webp',
      o3: 'assets/posters/o3.webp',
      precipitation: 'assets/posters/precipitation.webp'
    }

    this.videosPrecargados = new Set(['fires'])
    this.precargaIniciada = false
  }

  async cargarVideo(tipoPista) {
    this.pistaActual = tipoPista
    var fuente = this.rutasVideo[tipoPista] || this.rutasVideo['fires']
    var poster = this.rutasPoster[tipoPista] || null
    return this._aplicarFuenteVideo(fuente, poster)
  }

  async cargarVideoUsuario(archivo) {
    this.pistaActual = 'custom'
    if (this.urlBlobActual) {
      URL.revokeObjectURL(this.urlBlobActual)
      this.urlBlobActual = null
    }
    var urlBlob = URL.createObjectURL(archivo)
    this.urlBlobActual = urlBlob
    return this._aplicarFuenteVideo(urlBlob, null)
  }

  _aplicarFuenteVideo(fuente, poster) {
    if (this.controladorCarga) {
      this.controladorCarga.abort()
    }
    this.controladorCarga = new AbortController()
    const { signal } = this.controladorCarga

    return new Promise((resolver) => {
      this.detenerEscaneo()

      if (!this.contenedorMonitor) {
        this.contenedorMonitor = document.getElementById('videoMonitor')
      }
      if (!this.backdrop) {
        this.backdrop = document.getElementById('videoBackdrop')
      }

      // 1. Transición instantánea: mostrar póster del nuevo fenómeno de inmediato (0 ms)
      if (poster && this.backdrop) {
        this.backdrop.style.backgroundImage = `url('${poster}')`
        this.backdrop.style.opacity = '1'
      }
      if (this.contenedorMonitor) {
        this.contenedorMonitor.classList.add('is-buffering')
      }
      this.video.style.opacity = '0'

      let resuelto = false
      const finalizarCarga = (exito) => {
        if (resuelto) return
        resuelto = true

        this.video.removeEventListener('canplay', onReady)
        this.video.removeEventListener('loadeddata', onReady)

        if (this.contenedorMonitor) {
          this.contenedorMonitor.classList.remove('is-buffering')
        }
        this.video.style.opacity = '1'

        // Desvanecer el póster de fondo suavemente una vez que el video esté visible
        setTimeout(() => {
          if (this.backdrop && !this.contenedorMonitor?.classList.contains('is-buffering')) {
            this.backdrop.style.opacity = '0'
          }
        }, 180)

        resolver(exito)
      }

      const onReady = () => {
        this.video.play()
          .then(() => finalizarCarga(true))
          .catch(() => finalizarCarga(true))
      }

      signal.addEventListener('abort', () => finalizarCarga(false), { once: true })
      this.video.addEventListener('canplay', onReady, { once: true, signal })
      this.video.addEventListener('loadeddata', onReady, { once: true, signal })
      this.video.addEventListener('error', () => finalizarCarga(false), { once: true, signal })

      this.video.pause()
      if (poster) {
        this.video.poster = poster
      }
      this.video.src = fuente
      this.video.muted = true
      this.video.defaultMuted = true
      this.video.volume = 0
      this.video.playsInline = true
      this.video.disableRemotePlayback = true
      this.video.loop = true
      this.video.currentTime = 0
      this.video.load()
    })
  }

  iniciarPrecargaInteligente() {
    if (this.precargaIniciada) return
    this.precargaIniciada = true

    const ejecutarPrecarga = () => {
      const pistas = Object.keys(this.rutasVideo)
      let offsetMs = 800

      pistas.forEach((pista) => {
        if (pista === 'fires' || this.videosPrecargados.has(pista)) return
        this.videosPrecargados.add(pista)

        setTimeout(() => {
          this._precargarVideo(this.rutasVideo[pista], this.rutasPoster[pista])
        }, offsetMs)

        offsetMs += 600
      })
    }

    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(ejecutarPrecarga, { timeout: 3500 })
    } else {
      setTimeout(ejecutarPrecarga, 2000)
    }
  }

  _precargarVideo(urlVideo, urlPoster) {
    if (urlPoster) {
      const img = new Image()
      img.src = urlPoster
    }
    if (urlVideo) {
      try {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.as = 'video'
        link.href = urlVideo
        document.head.appendChild(link)
      } catch (_) {}

      const v = document.createElement('video')
      v.preload = 'auto'
      v.muted = true
      v.src = urlVideo
    }
  }

  latLngAPixel(lat, lng) {
    var vw = this.video.videoWidth || 640
    var vh = this.video.videoHeight || 320
    var x = Math.floor(((lng + 180) / 360) * vw)
    var y = Math.floor(((90 - lat) / 180) * vh)
    return {
      x: Math.max(0, Math.min(x, vw - 1)),
      y: Math.max(0, Math.min(y, vh - 1)),
      porcentajeX: ((lng + 180) / 360) * 100,
      porcentajeY: ((90 - lat) / 180) * 100
    }
  }

  iniciarEscaneo(lat, lng, alRecibirFrame) {
    this.detenerEscaneo()
    this.estaEscaneando = true
    this.ultimoTiempoScan = 0

    this.video.muted = true
    this.video.volume = 0
    this.video.loop = true
    this.video.play().catch(() => {})

    var coords = this.latLngAPixel(lat, lng)

    const ejecutarMuestreo = () => {
      if (!this.estaEscaneando) return

      const ahora = performance.now()
      if (ahora - this.ultimoTiempoScan >= this.intervaloMinimoScan) {
        if (this.video.readyState >= 2 && !this.video.paused) {
          this.ultimoTiempoScan = ahora

          const vw = this.video.videoWidth || 640
          const vh = this.video.videoHeight || 320
          const sx = Math.max(0, Math.min(coords.x - 2, vw - 5))
          const sy = Math.max(0, Math.min(coords.y - 2, vh - 5))

          this.ctx.drawImage(this.video, sx, sy, 5, 5, 0, 0, 5, 5)
          const data = this.ctx.getImageData(0, 0, 5, 5).data

          let sumR = 0
          let sumG = 0
          let sumB = 0
          let activos = 0

          for (let i = 0; i < data.length; i += 4) {
            const pr = data[i]
            const pg = data[i + 1]
            const pb = data[i + 2]
            sumR += pr
            sumG += pg
            sumB += pb
            if (0.299 * pr + 0.587 * pg + 0.114 * pb > 85) activos++
          }

          const r = Math.round(sumR / 25)
          const g = Math.round(sumG / 25)
          const b = Math.round(sumB / 25)
          const luminancia = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
          const densidadEspacial = activos / 25

          var tipoDominante = 'ambient'
          if (this.pistaActual === 'fires') {
            if (r > 90 || luminancia > 80) tipoDominante = 'fire'
          } else if (this.pistaActual === 'met') {
            if (g > 70 || r > 70 || luminancia > 60) tipoDominante = 'met'
          } else if (this.pistaActual === 'ocean') {
            if (b > 90 || r > 80 || luminancia > 70) tipoDominante = 'ocean'
          } else if (this.pistaActual === 'co2') {
            if (r > 80 || luminancia > 70) tipoDominante = 'fire'
          } else if (this.pistaActual === 'o3') {
            if (b > 80 || g > 70 || luminancia > 60) tipoDominante = 'met'
          } else if (this.pistaActual === 'precipitation') {
            if (b > 70 || luminancia > 50) tipoDominante = 'ocean'
          } else {
            if (r >= g && r >= b && r > 75) tipoDominante = 'fire'
            else if (g > r && g >= b && g > 70) tipoDominante = 'met'
            else if (b > r && b > g && b > 75) tipoDominante = 'ocean'
            else tipoDominante = 'ambient'
          }

          var duracion = this.video.duration || 30.0
          var tiempoActual = this.video.currentTime || 0
          var progreso = Math.min(1.0, tiempoActual / duracion)

          if (alRecibirFrame) {
            alRecibirFrame({
              r,
              g,
              b,
              luminancia,
              densidadEspacial,
              tipoDominante,
              tiempoActual,
              duracion,
              progreso,
              porcentajeX: coords.porcentajeX,
              porcentajeY: coords.porcentajeY
            })
          }
        }
      }

      if ('requestVideoFrameCallback' in this.video) {
        this.idCallbackVideo = this.video.requestVideoFrameCallback(ejecutarMuestreo)
      } else {
        this.idFrameAnimacion = requestAnimationFrame(ejecutarMuestreo)
      }
    }

    if ('requestVideoFrameCallback' in this.video) {
      this.idCallbackVideo = this.video.requestVideoFrameCallback(ejecutarMuestreo)
    } else {
      this.idFrameAnimacion = requestAnimationFrame(ejecutarMuestreo)
    }
  }

  detenerEscaneo() {
    this.estaEscaneando = false
    if (this.idCallbackVideo !== null && 'cancelVideoFrameCallback' in this.video) {
      this.video.cancelVideoFrameCallback(this.idCallbackVideo)
      this.idCallbackVideo = null
    }
    if (this.idFrameAnimacion) {
      cancelAnimationFrame(this.idFrameAnimacion)
      this.idFrameAnimacion = null
    }
  }

  pausarVideo() {
    this.detenerEscaneo()
    if (this.video && !this.video.paused) {
      this.video.pause()
    }
  }
}

export const escanerVideo = new EscanerVideo('nasaVideo', 'scannerCanvas')