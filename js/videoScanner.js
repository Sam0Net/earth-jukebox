class VideoScanner {
  constructor(videoId, canvasId) {
    this.video = document.getElementById(videoId)
    this.canvas = document.getElementById(canvasId)
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })

    this.currentTrack = 'fires'
    this.isScanning = false
    this.animationFrameId = null
    this.currentBlobUrl = null

    this.videoPaths = {
      fires: 'assets/videos/fires.mp4',
      met: 'assets/videos/met.mp4',
      ocean: 'assets/videos/ocean.mp4'
    }
  }

  async loadVideo(trackType) {
    this.currentTrack = trackType
    var src = this.videoPaths[trackType]
    if (!src) {
      src = this.videoPaths['fires']
    }
    return this._applyVideoSource(src)
  }

  async loadUserVideo(file) {
    this.currentTrack = 'custom'
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl)
      this.currentBlobUrl = null
    }
    var blobUrl = URL.createObjectURL(file)
    this.currentBlobUrl = blobUrl
    return this._applyVideoSource(blobUrl)
  }

  _applyVideoSource(src) {
    return new Promise((resolve) => {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = null
      }

      this.video.pause()
      this.video.src = src
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
          resolve(true)
        }).catch((err) => {
          console.log('no pudo reproducir automaticamente:', err)
          resolve(true)
        })
      }, { once: true })

      this.video.addEventListener('error', () => {
        console.log('error cargando video')
        resolve(false)
      }, { once: true })
    })
  }

  latLngToPixel(lat, lng) {
    var x = Math.floor(((lng + 180) / 360) * this.canvas.width)
    var y = Math.floor(((90 - lat) / 180) * this.canvas.height)
    return {
      x: Math.max(0, Math.min(x, this.canvas.width - 1)),
      y: Math.max(0, Math.min(y, this.canvas.height - 1)),
      percentX: ((lng + 180) / 360) * 100,
      percentY: ((90 - lat) / 180) * 100
    }
  }

  startScan(lat, lng, onFrameCallback) {
    this.stopScan()
    this.isScanning = true

    this.video.muted = true
    this.video.volume = 0
    this.video.loop = true
    this.video.play().catch(err => console.log('error al reproducir:', err))

    const processFrame = () => {
      if (!this.isScanning) return

      if (this.video.readyState >= 2) {
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)

        var coords = this.latLngToPixel(lat, lng)
        var x = coords.x
        var y = coords.y
        var pixel = this.ctx.getImageData(x, y, 1, 1).data

        var r = pixel[0]
        var g = pixel[1]
        var b = pixel[2]
        var luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b)

        var dominantType = 'ambient'
        if (this.currentTrack == 'fires') {
          if (r > 90 || luminance > 80) {
            dominantType = 'fire'
          }
        } else if (this.currentTrack == 'met') {
          if (g > 70 || r > 70 || luminance > 60) {
            dominantType = 'met'
          }
        } else if (this.currentTrack == 'ocean') {
          if (b > 90 || r > 80 || luminance > 70) {
            dominantType = 'ocean'
          }
        } else {
          if (r > g && r > b) dominantType = 'fire'
          else if (g > r && g > b) dominantType = 'met'
          else if (b > r && b > g) dominantType = 'ocean'
          else dominantType = 'ambient'
        }

        var duration = this.video.duration
        if (!duration) duration = 30.0

        var currentTime = this.video.currentTime
        var progress = currentTime / duration
        if (progress > 1.0) progress = 1.0

        if (onFrameCallback) {
          onFrameCallback({
            r, g, b,
            luminance,
            dominantType,
            currentTime,
            duration,
            progress,
            percentX: coords.percentX,
            percentY: coords.percentY
          })
        }
      }

      this.animationFrameId = requestAnimationFrame(processFrame)
    }

    this.animationFrameId = requestAnimationFrame(processFrame)
  }

  stopScan() {
    this.isScanning = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  pauseVideo() {
    this.stopScan()
    if (this.video && !this.video.paused) {
      this.video.pause()
    }
  }
}

export const videoScanner = new VideoScanner('nasaVideo', 'scannerCanvas')
