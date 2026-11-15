# The Earth Information Jukebox

Proyecto desarrollado para el NASA Space Apps Challenge.

Convierte videos satelitales de la NASA en musica House en tiempo real. El usuario hace clic en cualquier punto del globo terraqueo 3D y el sistema analiza el color del pixel en ese punto dentro del video satelital, generando un beat de House distinto segun el fenomeno climatico activo.

---

## Como funciona

1. Se carga un video satelital de la NASA en segundo plano
2. El usuario hace clic en un punto del globo 3D
3. El sistema lee el valor RGB del pixel correspondiente a esas coordenadas en el video
4. Con esos datos se genera musica House en tiempo real usando Tone.js

Cada fenomeno tiene su propio subgenero:

- **Incendios forestales** - Acid House 128 BPM (sintetizador TB-303, canal rojo)
- **Metano en humedales** - Afro Deep House 116 BPM (marimba, canal verde)
- **Temperatura oceanica** - Progressive House 122 BPM (pad oceanico, canal azul)

---

## Estructura del proyecto

```
earth-jukebox/
├── index.html
├── styles/
│   └── main.css
├── js/
│   ├── main.js            <- logica de la interfaz y coordinacion general
│   ├── globeView.js       <- globo 3D (Globe.gl)
│   ├── videoScanner.js    <- lectura de pixeles del video (clase EscanerVideo)
│   ├── audioEngine.js     <- sintesis de audio (clase MotorAudioHouse)
│   └── i18n.js            <- sistema de internacionalización (inglés por defecto y español)
└── assets/
    └── videos/
        ├── fires.mp4     <- video NASA de incendios forestales (no incluido en el repo)
        ├── wet.mp4       <- video NASA de emisiones de metano (no incluido en el repo)
        ├── ocean.mp4     <- video NASA de temperatura oceanica (no incluido en el repo)
        ├── co2.mp4       <- video NASA de dióxido de carbono (no incluido en el repo)
        ├── o3.mp4        <- video NASA de capa de ozono (no incluido en el repo)
        └── precipitation.mp4 <- video NASA de precipitación global (no incluido en el repo)
```

> Los archivos `.mp4` no estan incluidos en el repositorio por su tamano. Ver la seccion de instalacion.

---

## Instalacion y uso

### 1. Clonar el repositorio

```bash
git clone https://github.com/Sam0Net/The-Earth-Information-Jukebox.git
cd The-Earth-Information-Jukebox
git checkout AlternativaB
```

### 2. Agregar los videos

Descargar los videos de la NASA y colocarlos en la carpeta `assets/videos/` con exactamente estos nombres:

| Archivo | Fenómeno | Título original | Descarga |
|---------|----------|-----------------|----------|
| `fires.mp4` | Incendios activos | Active Fires As Observed by VIIRS, 2024-Present | [fires_frp_VIIRS_eq_nl_2048p30.mp4](https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005113/fires_frp_VIIRS_eq_nl_2048p30.mp4) |
| `wet.mp4` | Emisiones de metano en humedales | Methane Emissions from Wetlands | [ch4_wetlands_maponly.mp4](https://svs.gsfc.nasa.gov/vis/a000000/a005000/a005054/ch4_wetlands_maponly.mp4) |
| `ocean.mp4` | Temperatura oceánica | Global Sea Surface Currents and Temperature | [ecco2_sst_flow.mp4](https://svs.gsfc.nasa.gov/vis/a000000/a003900/a003912/ecco2_sst_flow.mp4) |
| `co2.mp4` | Dióxido de carbono (CO2) | Global Atmospheric Carbon Dioxide (GEOS Model) | NASA Scientific Visualization Studio |
| `o3.mp4` | Capa de ozono (O3) | Stratospheric Ozone and Antarctic Ozone Hole | NASA Ozone Watch / OMPS |
| `precipitation.mp4` | Precipitación global | Global Precipitation Measurement (GPM IMERG) | NASA SVS / GPM Core Observatory |

Los videos originales se descargan con otro nombre, por lo que hay que renombrarlos a `fires.mp4`, `wet.mp4` y `ocean.mp4`.

> **Tip de optimización:** Si los videos descargados vienen en resolución 4K (como 4096×2048 o con pistas de audio pesadas), se pueden optimizar para máxima fluidez a 60 FPS y menor consumo de memoria con:
> ```bash
> ffmpeg -i assets/videos/fires.mp4 -vf "scale=2048:1024" -c:v libx264 -preset fast -crf 22 -an -movflags +faststart /tmp/f.mp4 && mv /tmp/f.mp4 assets/videos/fires.mp4
> ffmpeg -i assets/videos/wet.mp4 -vf "scale=1920:1080" -c:v libx264 -preset fast -crf 22 -an -movflags +faststart /tmp/w.mp4 && mv /tmp/w.mp4 assets/videos/wet.mp4
> ```

También se puede usar el botón **Subir tu propio video** dentro de la app para cargar cualquier video MP4 o WebM.

Créditos de los videos: NASA Scientific Visualization Studio.

### 3. Levantar un servidor local

No se puede abrir `index.html` directamente desde el sistema de archivos porque el navegador bloquea los modulos ES y el acceso al canvas. Se necesita un servidor:

```bash
python3 -m http.server 8080
```

Luego abrir en el navegador: `http://localhost:8080`

---

## Convenciones del codigo

- Los nombres de clases, funciones, variables y propiedades estan en español.
- Se mantienen en ingles las APIs de las librerias (Tone.js, Globe.gl), los ids del HTML, las clases del CSS y las claves internas de cada pista (`fires`, `met`, `ocean`, `custom`).

---

## Tecnologias usadas

- [Globe.gl](https://globe.gl/) - Globo terraqueo 3D
- [Three.js](https://threejs.org/) - Renderizado 3D
- [Tone.js](https://tonejs.github.io/) - Sintesis de audio en el navegador
- HTML5 Video API + Canvas 2D - Analisis de fotogramas
- Tema visual: [Dracula Theme](https://draculatheme.com/)

---

## Integrantes
- Sam0Net
- JLoayz
- 
NASA Space Apps Challenge 2026
