
import { iniciarGlobo, dispararOnda } from './globeView.js'
import { escanerVideo } from './videoScanner.js'
import { motorAudio } from './audioEngine.js'
 
var estado = {
  ubicacionSeleccionada: null,
  pistaActiva: 'fires',
  estaReproduciendo: false,
  estaSilenciado: false
}
 
var dom = {}
 
var metadatosPistas = {
  fires: { insignia: 'Incendios', color: '#ff5555' },
  met: { insignia: 'Metano', color: '#50fa7b' },
  ocean: { insignia: 'Oceano', color: '#8be9fd' }
}
 
var ultimosDatosFrame = null
 
document.addEventListener('DOMContentLoaded', async () => {
  dom.textoEstado = document.getElementById('statusText')
  dom.btnReproducir = document.getElementById('playBtn')
  dom.btnSilenciar = document.getElementById('muteBtn')
  dom.textoBtnSilenciar = document.getElementById('muteBtnText')
  dom.selectorPista = document.getElementById('trackSelect')
  dom.insigniaGenero = document.getElementById('genreBadge')
  dom.marcadorVideo = document.getElementById('videoMarker')
  dom.btnSubir = document.getElementById('uploadBtn')
  dom.entradaArchivoVideo = document.getElementById('videoFileInput')
 
  dom.textoEstado.textContent = 'Cargando...'
  await escanerVideo.cargarVideo(estado.pistaActiva)
  dom.textoEstado.textContent = 'Toca el globo para escuchar ese lugar.'
 
  iniciarGlobo('globeViz', alSeleccionarUbicacion)
 
  configurarEventosUI()
})
 
async function alSeleccionarUbicacion(lat, lng) {
  estado.ubicacionSeleccionada = { lat, lng }
 
  var pixel = escanerVideo.latLngAPixel(lat, lng)
  dom.marcadorVideo.style.left = pixel.porcentajeX + '%'
  dom.marcadorVideo.style.top = pixel.porcentajeY + '%'
  dom.marcadorVideo.style.display = 'block'
 
  dom.textoEstado.textContent = 'Escuchando este lugar.'
  dom.textoEstado.className = 'info-value status-playing'
  dom.btnReproducir.disabled = false
  dom.btnReproducir.innerHTML = '<span class="btn-icon">&#10074;&#10074;</span><span class="btn-text">Pausar</span>'
 
  await motorAudio.iniciar()
 
  estado.estaReproduciendo = true
  document.body.classList.add('is-playing')
 
  var pistaParaAudio = estado.pistaActiva
  if (estado.pistaActiva == 'custom') {
    pistaParaAudio = 'fires'
  }
 
  escanerVideo.iniciarEscaneo(lat, lng, (datos) => {
    ultimosDatosFrame = datos
  })
 
  motorAudio.iniciarReproduccion(pistaParaAudio, () => ultimosDatosFrame)
}
 
function detenerReproduccion(mensaje) {
  if (!mensaje) mensaje = 'Pausado.'
  estado.estaReproduciendo = false
  document.body.classList.remove('is-playing')
  escanerVideo.pausarVideo()
  motorAudio.detenerReproduccion()
  dom.textoEstado.textContent = mensaje
  dom.textoEstado.className = 'info-value status-idle'
  dom.btnReproducir.innerHTML = '<span class="btn-icon">&#9658;</span><span class="btn-text">Reproducir</span>'
}
 
function configurarEventosUI() {
  dom.selectorPista.addEventListener('change', async (e) => {
    estado.pistaActiva = e.target.value
    var meta = metadatosPistas[estado.pistaActiva]
    if (!meta) meta = metadatosPistas.fires
 
    dom.insigniaGenero.textContent = meta.insignia
    dom.insigniaGenero.style.color = meta.color
    dom.insigniaGenero.style.borderColor = meta.color
 
    var nombre = e.target.selectedOptions[0].text
    dom.textoEstado.textContent = 'Cargando ' + nombre + '...'
    dom.textoEstado.className = 'info-value status-idle'
    await escanerVideo.cargarVideo(estado.pistaActiva)
    dom.textoEstado.textContent = 'Listo: ' + nombre
 
    if (estado.ubicacionSeleccionada) {
      dispararOnda(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
      alSeleccionarUbicacion(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
    }
  })
 
  dom.btnReproducir.addEventListener('click', () => {
    if (!estado.ubicacionSeleccionada) return
    if (estado.estaReproduciendo) {
      detenerReproduccion('Pausado.')
    } else {
      dispararOnda(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
      alSeleccionarUbicacion(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
    }
  })
 
  dom.btnSilenciar.addEventListener('click', () => {
    estado.estaSilenciado = !estado.estaSilenciado
    motorAudio.silenciar(estado.estaSilenciado)
    if (estado.estaSilenciado) {
      dom.textoBtnSilenciar.textContent = 'Activar sonido'
    } else {
      dom.textoBtnSilenciar.textContent = 'Silenciar'
    }
  })
 
  dom.btnSubir.addEventListener('click', () => {
    dom.entradaArchivoVideo.click()
  })
 
  dom.entradaArchivoVideo.addEventListener('change', async (e) => {
    var archivo = e.target.files[0]
    if (!archivo) return
 
    if (estado.estaReproduciendo) {
      detenerReproduccion('Cargando tu video...')
    }
 
    estado.pistaActiva = 'custom'
 
    dom.insigniaGenero.textContent = 'Video propio'
    dom.insigniaGenero.style.color = '#bd93f9'
    dom.insigniaGenero.style.borderColor = '#bd93f9'
 
    dom.textoEstado.textContent = 'Cargando tu video...'
    dom.textoEstado.className = 'info-value status-idle'
 
    await escanerVideo.cargarVideoUsuario(archivo)
    dom.textoEstado.textContent = 'Tu video esta listo.'
 
    dom.entradaArchivoVideo.value = ''
 
    if (estado.ubicacionSeleccionada) {
      dispararOnda(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
      alSeleccionarUbicacion(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
    }
  })
}