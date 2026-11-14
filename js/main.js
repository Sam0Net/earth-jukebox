import { initGlobe, triggerRipple } from './globeView.js'
import { videoScanner } from './videoScanner.js'
import { audioEngine } from './audioEngine.js'

var state = {
  selectedLocation: null,
  activeTrack: 'fires',
  isPlaying: false,
  isMuted: false
}

var dom = {}

var trackMetadata = {
  fires: { badge: 'Incendios', color: '#ff5555' },
  met: { badge: 'Metano', color: '#50fa7b' },
  ocean: { badge: 'Oceano', color: '#8be9fd' }
}

var latestFrameData = null

document.addEventListener('DOMContentLoaded', async () => {
  dom.statusText = document.getElementById('statusText')
  dom.playBtn = document.getElementById('playBtn')
  dom.muteBtn = document.getElementById('muteBtn')
  dom.muteBtnText = document.getElementById('muteBtnText')
  dom.trackSelect = document.getElementById('trackSelect')
  dom.genreBadge = document.getElementById('genreBadge')
  dom.videoMarker = document.getElementById('videoMarker')
  dom.uploadBtn = document.getElementById('uploadBtn')
  dom.videoFileInput = document.getElementById('videoFileInput')

  dom.statusText.textContent = 'Cargando...'
  await videoScanner.loadVideo(state.activeTrack)
  dom.statusText.textContent = 'Toca el globo para escuchar ese lugar.'

  initGlobe('globeViz', handleLocationSelected)

  setupUIEventListeners()
})

async function handleLocationSelected(lat, lng) {
  state.selectedLocation = { lat, lng }

  var pixel = videoScanner.latLngToPixel(lat, lng)
  dom.videoMarker.style.left = pixel.percentX + '%'
  dom.videoMarker.style.top = pixel.percentY + '%'
  dom.videoMarker.style.display = 'block'

  dom.statusText.textContent = 'Escuchando este lugar.'
  dom.statusText.className = 'info-value status-playing'
  dom.playBtn.disabled = false
  dom.playBtn.innerHTML = '<span class="btn-icon">&#10074;&#10074;</span><span class="btn-text">Pausar</span>'

  await audioEngine.init()

  state.isPlaying = true
  document.body.classList.add('is-playing')

  var trackForAudio = state.activeTrack
  if (state.activeTrack == 'custom') {
    trackForAudio = 'fires'
  }

  videoScanner.startScan(lat, lng, (data) => {
    latestFrameData = data
  })

  audioEngine.startPlayback(trackForAudio, () => latestFrameData)
}

function detenerReproduccion(mensaje) {
  if (!mensaje) mensaje = 'Pausado.'
  state.isPlaying = false
  document.body.classList.remove('is-playing')
  videoScanner.pauseVideo()
  audioEngine.stopPlayback()
  dom.statusText.textContent = mensaje
  dom.statusText.className = 'info-value status-idle'
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

    var nombre = e.target.selectedOptions[0].text
    dom.statusText.textContent = 'Cargando ' + nombre + '...'
    dom.statusText.className = 'info-value status-idle'
    await videoScanner.loadVideo(state.activeTrack)
    dom.statusText.textContent = 'Listo: ' + nombre

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
      dom.muteBtnText.textContent = 'Activar sonido'
    } else {
      dom.muteBtnText.textContent = 'Silenciar'
    }
  })

  dom.uploadBtn.addEventListener('click', () => {
    dom.videoFileInput.click()
  })

  dom.videoFileInput.addEventListener('change', async (e) => {
    var file = e.target.files[0]
    if (!file) return

    if (state.isPlaying) {
      detenerReproduccion('Cargando tu video...')
    }

    state.activeTrack = 'custom'

    dom.genreBadge.textContent = 'Video propio'
    dom.genreBadge.style.color = '#bd93f9'
    dom.genreBadge.style.borderColor = '#bd93f9'

    dom.statusText.textContent = 'Cargando tu video...'
    dom.statusText.className = 'info-value status-idle'

    await videoScanner.loadUserVideo(file)
    dom.statusText.textContent = 'Tu video esta listo.'

    dom.videoFileInput.value = ''

    if (state.selectedLocation) {
      triggerRipple(state.selectedLocation.lat, state.selectedLocation.lng)
      handleLocationSelected(state.selectedLocation.lat, state.selectedLocation.lng)
    }
  })
}