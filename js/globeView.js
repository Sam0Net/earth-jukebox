var globeInstance = null
var currentRings = []

export function initGlobe(containerId, onLocationSelected) {
  var container = document.getElementById(containerId)
  
  if (!container) {
    console.log('no encontre el contenedor')
    return
  }

  globeInstance = Globe()(container)
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
    .showAtmosphere(true)
    .atmosphereColor('#bd93f9')
    .atmosphereAltitude(0.22)
    .ringColor(() => (t) => `rgba(189, 147, 249, ${Math.max(0, 1 - t)})`)
    .ringMaxRadius('maxR')
    .ringPropagationSpeed('speed')
    .ringRepeatPeriod('repeat')
    .onGlobeClick(({ lat, lng }) => {
      if (globeInstance.controls().autoRotate) {
        globeInstance.controls().autoRotate = false
      }
      focusLocation(lat, lng)
      triggerRipple(lat, lng)
      if (typeof onLocationSelected === 'function') {
        onLocationSelected(lat, lng)
      }
    })

  var controls = globeInstance.controls()
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.35
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  globeInstance.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 0)

  window.addEventListener('resize', () => {
    globeInstance.width(window.innerWidth)
    globeInstance.height(window.innerHeight)
  })

  return globeInstance
}

export function triggerRipple(lat, lng) {
  if (!globeInstance) return

  var newRing = {
    lat: lat,
    lng: lng,
    maxR: 9,
    speed: 2.2,
    repeat: 0
  }

  currentRings = [newRing]
  globeInstance.ringsData(currentRings)

  setTimeout(() => {
    currentRings = []
    globeInstance.ringsData([])
  }, 4200)
}

export function focusLocation(lat, lng, altitude = 1.8) {
  if (!globeInstance) return
  globeInstance.pointOfView({ lat, lng, altitude }, 1200)
}
