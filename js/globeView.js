var instanciaGlobo = null
var anillosActuales = []
var temporizadorOnda = null

const colorOnda = (t) => `rgba(139, 233, 253, ${Math.max(0, 1 - t).toFixed(2)})`

export function iniciarGlobo(idContenedor, alSeleccionarUbicacion) {
  var contenedor = document.getElementById(idContenedor)
  if (!contenedor) return

  instanciaGlobo = Globe()(contenedor)
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundColor('rgba(0, 0, 0, 0)')
    .showAtmosphere(true)
    .atmosphereColor('#6272a4')
    .atmosphereAltitude(0.15)
    .ringColor(() => colorOnda)
    .ringMaxRadius('radioMax')
    .ringPropagationSpeed('velocidad')
    .ringRepeatPeriod('repeticion')
    .onGlobeClick(({ lat, lng }) => {
      if (instanciaGlobo.controls().autoRotate) {
        instanciaGlobo.controls().autoRotate = false
      }
      enfocarUbicacion(lat, lng)
      dispararOnda(lat, lng)
      if (typeof alSeleccionarUbicacion === 'function') {
        alSeleccionarUbicacion(lat, lng)
      }
    })

  var renderer = instanciaGlobo.renderer()
  if (renderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    renderer.powerPreference = 'high-performance'
  }

  var controles = instanciaGlobo.controls()
  controles.autoRotate = true
  controles.autoRotateSpeed = 0.35
  controles.enableDamping = true
  controles.dampingFactor = 0.08

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

export function dispararOnda(lat, lng) {
  if (!instanciaGlobo) return

  if (temporizadorOnda) {
    clearTimeout(temporizadorOnda)
    temporizadorOnda = null
  }

  var nuevoAnillo = {
    lat: lat,
    lng: lng,
    radioMax: 9,
    velocidad: 2.2,
    repeticion: 0
  }

  anillosActuales = [nuevoAnillo]
  instanciaGlobo.ringsData(anillosActuales)

  temporizadorOnda = setTimeout(() => {
    anillosActuales = []
    if (instanciaGlobo) {
      instanciaGlobo.ringsData([])
    }
    temporizadorOnda = null
  }, 4000)
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