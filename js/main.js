import { iniciarGlobo, dispararOnda, enfocarUbicacion, alternarRotacionGlobo, obtenerRotacionGlobo } from './globeView.js'
import { escanerVideo } from './videoScanner.js'
import { motorAudio } from './audioEngine.js'
import {
  t,
  obtenerIdioma,
  alternarIdioma,
  aplicarTraduccionesDOM,
  suscribirCambioIdioma
} from './i18n.js'

var estado = {
  ubicacionSeleccionada: null,
  pistaActiva: 'fires',
  estaReproduciendo: false,
  estaSilenciado: false,
  exploracionGuiadaActiva: false,
  indiceExploracion: 0,
  temporizadorExploracion: null
}

var dom = {}

var metadatosPistas = {}

function actualizarMetadatosPistas() {
  metadatosPistas = {
    fires: { insignia: t('genreFires'), color: '#ff5555' },
    met: { insignia: t('genreMet'), color: '#50fa7b' },
    ocean: { insignia: t('genreOcean'), color: '#8be9fd' },
    co2: { insignia: t('genreCo2'), color: '#ffb86c' },
    o3: { insignia: t('genreO3'), color: '#bd93f9' },
    precipitation: { insignia: t('genrePrecipitation'), color: '#8be9fd' },
    custom: { insignia: t('genreCustom'), color: '#bd93f9' }
  }
}
actualizarMetadatosPistas()

var ultimosDatosFrame = null
var ultimoReporteUI = 0
var primerReportePendiente = false
var idCargaPista = 0

function sincronizarUIPorIdioma() {
  actualizarMetadatosPistas()
  aplicarTraduccionesDOM()

  const meta = metadatosPistas[estado.pistaActiva] || metadatosPistas.fires
  if (dom.insigniaGenero) {
    dom.insigniaGenero.textContent = meta.insignia
  }

  if (dom.btnReproducir) {
    const icon = estado.estaReproduciendo ? '&#10074;&#10074;' : '&#9658;'
    const label = estado.estaReproduciendo ? t('pause') : t('play')
    dom.btnReproducir.innerHTML = `<span class="btn-icon">${icon}</span><span class="btn-text" id="playBtnText">${label}</span>`
  }

  if (dom.textoBtnSilenciar) {
    dom.textoBtnSilenciar.textContent = estado.estaSilenciado ? t('unmute') : t('mute')
    dom.btnSilenciar.title = estado.estaSilenciado ? t('muteTitleUnmute') : t('muteTitleMute')
  }

  actualizarBotonExploracion()
  actualizarTextoBotonRotacion()

  const lang = obtenerIdioma()
  document.querySelectorAll('.preset-loc-btn').forEach((btn) => {
    const localized = lang === 'es' ? btn.dataset.nameEs : btn.dataset.nameEn
    if (localized) {
      btn.dataset.name = localized
    }
  })

  if (ultimosDatosFrame && estado.estaReproduciendo) {
    const metrica = describirMetricaFisica(ultimosDatosFrame, estado.pistaActiva)
    dom.textoEstado.textContent = metrica.principal
    if (dom.textoTelemetria) {
      dom.textoTelemetria.textContent = metrica.detalle
    }
  } else if (!estado.estaReproduciendo && !estado.ubicacionSeleccionada) {
    if (dom.textoEstado) dom.textoEstado.textContent = t('statusIdle')
    if (dom.textoTelemetria) dom.textoTelemetria.textContent = t('telemetryIdle')
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  dom.textoEstado = document.getElementById('statusText')
  dom.textoTelemetria = document.getElementById('telemetryText')
  dom.btnReproducir = document.getElementById('playBtn')
  dom.btnSilenciar = document.getElementById('muteBtn')
  dom.textoBtnSilenciar = document.getElementById('muteBtnText')
  dom.selectorPista = document.getElementById('trackSelect')
  dom.insigniaGenero = document.getElementById('genreBadge')
  dom.marcadorVideo = document.getElementById('videoMarker')
  dom.btnSubir = document.getElementById('uploadBtn')
  dom.entradaArchivoVideo = document.getElementById('videoFileInput')

  dom.btnAccesibilidad = document.getElementById('quickNavA11yBtn')
  dom.overlayAccesibilidad = document.getElementById('quickNavA11yOverlay')
  dom.panelAccesibilidad = document.getElementById('quickNavA11yPanel')
  dom.btnCerrarPanel = document.getElementById('closeQuickNavBtn')
  dom.btnExploracionGuiada = document.getElementById('toggleGuidedTourBtn')
  dom.textoBtnExploracion = document.getElementById('guidedTourBtnText')
  dom.btnAlternarRotacion = document.getElementById('toggleRotationBtn')
  dom.textoBtnRotacion = document.getElementById('rotationBtnText')
  dom.btnAbrirInfoDesdePanel = document.getElementById('openProjectInfoBtn')
  dom.btnAlternarIdioma = document.getElementById('toggleLanguageBtn')
  dom.textoBtnIdioma = document.getElementById('languageBtnText')

  dom.modalInfo = document.getElementById('projectInfoModal')
  dom.btnCerrarModalCruz = document.getElementById('closeModalCrossBtn')
  dom.btnCerrarModalAbajo = document.getElementById('closeModalBottomBtn')
  dom.anunciadorA11y = document.getElementById('a11yAnnouncer')

  suscribirCambioIdioma(() => {
    sincronizarUIPorIdioma()
  })

  sincronizarUIPorIdioma()

  const metaInicial = metadatosPistas[estado.pistaActiva] || metadatosPistas.fires
  dom.textoEstado.textContent = t('statusLoading', { name: metaInicial.insignia })
  await escanerVideo.cargarVideo(estado.pistaActiva)
  dom.textoEstado.textContent = t('statusIdle')
  escanerVideo.iniciarPrecargaInteligente()

  iniciarGlobo('globeViz', (lat, lng) => {
    if (estado.exploracionGuiadaActiva) {
      detenerExploracionGuiada(true)
    }
    alSeleccionarUbicacion(lat, lng)
  })

  configurarEventosUI()
  configurarEventosAccesibilidadYModal()

  abrirModalInfo()
})

function describirMetricaFisica(datos, pistaActiva) {
  if (!datos) {
    return {
      principal: t('statusAnalyzing'),
      detalle: t('statusSampling'),
      anuncio: t('statusAnalyzing')
    }
  }

  const intensidad = Math.min(1, Math.max(0, (Number(datos.luminancia) || 0) / 255))
  const cobertura = Math.round((typeof datos.densidadEspacial === 'number' ? datos.densidadEspacial : 0) * 100)

  let capa = pistaActiva
  let prefijoAuto = ''
  if (pistaActiva === 'custom') {
    prefijoAuto = '[Auto] '
    if (datos.tipoDominante === 'fire') capa = 'fires'
    else if (datos.tipoDominante === 'met') capa = 'met'
    else capa = 'ocean'
  }

  let principal = ''
  if (capa === 'fires') {
    const tempKelvin = Math.round(295 + intensidad * 135)
    const nivel = intensidad > 0.66
      ? t('firesHigh')
      : intensidad > 0.35
        ? t('firesMid')
        : t('firesLow')
    principal = `${prefijoAuto}${nivel}: ~${tempKelvin} K (${t('firesUnit')} ${cobertura}%)`
  } else if (capa === 'co2') {
    const ppm = Math.round(412 + intensidad * 28)
    const nivel = intensidad > 0.66
      ? t('co2High')
      : intensidad > 0.35
        ? t('co2Mid')
        : t('co2Low')
    principal = `${prefijoAuto}${nivel}: ~${ppm} ppm (${t('co2Unit')} ${cobertura}%)`
  } else if (capa === 'met') {
    const concentracionPpb = Math.round(1810 + intensidad * 165)
    const nivel = intensidad > 0.66
      ? t('metHigh')
      : intensidad > 0.35
        ? t('metMid')
        : t('metLow')
    principal = `${prefijoAuto}${nivel}: ~${concentracionPpb} ppb (${t('metUnit')} ${cobertura}%)`
  } else if (capa === 'o3') {
    const dobson = Math.round(195 + intensidad * 190)
    const nivel = intensidad < 0.28
      ? t('o3Low')
      : intensidad > 0.65
        ? t('o3High')
        : t('o3Mid')
    principal = `${prefijoAuto}${nivel}: ~${dobson} DU (${t('o3Unit')} ${cobertura}%)`
  } else if (capa === 'precipitation') {
    const mmh = (intensidad * 28.5).toFixed(1)
    const nivel = intensidad > 0.66
      ? t('precipHigh')
      : intensidad > 0.25
        ? t('precipMid')
        : t('precipLow')
    principal = `${prefijoAuto}${nivel}: ~${mmh} mm/h (${t('precipUnit')} ${cobertura}%)`
  } else {
    const deltaTemp = (intensidad * 3.2 - 0.4).toFixed(1)
    const signo = Number(deltaTemp) >= 0 ? '+' : ''
    const nivel = intensidad > 0.66
      ? t('oceanHigh')
      : intensidad > 0.35
        ? t('oceanMid')
        : t('oceanLow')
    principal = `${prefijoAuto}${nivel}: ${signo}${deltaTemp} °C (${t('oceanUnit')} ${cobertura}%)`
  }

  const hemisferio = datos.porcentajeX < 45
    ? t('hemiWest')
    : datos.porcentajeX > 55
      ? t('hemiEast')
      : t('hemiCenter')
  const detalle = `${hemisferio} | ${t('intensityLabel', { val: Math.round(intensidad * 100) })}`

  return {
    principal,
    detalle,
    anuncio: `${principal}. ${hemisferio}.`
  }
}

async function alSeleccionarUbicacion(lat, lng, prefijoRegion = '') {
  estado.ubicacionSeleccionada = { lat, lng }
  ultimosDatosFrame = null
  ultimoReporteUI = 0
  primerReportePendiente = true

  var pixel = escanerVideo.latLngAPixel(lat, lng)
  dom.marcadorVideo.style.left = pixel.porcentajeX + '%'
  dom.marcadorVideo.style.top = pixel.porcentajeY + '%'
  dom.marcadorVideo.style.display = 'block'

  dom.textoEstado.textContent = prefijoRegion
    ? `${prefijoRegion}: ${t('statusAnalyzing')}`
    : t('statusAnalyzing')
  dom.textoEstado.className = 'info-value status-playing'
  if (dom.textoTelemetria) {
    dom.textoTelemetria.textContent = t('statusCoordinates', { lat: lat.toFixed(1), lng: lng.toFixed(1) })
  }
  dom.btnReproducir.disabled = false
  dom.btnReproducir.innerHTML = `<span class="btn-icon">&#10074;&#10074;</span><span class="btn-text" id="playBtnText">${t('pause')}</span>`

  await motorAudio.iniciar()

  estado.estaReproduciendo = true
  document.body.classList.add('is-playing')

  escanerVideo.iniciarEscaneo(lat, lng, (datos) => {
    ultimosDatosFrame = datos
    if (!estado.estaReproduciendo) return

    const ahora = performance.now()
    if (primerReportePendiente || ahora - ultimoReporteUI >= 1500) {
      ultimoReporteUI = ahora
      const metrica = describirMetricaFisica(datos, estado.pistaActiva)
      dom.textoEstado.textContent = prefijoRegion
        ? `${prefijoRegion} - ${metrica.principal}`
        : metrica.principal
      if (dom.textoTelemetria) {
        dom.textoTelemetria.textContent = metrica.detalle
      }
      if (primerReportePendiente) {
        primerReportePendiente = false
        anunciarAccesibilidad(prefijoRegion ? `${prefijoRegion}. ${metrica.anuncio}` : metrica.anuncio)
      }
    }
  })

  motorAudio.iniciarReproduccion(estado.pistaActiva, () => ultimosDatosFrame)
}

function detenerReproduccion(mensaje) {
  if (!mensaje) mensaje = t('statusPaused')
  if (estado.exploracionGuiadaActiva) {
    detenerExploracionGuiada(true)
  }
  estado.estaReproduciendo = false
  document.body.classList.remove('is-playing')
  escanerVideo.detenerEscaneo()
  motorAudio.detenerReproduccion()
  dom.textoEstado.textContent = mensaje
  dom.textoEstado.className = 'info-value status-idle'
  if (dom.textoTelemetria) {
    dom.textoTelemetria.textContent = t('telemetryPaused')
  }
  dom.btnReproducir.innerHTML = `<span class="btn-icon">&#9658;</span><span class="btn-text" id="playBtnText">${t('play')}</span>`
}

async function cambiarPista(nuevaPista) {
  if (!metadatosPistas[nuevaPista] && nuevaPista !== 'custom') return
  const tokenCarga = ++idCargaPista
  ultimosDatosFrame = null
  estado.pistaActiva = nuevaPista

  if (dom.selectorPista) {
    dom.selectorPista.value = nuevaPista
  }

  var meta = metadatosPistas[nuevaPista] || metadatosPistas.fires
  dom.insigniaGenero.textContent = meta.insignia
  dom.insigniaGenero.style.color = meta.color
  dom.insigniaGenero.style.borderColor = meta.color

  var nombre = meta.insignia
  dom.textoEstado.textContent = t('statusLoading', { name: nombre })
  dom.textoEstado.className = 'info-value status-idle'
  if (dom.textoTelemetria) {
    dom.textoTelemetria.textContent = t('telemetrySync')
  }
  await escanerVideo.cargarVideo(estado.pistaActiva)

  if (tokenCarga !== idCargaPista) return
  dom.textoEstado.textContent = t('statusReady', { name: nombre })
  if (dom.textoTelemetria && !estado.ubicacionSeleccionada) {
    dom.textoTelemetria.textContent = t('telemetryIdle')
  }

  if (estado.estaReproduciendo && estado.ubicacionSeleccionada) {
    primerReportePendiente = true
    escanerVideo.iniciarEscaneo(
      estado.ubicacionSeleccionada.lat,
      estado.ubicacionSeleccionada.lng,
      (datos) => {
        ultimosDatosFrame = datos
        if (!estado.estaReproduciendo) return

        const ahora = performance.now()
        if (primerReportePendiente || ahora - ultimoReporteUI >= 1500) {
          ultimoReporteUI = ahora
          const metrica = describirMetricaFisica(datos, estado.pistaActiva)
          dom.textoEstado.textContent = metrica.principal
          if (dom.textoTelemetria) {
            dom.textoTelemetria.textContent = metrica.detalle
          }
          if (primerReportePendiente) {
            primerReportePendiente = false
            anunciarAccesibilidad(metrica.anuncio)
          }
        }
      }
    )
    motorAudio.iniciarReproduccion(estado.pistaActiva, () => ultimosDatosFrame)
  }
}

function anunciarAccesibilidad(texto) {
  if (dom.anunciadorA11y) {
    dom.anunciadorA11y.textContent = ''
    setTimeout(() => {
      dom.anunciadorA11y.textContent = texto
    }, 50)
  }
}

async function navegarARegion(tipoPista, lat, lng, nombreRegion, esExploracion = false) {
  if (tipoPista && tipoPista !== estado.pistaActiva) {
    await cambiarPista(tipoPista)
  }
  if (esExploracion && !estado.exploracionGuiadaActiva) return

  alternarRotacionGlobo(false)
  enfocarUbicacion(lat, lng)
  dispararOnda(lat, lng)

  const prefijo = esExploracion ? t('routeStep', { step: estado.indiceExploracion + 1, name: nombreRegion }) : nombreRegion
  await alSeleccionarUbicacion(lat, lng, prefijo)

  const nombreCapa = (metadatosPistas[tipoPista] || metadatosPistas.fires).insignia
  anunciarAccesibilidad(t('a11yNavigating', { region: nombreRegion, layer: nombreCapa, lat: lat.toFixed(1), lng: lng.toFixed(1) }))
}

function actualizarBotonExploracion() {
  if (!dom.textoBtnExploracion) return
  dom.textoBtnExploracion.textContent = estado.exploracionGuiadaActiva
    ? t('stopGuidedTour')
    : t('startGuidedTour')
}

async function avanzarPasoExploracion() {
  if (!estado.exploracionGuiadaActiva) return

  const botonesPuntos = Array.from(document.querySelectorAll('.preset-loc-btn'))
  if (!botonesPuntos.length) {
    detenerExploracionGuiada(true)
    return
  }

  const pasoActual = botonesPuntos[estado.indiceExploracion % botonesPuntos.length]
  const lat = parseFloat(pasoActual.dataset.lat)
  const lng = parseFloat(pasoActual.dataset.lng)
  const track = pasoActual.dataset.track
  const name = pasoActual.dataset.name

  await navegarARegion(track, lat, lng, name, true)

  if (!estado.exploracionGuiadaActiva) return

  estado.indiceExploracion = (estado.indiceExploracion + 1) % botonesPuntos.length
  estado.temporizadorExploracion = setTimeout(() => {
    avanzarPasoExploracion()
  }, 9000)
}

function iniciarExploracionGuiada() {
  detenerExploracionGuiada(true)
  estado.exploracionGuiadaActiva = true
  estado.indiceExploracion = 0
  actualizarBotonExploracion()
  alternarPanelAccesibilidad(false)
  anunciarAccesibilidad(t('startGuidedTour'))
  avanzarPasoExploracion()
}

function detenerExploracionGuiada(silencioso = false) {
  if (estado.temporizadorExploracion) {
    clearTimeout(estado.temporizadorExploracion)
    estado.temporizadorExploracion = null
  }
  const estabaActiva = estado.exploracionGuiadaActiva
  estado.exploracionGuiadaActiva = false
  actualizarBotonExploracion()
  if (estabaActiva && !silencioso) {
    anunciarAccesibilidad(t('stopGuidedTour'))
  }
}

function abrirModalInfo() {
  if (!dom.modalInfo) return
  dom.modalInfo.classList.remove('is-hidden')
  dom.modalInfo.setAttribute('aria-hidden', 'false')
  if (dom.btnCerrarModalAbajo) {
    dom.btnCerrarModalAbajo.focus()
  }
}

function cerrarModalInfo() {
  if (!dom.modalInfo) return
  dom.modalInfo.classList.add('is-hidden')
  dom.modalInfo.setAttribute('aria-hidden', 'true')
  motorAudio.iniciar().catch(() => {})
  if (dom.btnAccesibilidad) {
    dom.btnAccesibilidad.focus()
  }
  anunciarAccesibilidad(t('a11yModalClosed'))
}

function alternarPanelAccesibilidad(forzarAbrir) {
  if (!dom.overlayAccesibilidad) return
  var estaOculto = dom.overlayAccesibilidad.hasAttribute('hidden')
  var debeAbrir = typeof forzarAbrir === 'boolean' ? forzarAbrir : estaOculto

  if (debeAbrir) {
    dom.overlayAccesibilidad.removeAttribute('hidden')
    dom.btnAccesibilidad.setAttribute('aria-expanded', 'true')
    actualizarTextoBotonRotacion()
    actualizarBotonExploracion()
    anunciarAccesibilidad(t('a11yPanelOpened'))
    if (dom.btnCerrarPanel) {
      dom.btnCerrarPanel.focus()
    }
  } else {
    dom.overlayAccesibilidad.setAttribute('hidden', '')
    dom.btnAccesibilidad.setAttribute('aria-expanded', 'false')
    if (dom.btnAccesibilidad) {
      dom.btnAccesibilidad.focus()
    }
  }
}

function actualizarTextoBotonRotacion() {
  if (!dom.textoBtnRotacion) return
  var rotando = obtenerRotacionGlobo()
  dom.textoBtnRotacion.textContent = rotando ? t('pauseRotation') : t('resumeRotation')
}

function configurarEventosAccesibilidadYModal() {
  if (dom.btnAlternarIdioma) {
    dom.btnAlternarIdioma.addEventListener('click', () => {
      alternarIdioma()
      anunciarAccesibilidad(t('a11yLangSwitched'))
    })
  }
  dom.btnAccesibilidad.addEventListener('click', (e) => {
    e.stopPropagation()
    alternarPanelAccesibilidad()
  })

  dom.btnCerrarPanel.addEventListener('click', () => {
    alternarPanelAccesibilidad(false)
  })

  dom.btnExploracionGuiada.addEventListener('click', () => {
    if (estado.exploracionGuiadaActiva) {
      detenerExploracionGuiada(false)
    } else {
      iniciarExploracionGuiada()
    }
  })

  dom.btnAlternarRotacion.addEventListener('click', () => {
    var nuevoEstado = alternarRotacionGlobo()
    actualizarTextoBotonRotacion()
    anunciarAccesibilidad(nuevoEstado ? 'Rotación del globo activada.' : 'Rotación del globo pausada.')
  })

  dom.btnAbrirInfoDesdePanel.addEventListener('click', () => {
    alternarPanelAccesibilidad(false)
    abrirModalInfo()
  })

  dom.btnCerrarModalCruz.addEventListener('click', cerrarModalInfo)
  dom.btnCerrarModalAbajo.addEventListener('click', cerrarModalInfo)

  dom.modalInfo.addEventListener('click', (e) => {
    if (e.target === dom.modalInfo) {
      cerrarModalInfo()
    }
  })

  dom.overlayAccesibilidad.addEventListener('click', (e) => {
    if (e.target === dom.overlayAccesibilidad) {
      alternarPanelAccesibilidad(false)
    }
  })

  document.querySelectorAll('.preset-loc-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (estado.exploracionGuiadaActiva) {
        detenerExploracionGuiada(true)
      }
      var lat = parseFloat(btn.dataset.lat)
      var lng = parseFloat(btn.dataset.lng)
      var track = btn.dataset.track
      var name = btn.dataset.name
      await navegarARegion(track, lat, lng, name, false)
      alternarPanelAccesibilidad(false)
    })
  })

  document.addEventListener('keydown', (e) => {
    var tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : ''
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return

    const modalAbierto = dom.modalInfo && !dom.modalInfo.classList.contains('is-hidden')
    const panelAbierto = dom.overlayAccesibilidad && !dom.overlayAccesibilidad.hasAttribute('hidden')

    if (e.key === 'Escape') {
      if (modalAbierto) cerrarModalInfo()
      else if (panelAbierto) alternarPanelAccesibilidad(false)
      return
    }

    if (modalAbierto || panelAbierto) return

    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault()
      if (dom.btnReproducir && !dom.btnReproducir.disabled) {
        dom.btnReproducir.click()
      } else if (estado.ubicacionSeleccionada) {
        alSeleccionarUbicacion(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
      }
    } else if (e.key === 'm' || e.key === 'M') {
      if (dom.btnSilenciar) dom.btnSilenciar.click()
    } else if (e.key === 'g' || e.key === 'G') {
      if (estado.exploracionGuiadaActiva) {
        detenerExploracionGuiada(false)
      } else {
        iniciarExploracionGuiada()
      }
    } else if (e.key === '1') {
      if (estado.exploracionGuiadaActiva) detenerExploracionGuiada(true)
      cambiarPista('fires').then(() => {
        if (estado.ubicacionSeleccionada) {
          alSeleccionarUbicacion(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
        }
      })
    } else if (e.key === '2') {
      if (estado.exploracionGuiadaActiva) detenerExploracionGuiada(true)
      cambiarPista('met').then(() => {
        if (estado.ubicacionSeleccionada) {
          alSeleccionarUbicacion(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
        }
      })
    } else if (e.key === '3') {
      if (estado.exploracionGuiadaActiva) detenerExploracionGuiada(true)
      cambiarPista('ocean').then(() => {
        if (estado.ubicacionSeleccionada) {
          alSeleccionarUbicacion(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
        }
      })
    } else if (e.key === '4') {
      if (estado.exploracionGuiadaActiva) detenerExploracionGuiada(true)
      cambiarPista('co2').then(() => {
        if (estado.ubicacionSeleccionada) {
          alSeleccionarUbicacion(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
        }
      })
    } else if (e.key === '5') {
      if (estado.exploracionGuiadaActiva) detenerExploracionGuiada(true)
      cambiarPista('o3').then(() => {
        if (estado.ubicacionSeleccionada) {
          alSeleccionarUbicacion(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
        }
      })
    } else if (e.key === '6') {
      if (estado.exploracionGuiadaActiva) detenerExploracionGuiada(true)
      cambiarPista('precipitation').then(() => {
        if (estado.ubicacionSeleccionada) {
          alSeleccionarUbicacion(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
        }
      })
    }
  })
}

function configurarEventosUI() {
  dom.selectorPista.addEventListener('change', async (e) => {
    if (estado.exploracionGuiadaActiva) {
      detenerExploracionGuiada(true)
    }
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
      dom.textoBtnSilenciar.textContent = t('unmute')
      dom.btnSilenciar.title = t('muteTitleUnmute')
    } else {
      dom.textoBtnSilenciar.textContent = t('mute')
      dom.btnSilenciar.title = t('muteTitleMute')
    }
  })

  dom.btnSubir.addEventListener('click', () => {
    dom.entradaArchivoVideo.click()
  })

  dom.entradaArchivoVideo.addEventListener('change', async (e) => {
    var archivo = e.target.files[0]
    if (!archivo) return

    if (estado.exploracionGuiadaActiva) {
      detenerExploracionGuiada(true)
    }

    const tokenCarga = ++idCargaPista
    ultimosDatosFrame = null

    if (estado.estaReproduciendo) {
      detenerReproduccion(t('statusLoadingCustom'))
    }

    estado.pistaActiva = 'custom'

    dom.insigniaGenero.textContent = t('genreCustom')
    dom.insigniaGenero.style.color = '#bd93f9'
    dom.insigniaGenero.style.borderColor = '#bd93f9'

    dom.textoEstado.textContent = t('statusLoadingCustom')
    dom.textoEstado.className = 'info-value status-idle'

    await escanerVideo.cargarVideoUsuario(archivo)
    if (tokenCarga !== idCargaPista) return

    dom.textoEstado.textContent = t('statusReady', { name: t('genreCustom') })
    dom.entradaArchivoVideo.value = ''

    if (estado.ubicacionSeleccionada) {
      dispararOnda(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
      alSeleccionarUbicacion(estado.ubicacionSeleccionada.lat, estado.ubicacionSeleccionada.lng)
    }
  })
}