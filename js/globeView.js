var instanciaGlobo = null
var anillosActuales = []
var datosMarcador = []
var temporizadorOnda = null
var colorPistaActual = '#ff5555'

function hexARgba(hex, alfa) {
  let c = (hex || '#8be9fd').replace('#', '')
  if (c.length === 3) c = c.split('').map((x) => x + x).join('')
  const num = parseInt(c, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${alfa})`
}

export function iniciarGlobo(idContenedor, alSeleccionarUbicacion) {
  var contenedor = document.getElementById(idContenedor)
  if (!contenedor) return

  instanciaGlobo = Globe()(contenedor)
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundColor('rgba(0, 0, 0, 0)')
    .showAtmosphere(true)
    .atmosphereColor('#8be9fd')
    .atmosphereAltitude(0.22)
    .ringColor((d) => (t) => hexARgba(d?.color || colorPistaActual, Math.max(0, 1 - t).toFixed(2)))
    .ringMaxRadius('radioMax')
    .ringPropagationSpeed('velocidad')
    .ringRepeatPeriod('repeticion')
    .htmlElementsData(datosMarcador)
    .htmlElement((d) => {
      const el = document.createElement('div')
      el.className = 'globe-target-beacon'
      el.style.setProperty('--beacon-color', d.color || '#ff79c6')
      el.innerHTML = '<span class="beacon-core"></span><span class="beacon-ping"></span>'
      return el
    })
    .htmlAltitude(0.015)
    .onGlobeClick(({ lat, lng }) => {
      if (instanciaGlobo.controls().autoRotate) {
        instanciaGlobo.controls().autoRotate = false
      }
      enfocarUbicacion(lat, lng)
      dispararOnda(lat, lng, colorPistaActual)
      if (typeof alSeleccionarUbicacion === 'function') {
        alSeleccionarUbicacion(lat, lng)
      }
    })

  var renderer = instanciaGlobo.renderer()
  if (renderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.powerPreference = 'high-performance'
    if (typeof THREE !== 'undefined' && THREE.ACESFilmicToneMapping) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.2
    }
  }

  var scene = instanciaGlobo.scene()
  if (scene && typeof THREE !== 'undefined') {
    const ambientLight = scene.children.find((c) => c.isAmbientLight)
    if (ambientLight) {
      ambientLight.color.setHex(0xb0c4de)
      ambientLight.intensity = 0.95
    }

    const dirLight = scene.children.find((c) => c.isDirectionalLight)
    if (dirLight) {
      dirLight.color.setHex(0xffffff)
      dirLight.intensity = 1.35
      dirLight.position.set(1.5, 1, 1.2)
    }
  }

  var controles = instanciaGlobo.controls()
  controles.autoRotate = true
  controles.autoRotateSpeed = 0.35
  controles.enableDamping = true
  controles.dampingFactor = 0.06

  instanciaGlobo.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 0)

  let redimensionando = false
  function ajustarDimensiones() {
    redimensionando = false
    if (!instanciaGlobo || !contenedor) return
    instanciaGlobo.width(contenedor.clientWidth)
    instanciaGlobo.height(contenedor.clientHeight)
  }

  window.addEventListener('resize', () => {
    if (!redimensionando) {
      redimensionando = true
      requestAnimationFrame(ajustarDimensiones)
    }
  })

  window.addEventListener('orientationchange', () => {
    setTimeout(ajustarDimensiones, 150)
  })

  return instanciaGlobo
}

export function actualizarColorPistaGlobo(colorHex) {
  if (!colorHex) return
  colorPistaActual = colorHex
  if (datosMarcador.length > 0) {
    datosMarcador[0].color = colorHex
    if (instanciaGlobo) {
      instanciaGlobo.htmlElementsData([...datosMarcador])
    }
  }
}

export function fijarMarcadorUbicacion(lat, lng, colorHex) {
  if (!instanciaGlobo) return
  const color = colorHex || colorPistaActual
  datosMarcador = [{ lat, lng, color }]
  instanciaGlobo.htmlElementsData(datosMarcador)
}

export function limpiarMarcadorUbicacion() {
  datosMarcador = []
  if (instanciaGlobo) {
    instanciaGlobo.htmlElementsData([])
  }
}

export function dispararOnda(lat, lng, colorHex) {
  if (!instanciaGlobo) return
  const color = colorHex || colorPistaActual

  if (temporizadorOnda) {
    clearTimeout(temporizadorOnda)
    temporizadorOnda = null
  }

  fijarMarcadorUbicacion(lat, lng, color)

  var nuevoAnillo = {
    lat: lat,
    lng: lng,
    color: color,
    radioMax: 11,
    velocidad: 2.6,
    repeticion: 800
  }

  anillosActuales = [nuevoAnillo]
  instanciaGlobo.ringsData(anillosActuales)

  temporizadorOnda = setTimeout(() => {
    anillosActuales = []
    if (instanciaGlobo) {
      instanciaGlobo.ringsData([])
    }
    temporizadorOnda = null
  }, 4500)
}

export function enfocarUbicacion(lat, lng, altitud = 1.8) {
  if (!instanciaGlobo) return
  instanciaGlobo.pointOfView({ lat, lng, altitude: altitud }, 1200)
}

export function alternarRotacionGlobo(forzarEstado) {
  if (!instanciaGlobo) return false
  var controles = instanciaGlobo.controls()
  if (typeof forzarEstado === 'boolean') {
    controles.autoRotate = forzarEstado
  } else {
    controles.autoRotate = !controles.autoRotate
  }
  return controles.autoRotate
}

export function obtenerRotacionGlobo() {
  if (!instanciaGlobo) return false
  return !!instanciaGlobo.controls().autoRotate
}
