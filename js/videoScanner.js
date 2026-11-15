class EscanerVideo {
  constructor(idVideo, idCanvas) {
    this.video = document.getElementById(idVideo)
    this.canvas = document.getElementById(idCanvas)
    // Canvas 1x1 optimizado: evita transferencias masivas de 204,800 píxeles por frame
    this.canvas.width = 1
    this.canvas.height = 1
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })

    this.pistaActual = 'fires'
    this.estaEscaneando = false
    this.idFrameAnimacion = null
    this.idCallbackVideo = null
    this.urlBlobActual = null
    this.ultimoTiempoScan = 0
    this.intervaloMinimoScan = 70 // ~14 FPS de muestreo (óptimo para semicorcheas a 128 BPM, reduce al 50% el trabajo GPU/CPU)

    this.rutasVideo = {
      fires: 'assets/videos/fires.mp4',
      met: 'assets/videos/wet.mp4',
      ocean: 'assets/videos/ocean.mp4'
    }
  }

  async cargarVideo(tipoPista) {
    this.pistaActual = tipoPista
    var fuente = this.rutasVideo[tipoPista]
    if (!fuente) {
      fuente = this.rutasVideo['fires']
    }
    return this._aplicarFuenteVideo(fuente)
  }

  async cargarVideoUsuario(archivo) {
    this.pistaActual = 'custom'
    if (this.urlBlobActual) {
      URL.revokeObjectURL(this.urlBlobActual)
      this.urlBlobActual = null
    }
    var urlBlob = URL.createObjectURL(archivo)
    this.urlBlobActual = urlBlob
    return this._aplicarFuenteVideo(urlBlob)
  }

  _aplicarFuenteVideo(fuente) {
    return new Promise((resolver) => {
      this.detenerEscaneo()

      this.video.pause()
      this.video.src = fuente
      this.video.muted = true
      this.video.defaultMuted = true
      this.video.volume = 0
      this.video.playsInline = true
      this.video.disableRemotePlayback = true
      this.video.loop = true
      this.video.currentTime = 0
      this.video.load()

      this.video.addEventListener('loadeddata', () => {
        this.video.play().then(() => {
          resolver(true)
        }).catch((err) => {
          console.log('no pudo reproducir automaticamente:', err)
          resolver(true)
        })
      }, { once: true })

      this.video.addEventListener('error', () => {
        console.log('error cargando video')
        resolver(false)
      }, { once: true })
    })
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
    this.video.play().catch(err => console.log('error al reproducir:', err))

    var coords = this.latLngAPixel(lat, lng)

    const ejecutarMuestreo = () => {
      if (!this.estaEscaneando) return

      const ahora = performance.now()
      if (ahora - this.ultimoTiempoScan >= this.intervaloMinimoScan) {
        if (this.video.readyState >= 2 && !this.video.paused) {
          this.ultimoTiempoScan = ahora

          // Optimización ultra-eficiente: extraer únicamente 1 píxel al canvas 1x1
          // en lugar de transferir 204,800 píxeles por frame. Elimina bloqueos de GPU en Three.js.
          this.ctx.drawImage(this.video, coords.x, coords.y, 1, 1, 0, 0, 1, 1)
          var pixel = this.ctx.getImageData(0, 0, 1, 1).data

          var r = pixel[0]
          var g = pixel[1]
          var b = pixel[2]
          var luminancia = Math.round(0.299 * r + 0.587 * g + 0.114 * b)

          var tipoDominante = 'ambient'
          if (this.pistaActual === 'fires') {
            if (r > 90 || luminancia > 80) tipoDominante = 'fire'
          } else if (this.pistaActual === 'met') {
            if (g > 70 || r > 70 || luminancia > 60) tipoDominante = 'met'
          } else if (this.pistaActual === 'ocean') {
            if (b > 90 || r > 80 || luminancia > 70) tipoDominante = 'ocean'
          } else {
            if (r > g && r > b) tipoDominante = 'fire'
            else if (g > r && g > b) tipoDominante = 'met'
            else if (b > r && b > g) tipoDominante = 'ocean'
            else tipoDominante = 'ambient'
          }

          var duracion = this.video.duration || 30.0
          var tiempoActual = this.video.currentTime || 0
          var progreso = Math.min(1.0, tiempoActual / duracion)

          if (alRecibirFrame) {
            alRecibirFrame({
              r, g, b,
              luminancia,
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