class EscanerVideo {
  constructor(idVideo, idCanvas) {
    this.video = document.getElementById(idVideo)
    this.canvas = document.getElementById(idCanvas)
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })

    this.pistaActual = 'fires'
    this.estaEscaneando = false
    this.idFrameAnimacion = null
    this.urlBlobActual = null

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
      if (this.idFrameAnimacion) {
        cancelAnimationFrame(this.idFrameAnimacion)
        this.idFrameAnimacion = null
      }

      this.video.pause()
      this.video.src = fuente
      this.video.muted = true
      this.video.volume = 0
      this.video.loop = true
      this.video.currentTime = 0
      this.video.load()

      this.video.addEventListener('loadeddata', () => {
        this.canvas.width = 640
        this.canvas.height = 320

        this.video.play().then(() => {
          console.log('video listo')
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
    var x = Math.floor(((lng + 180) / 360) * this.canvas.width)
    var y = Math.floor(((90 - lat) / 180) * this.canvas.height)
    return {
      x: Math.max(0, Math.min(x, this.canvas.width - 1)),
      y: Math.max(0, Math.min(y, this.canvas.height - 1)),
      porcentajeX: ((lng + 180) / 360) * 100,
      porcentajeY: ((90 - lat) / 180) * 100
    }
  }

  iniciarEscaneo(lat, lng, alRecibirFrame) {
    this.detenerEscaneo()
    this.estaEscaneando = true

    this.video.muted = true
    this.video.volume = 0
    this.video.loop = true
    this.video.play().catch(err => console.log('error al reproducir:', err))

    const procesarFrame = () => {
      if (!this.estaEscaneando) return

      if (this.video.readyState >= 2) {
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)

        var coords = this.latLngAPixel(lat, lng)
        var x = coords.x
        var y = coords.y
        var pixel = this.ctx.getImageData(x, y, 1, 1).data

        var r = pixel[0]
        var g = pixel[1]
        var b = pixel[2]
        var luminancia = Math.round(0.299 * r + 0.587 * g + 0.114 * b)

        var tipoDominante = 'ambient'
        if (this.pistaActual == 'fires') {
          if (r > 90 || luminancia > 80) {
            tipoDominante = 'fire'
          }
        } else if (this.pistaActual == 'met') {
          if (g > 70 || r > 70 || luminancia > 60) {
            tipoDominante = 'met'
          }
        } else if (this.pistaActual == 'ocean') {
          if (b > 90 || r > 80 || luminancia > 70) {
            tipoDominante = 'ocean'
          }
        } else {
          if (r > g && r > b) tipoDominante = 'fire'
          else if (g > r && g > b) tipoDominante = 'met'
          else if (b > r && b > g) tipoDominante = 'ocean'
          else tipoDominante = 'ambient'
        }

        var duracion = this.video.duration
        if (!duracion) duracion = 30.0

        var tiempoActual = this.video.currentTime
        var progreso = tiempoActual / duracion
        if (progreso > 1.0) progreso = 1.0

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

      this.idFrameAnimacion = requestAnimationFrame(procesarFrame)
    }

    this.idFrameAnimacion = requestAnimationFrame(procesarFrame)
  }

  detenerEscaneo() {
    this.estaEscaneando = false
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