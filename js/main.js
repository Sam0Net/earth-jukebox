import { initGlobe, triggerRipple, focusLocation } from './globeView.js'
import { videoScanner } from './videoScanner.js'
import { audioEngine } from './audioEngine.js'

var state = {
  selectedLocation: null,
  activeTrack: 'fires',
  isPlaying: false,
  isMuted: false,
  customVideoName: null
}

var dom = {}

var trackMetadata = {
  fires: {
    badge: 'Acid House - 128 BPM',
    color: '#ff4422'
  },
  met: {
    badge: 'Afro Deep House - 116 BPM',
    color: '#00e676'
  },
  ocean: {
    badge: 'Progressive House - 122 BPM',
    color: '#00d4ff'
  }
}

var latestFrameData = null

document.addEventListener('DOMContentLoaded', async () => {
  dom.coordsText = document.getElementById('coordsText')
  dom.statusText = document.getElementById('statusText')
  dom.metricsText = document.getElementById('metricsText')
  dom.progressBar = document.getElementById('progressBar')
  dom.progressTime = document.getElementById('progressTime')
  dom.playBtn = document.getElementById('playBtn')
  dom.muteBtn = document.getElementById('muteBtn')
  dom.muteBtnText = document.getElementById('muteBtnText')
  dom.trackSelect = document.getElementById('trackSelect')
  dom.genreBadge = document.getElementById('genreBadge')
  dom.videoMarker = document.getElementById('videoMarker')
  dom.nasaVideo = document.getElementById('nasaVideo')
  dom.uploadBtn = document.getElementById('uploadBtn')
  dom.videoFileInput = document.getElementById('videoFileInput')

  dom.statusText.textContent = 'Cargando video del planisferio satelital...'
  await videoScanner.loadVideo(state.activeTrack)
  dom.statusText.textContent = 'Listo. Haz clic en el globo para iniciar la sonificacion.'

  console.log('iniciando jukebox...')
  initGlobe('globeViz', handleLocationSelected)

  setupUIEventListeners()
})

async function handleLocationSelected(lat, lng) {
  state.selectedLocation = { lat, lng }

  var latCard = ''
  var lngCard = ''

  if (lat >= 0) {
    latCard = lat.toFixed(2) + ' deg N'
  } else {
    latCard = Math.abs(lat).toFixed(2) + ' deg S'
  }

  if (lng >= 0) {
    lngCard = lng.toFixed(2) + ' deg E'
  } else {
    lngCard = Math.abs(lng).toFixed(2) + ' deg W'
  }

  dom.coordsText.textContent = latCard + ', ' + lngCard

  var pixel = videoScanner.latLngToPixel(lat, lng)
  dom.videoMarker.style.left = pixel.percentX + '%'
  dom.videoMarker.style.top = pixel.percentY + '%'
  dom.videoMarker.style.display = 'block'

  dom.statusText.textContent = 'Sintetizando audio House en tiempo real...'
  dom.statusText.className = 'info-value status-playing'
  dom.playBtn.disabled = false
  dom.playBtn.innerHTML = '<span class="btn-icon">&#10074;&#10074;</span><span class="btn-text">Pausar</span>'

  await audioEngine.init()

  state.isPlaying = true

  var trackForAudio = state.activeTrack
  if (state.activeTrack == 'custom') {
    trackForAudio = 'fires'
  }

  videoScanner.startScan(lat, lng, (data) => {
    latestFrameData = data

    var porcentaje = Math.round(data.progress * 100)
    dom.progressBar.style.width = porcentaje + '%'
    dom.progressTime.textContent = data.currentTime.toFixed(1) + 's / ' + data.duration.toFixed(1) + 's'

    var tipoTexto = 'Ecosistema Mixto'
    if (data.dominantType == 'fire') tipoTexto = 'Incendios Forestales Activos'
    else if (data.dominantType == 'met') tipoTexto = 'Emisiones de Metano en Humedales'
    else if (data.dominantType == 'ocean') tipoTexto = 'Temperatura Superficial Marina'
    else if (data.dominantType == 'ambient') tipoTexto = 'Linea Base Planetaria'

    dom.metricsText.textContent = 'Luz: ' + data.luminance + ' | Filtro: ' + (400 + data.luminance * 20) + ' Hz | ' + tipoTexto
  })

  audioEngine.startPlayback(trackForAudio, () => latestFrameData)
}

function detenerReproduccion(mensaje) {
  if (!mensaje) mensaje = 'Reproduccion pausada.'
  state.isPlaying = false
  videoScanner.pauseVideo()
  audioEngine.stopPlayback()
  dom.statusText.textContent = mensaje
  dom.statusText.className = 'info-value'
  dom.playBtn.innerHTML = '<span class="btn-icon">&#9658;</span><span class="btn-text">Reproducir</span>'
}

function setupUIEventListeners() {
  dom.trackSelect.addEventListener('change', async (e) => {
    state.activeTrack = e.target.value
    var meta = trackMetadata[state.activeTrack]
    if (!meta) meta = trackMetadata.fires

    dom.genreBadge.textContent = meta.badge
    dom.genreBadge.style.color = meta.color
    dom.genreBadge.style.borderColor = meta.color
    dom.progressBar.style.background = 'linear-gradient(90deg, ' + meta.color + ', #00d4ff)'

    dom.statusText.textContent = 'Cargando video: ' + e.target.selectedOptions[0].text + '...'
    await videoScanner.loadVideo(state.activeTrack)
    dom.statusText.textContent = 'Video activo: ' + meta.badge

    if (state.selectedLocation) {
      triggerRipple(state.selectedLocation.lat, state.selectedLocation.lng)
      handleLocationSelected(state.selectedLocation.lat, state.selectedLocation.lng)
    }
  })

  dom.playBtn.addEventListener('click', () => {
    if (!state.selectedLocation) return
    if (state.isPlaying) {
      detenerReproduccion('Pausado.')
    } else {
      triggerRipple(state.selectedLocation.lat, state.selectedLocation.lng)
      handleLocationSelected(state.selectedLocation.lat, state.selectedLocation.lng)
    }
  })

  dom.muteBtn.addEventListener('click', () => {
    state.isMuted = !state.isMuted
    audioEngine.setMute(state.isMuted)
    if (state.isMuted) {
      dom.muteBtnText.textContent = 'UNMUTE'
    } else {
      dom.muteBtnText.textContent = 'MUTE'
    }
  })

  dom.uploadBtn.addEventListener('click', () => {
    dom.videoFileInput.click()
  })

  dom.videoFileInput.addEventListener('change', async (e) => {
    var file = e.target.files[0]
    if (!file) return

    if (state.isPlaying) {
      detenerReproduccion('Cargando video personalizado...')
    }

    state.activeTrack = 'custom'
    state.customVideoName = file.name

    dom.genreBadge.textContent = 'Video Personalizado - 124 BPM'
    dom.genreBadge.style.color = '#bd93f9'
    dom.genreBadge.style.borderColor = '#bd93f9'
    dom.progressBar.style.background = 'linear-gradient(90deg, #bd93f9, #8be9fd)'

    dom.statusText.textContent = 'Cargando: ' + file.name + '...'
    dom.statusText.className = 'info-value'

    await videoScanner.loadUserVideo(file)
    dom.statusText.textContent = 'Video cargado: ' + file.name

    dom.videoFileInput.value = ''

    if (state.selectedLocation) {
      triggerRipple(state.selectedLocation.lat, state.selectedLocation.lng)
      handleLocationSelected(state.selectedLocation.lat, state.selectedLocation.lng)
    }
  })
}
