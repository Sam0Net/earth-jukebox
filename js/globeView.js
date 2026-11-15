var instanciaGlobo = null
var anillosActuales = []

export function iniciarGlobo(idContenedor, alSeleccionarUbicacion) {
  var contenedor = document.getElementById(idContenedor)
  
  if (!contenedor) {
    console.log('no encontre el contenedor')
    return
  }

  instanciaGlobo = Globe()(contenedor)
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundColor('rgba(0, 0, 0, 0)')
    .showAtmosphere(true)
    .atmosphereColor('#6272a4')
    .atmosphereAltitude(0.15)
    .ringColor(() => (t) => `rgba(139, 233, 253, ${Math.max(0, 1 - t)})`)
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

  var controles = instanciaGlobo.controls()
  controles.autoRotate = true
  controles.autoRotateSpeed = 0.35
  controles.enableDamping = true
  controles.dampingFactor = 0.05

  instanciaGlobo.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 0)

  window.addEventListener('resize', () => {
    instanciaGlobo.width(contenedor.clientWidth)
    instanciaGlobo.height(contenedor.clientHeight)
  })

  return instanciaGlobo
}

export function dispararOnda(lat, lng) {
  if (!instanciaGlobo) return

  var nuevoAnillo = {
    lat: lat,
    lng: lng,
    radioMax: 9,
    velocidad: 2.2,
    repeticion: 0
  }

  anillosActuales = [nuevoAnillo]
  instanciaGlobo.ringsData(anillosActuales)

  setTimeout(() => {
    anillosActuales = []
    instanciaGlobo.ringsData([])
  }, 4200)
}

export function enfocarUbicacion(lat, lng, altitud = 1.8) {
  if (!instanciaGlobo) return
  instanciaGlobo.pointOfView({ lat, lng, altitude: altitud }, 1200)
}