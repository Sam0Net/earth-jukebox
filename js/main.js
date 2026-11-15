
import { iniciarGlobo, dispararOnda, enfocarUbicacion, alternarRotacionGlobo, obtenerRotacionGlobo } from './globeView.js'
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

  // Elementos de accesibilidad y navegación rápida
  dom.btnAccesibilidad = document.getElementById('quickNavA11yBtn')
  dom.panelAccesibilidad = document.getElementById('quickNavA11yPanel')
  dom.btnCerrarPanel = document.getElementById('closeQuickNavBtn')
  dom.btnAlternarRotacion = document.getElementById('toggleRotationBtn')
  dom.textoBtnRotacion = document.getElementById('rotationBtnText')
  dom.btnAbrirInfoDesdePanel = document.getElementById('openProjectInfoBtn')

  // Elementos del modal informativo de inicio
  dom.modalInfo = document.getElementById('projectInfoModal')
  dom.btnCerrarModalCruz = document.getElementById('closeModalCrossBtn')
  dom.btnCerrarModalAbajo = document.getElementById('closeModalBottomBtn')
  dom.anunciadorA11y = document.getElementById('a11yAnnouncer')

  dom.textoEstado.textContent = 'Cargando...'
  await escanerVideo.cargarVideo(estado.pistaActiva)
  dom.textoEstado.textContent = 'Toca el globo para escuchar ese lugar.'

  iniciarGlobo('globeViz', alSeleccionarUbicacion)

  configurarEventosUI()
  configurarEventosAccesibilidadYModal()

  // Abrir ventana modal informativa cada vez que se inicia la página
  abrirModalInfo()
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

async function cambiarPista(nuevaPista) {
  if (!metadatosPistas[nuevaPista] && nuevaPista !== 'custom') return
  estado.pistaActiva = nuevaPista
  if (dom.selectorPista) {
    dom.selectorPista.value = nuevaPista
  }

  var meta = metadatosPistas[nuevaPista] || metadatosPistas.fires
  dom.insigniaGenero.textContent = meta.insignia
  dom.insigniaGenero.style.color = meta.color
  dom.insigniaGenero.style.borderColor = meta.color

  var nombre = meta.insignia
  dom.textoEstado.textContent = 'Cargando ' + nombre + '...'
  dom.textoEstado.className = 'info-value status-idle'
  await escanerVideo.cargarVideo(estado.pistaActiva)
  dom.textoEstado.textContent = 'Listo: ' + nombre
}

function anunciarAccesibilidad(texto) {
  if (dom.anunciadorA11y) {
    dom.anunciadorA11y.textContent = ''
    setTimeout(() => {
      dom.anunciadorA11y.textContent = texto
    }, 50)
  }
}

async function navegarARegion(tipoPista, lat, lng, nombreRegion) {
  if (tipoPista && tipoPista !== estado.pistaActiva) {
    await cambiarPista(tipoPista)
  }
  enfocarUbicacion(lat, lng)
  dispararOnda(lat, lng)
  await alSeleccionarUbicacion(lat, lng)
  anunciarAccesibilidad(`Navegando a ${nombreRegion}. Sonificando coordenadas ${lat.toFixed(1)}, ${lng.toFixed(1)}.`)
}

function abrirModalInfo() {
  if (!dom.modalInfo) return
  dom.modalInfo.classList.remove('is-hidden')
  dom.modalInfo.setAttribute('aria-hidden', 'false')
  if (dom.btnCerrarModalAbajo) {
    dom.btnCerrarModalAbajo.focus()
  }
  anunciarAccesibilidad('Ventana modal abierta: Información sobre The Earth Information Jukebox.')
}

function cerrarModalInfo() {
  if (!dom.modalInfo) return
  dom.modalInfo.classList.add('is-hidden')
  dom.modalInfo.setAttribute('aria-hidden', 'true')
  // Inicializar audio context sin reproducir sonido para preparar Tone.js en gesto de usuario
  motorAudio.iniciar().catch(() => {})
  if (dom.btnAccesibilidad) {
    dom.btnAccesibilidad.focus()
  }
  anunciarAccesibilidad('Ventana modal cerrada. Puedes explorar el globo o la barra de accesibilidad.')
}

function alternarPanelAccesibilidad(forzarAbrir) {
  if (!dom.panelAccesibilidad) return
  var estaOculto = dom.panelAccesibilidad.hasAttribute('hidden')
  var debeAbrir = typeof forzarAbrir === 'boolean' ? forzarAbrir : estaOculto

  if (debeAbrir) {
    dom.panelAccesibilidad.removeAttribute('hidden')
    dom.btnAccesibilidad.setAttribute('aria-expanded', 'true')
    actualizarTextoBotonRotacion()
    anunciarAccesibilidad('Panel de accesibilidad y navegación rápida abierto.')
  } else {
    dom.panelAccesibilidad.setAttribute('hidden', '')
    dom.btnAccesibilidad.setAttribute('aria-expanded', 'false')
  }
}

function actualizarTextoBotonRotacion() {
  if (!dom.textoBtnRotacion) return
  var rotando = obtenerRotacionGlobo()
  dom.textoBtnRotacion.textContent = rotando ? 'Pausar rotación del globo' : 'Reanudar rotación del globo'
}

function configurarEventosAccesibilidadYModal() {
  // Abrir / cerrar panel de accesibilidad
  dom.btnAccesibilidad.addEventListener('click', (e) => {
    e.stopPropagation()
    alternarPanelAccesibilidad()
  })

  dom.btnCerrarPanel.addEventListener('click', () => {
    alternarPanelAccesibilidad(false)
  })

  // Botón de rotación del globo
  dom.btnAlternarRotacion.addEventListener('click', () => {
    var nuevoEstado = alternarRotacionGlobo()
    actualizarTextoBotonRotacion()
    anunciarAccesibilidad(nuevoEstado ? 'Rotación del globo activada.' : 'Rotación del globo pausada.')
  })

  // Botón para reabrir modal informativo desde el panel
  dom.btnAbrirInfoDesdePanel.addEventListener('click', () => {
    alternarPanelAccesibilidad(false)
    abrirModalInfo()
  })

  // Botones para cerrar el modal informativo
  dom.btnCerrarModalCruz.addEventListener('click', cerrarModalInfo)
  dom.btnCerrarModalAbajo.addEventListener('click', cerrarModalInfo)

  // Cerrar modal al hacer clic en el fondo oscuro
  dom.modalInfo.addEventListener('click', (e) => {
    if (e.target === dom.modalInfo) {
      cerrarModalInfo()
    }
  })

  // Cerrar panel de accesibilidad si se hace clic fuera
  document.addEventListener('click', (e) => {
    if (dom.panelAccesibilidad && !dom.panelAccesibilidad.hasAttribute('hidden')) {
      if (!dom.panelAccesibilidad.contains(e.target) && !dom.btnAccesibilidad.contains(e.target)) {
        alternarPanelAccesibilidad(false)
      }
    }
  })

  // Navegación rápida con botones predefinidos
  document.querySelectorAll('.preset-loc-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      var lat = parseFloat(btn.dataset.lat)
      var lng = parseFloat(btn.dataset.lng)
      var track = btn.dataset.track
      var name = btn.dataset.name
      await navegarARegion(track, lat, lng, name)
      alternarPanelAccesibilidad(false)
    })
  })

  // Atajos de teclado accesibles
  document.addEventListener('keydown', (e) => {
    var tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : ''
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return

    if (e.key === 'Escape') {
      if (dom.modalInfo && !dom.modalInfo.classList.contains('is-hidden')) {
        cerrarModalInfo()
        return
      }
      if (dom.panelAccesibilidad && !dom.panelAccesibilidad.hasAttribute('hidden')) {
        alternarPanelAccesibilidad(false)
        return
      }
    }

    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault()
      if (dom.btnReproducir && !dom.btnReproducir.disabled) {
        dom.btnReproducir.click()
      } else if (estado.ubicacionSeleccionada) {
        alSeleccionarUbicacion(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
      }
    } else if (e.key === 'm' || e.key === 'M') {
      if (dom.btnSilenciar) dom.btnSilenciar.click()
    } else if (e.key === '1') {
      cambiarPista('fires').then(() => {
        if (estado.ubicacionSeleccionada) {
          alSeleccionarUbicacion(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
        }
      })
    } else if (e.key === '2') {
      cambiarPista('met').then(() => {
        if (estado.ubicacionSeleccionada) {
          alSeleccionarUbicacion(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
        }
      })
    } else if (e.key === '3') {
      cambiarPista('ocean').then(() => {
        if (estado.ubicacionSeleccionada) {
          alSeleccionarUbicacion(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
        }
      })
    }
  })
}

function configurarEventosUI() {
  dom.selectorPista.addEventListener('change', async (e) => {
    var nuevaPista = e.target.value
    await cambiarPista(nuevaPista)

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
