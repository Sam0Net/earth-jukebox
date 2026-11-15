# The Earth Information Jukebox

<p align="center">
  <em>"At least 2.2 billion people have a near or distance vision impairment"</em><br>
  — <strong>World Health Organization (WHO), 2026</strong>
</p>

<p align="center">
  <strong>Developed for the NASA Space Apps Challenge 2026</strong><br>
  <em>Challenge: The Earth Information Jukebox</em>
</p>

---

## 🌍 Overview

**The Earth Information Jukebox** transforms NASA satellite visualizations into dynamic, real-time House music soundscapes. By interacting with an interactive 3D globe, users can sample coordinate pixels directly from NASA Earth Information Center (EIC) data streams. The system analyzes pixel brightness, RGB balance, and chromatic density in real time, mapping visual Earth science into evolving electronic music subgenres.

Our mission is to make complex Earth science **accessible, multi-sensory, and engaging** for everyone—especially blind and low-vision individuals—by converting vital environmental visual data into intuitive, emotive, and pleasant auditory experiences.

---

## 🎵 How It Works

```
┌────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│   NASA EIC Satellite   │ ───► │  5×5 Matrix Sampling &  │ ───► │ Tone.js Sound Synthesis │
│  Video Stream (H.264)  │      │   Color Space Analysis  │      │  (Tempo, Pitch, Chords) │
└────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
            ▲                                                                 │
            │ Coordinates (Lat / Lon)                                         ▼
┌────────────────────────┐                                       ┌─────────────────────────┐
│  Interactive 3D Globe  │ ◄──────────────────────────────────── │ Dynamic House Soundscape│
│  (Globe.gl / Three.js) │                                       │ (Acid, Deep, Afro, etc) │
└────────────────────────┘                                       └─────────────────────────┘
```

1. **Equirectangular Video Synchronization**: High-definition NASA scientific visualization videos loop seamlessly in the background as equirectangular frames ($2:1$ aspect ratio).
2. **Spatial Coordinate Sampling**: When a user clicks, hovers, or triggers autoplay coordinates on the 3D globe, geographic coordinates $(\text{latitude}, \text{longitude})$ are mapped to frame pixels $(X, Y)$.
3. **5×5 Kernel Matrix Analysis**: To prevent abrupt auditory jumps from digital noise or clouds, a $5\times5$ pixel kernel is analyzed to compute weighted average brightness, dominant hue, and chromatic energy.
4. **Algorithmic Musical Synthesis**: Rather than playing pre-recorded audio loops, **Tone.js** synthesizes musical elements in real time (chords, basslines, percussion, arpeggios, and atmospheric filters) locked to a 4/4 House tempo.

---

## 🎧 Climate Phenomena & Musical Subgenres

Each active satellite layer is assigned a bespoke electronic House subgenre designed to reflect both the scientific nature and emotional gravity of the data:

| Layer | NASA Satellite Dataset | Musical Subgenre | Sonification Characteristics |
| :--- | :--- | :--- | :--- |
| 🔥 **Wildfires** | *Active Fires as Observed by VIIRS* | **Acid House** | Resonant 303 acid bassline, high-speed 16th-note arpeggios, overdrive distortion driven by heat intensity. |
| 🌿 **Methane** | *Methane Emissions from Wetlands* | **Afro Deep House** | Organic polyrhythms, warm Fender Rhodes chords, deep sub-bass driven by tropical wetland density. |
| 🌊 **Oceans** | *Global Sea Surface Currents & Temp* | **Progressive House** | Oceanic atmospheric pads, soaring leads, rhythmic delay sweeps responding to current velocities. |
| 🏭 **CO₂** | *DYAMOND Global Carbon Dioxide* | **Tech House** | Driving punchy kick drum, industrial metallic stabs, tension risers modulated by greenhouse PPM. |
| 🛡️ **Ozone** | *Near-Surface Ozone ($O_3$)* | **Deep Minimal House** | Hypnotic micro-percussions, smooth sine sub-bass, ethereal space reverbs. |
| 🌧️ **Precipitation** | *GEOS-FP Precipitation & Cloud Systems* | **Melodic Liquid House** | Fluid piano chords, atmospheric precipitation noise generators, shimmering spatial delays. |
| 📁 **Custom Video** | *User-Uploaded MP4 / WebM* | **Adaptive House** | Dynamically adapts tempo, root key, and filter parameters to match user-provided media. |

---

## ♿ Accessibility & Inclusivity (WCAG 2.2 Compliant)

Accessibility is at the core of the Earth Jukebox:
- **Screen Reader Support**: Live updates via `aria-live="polite"` announce selected regions, active climate layers, coordinates, and sonification parameters.
- **Bilingual Internationalization (i18n)**: English by default, with an instant toggle to Spanish in the Accessibility menu.
- **Keyboard Navigation**: Full interface navigation via `Tab`, `Shift+Tab`, `Enter`, `Space`, and `Esc`.
- **Auto-Tour / Exploration Mode**: Automated cyclical globe navigation for users unable to use mouse pointer devices.
- **Dracula High-Contrast Palette**: Optimized contrast ratios meeting WCAG AAA requirements for low-vision and color-blind users.

---

## 📁 Repository Structure

```
earth-jukebox/
├── index.html               # Main HTML5 application shell & accessibility landmarks
├── styles/
│   └── main.css             # Dracula high-contrast UI design system & responsive layout
├── js/
│   ├── main.js              # Application lifecycle, DOM orchestration, and event binding
│   ├── globeView.js         # 3D interactive Earth globe (Globe.gl + Three.js)
│   ├── videoScanner.js      # Real-time HTML5 Canvas 5x5 pixel extraction (EscanerVideo)
│   ├── audioEngine.js       # Real-time Web Audio synthesis engine (MotorAudioHouse)
│   └── i18n.js              # Bilingual localization system (EN / ES)
└── assets/
    ├── posters/             # Ultra-light WebP first-frame posters (~30-220 KB each)
    │   ├── fires.webp
    │   ├── wet.webp
    │   ├── ocean.webp
    │   ├── co2.webp
    │   ├── o3.webp
    │   └── precipitation.webp
    └── videos/              # Pre-optimized web-ready satellite video datasets (<15 MB each)
        ├── fires.mp4         # Active Wildfires (VIIRS, 1.8 MB)
        ├── wet.mp4           # Wetland Methane Emissions (2.7 MB)
        ├── ocean.mp4         # Sea Surface Temperature & Currents (13 MB)
        ├── co2.mp4           # Global Carbon Dioxide Concentrations (4.3 MB)
        ├── o3.mp4            # Near-Surface Ozone (4.7 MB)
        └── precipitation.mp4 # Precipitation and Cloud Systems (5.5 MB)
```

> **Note on Datasets**: All 6 satellite `.mp4` video files are optimized (H.264, 1280×640 equirectangular, stripped audio, `<15 MB` each, ~32 MB combined total) and tracked directly in this repository. No external downloads are required to run the project.

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Sam0Net/earth-jukebox.git
cd earth-jukebox
```

### 2. Start a Local HTTP Server

Due to browser security policies governing Web Audio API, Canvas 2D pixel extraction, and ES Modules, the app must be served over an HTTP server rather than opened directly via `file://`.

**Option A (Python 3):**
```bash
python3 -m http.server 8080
```

**Option B (Node.js / npx):**
```bash
npx serve .
```

**Option C (PHP):**
```bash
php -S localhost:8080
```

### 3. Open in Browser

Navigate to `http://localhost:8080` in any modern web browser (Chrome, Firefox, Safari, Edge).

---

## 🛰️ NASA Scientific Data Sources

Satellite video visualizations are produced by the **NASA Scientific Visualization Studio (SVS)** and the **Earth Information Center (EIC)**:

| Layer | Original NASA Dataset Title | SVS Identifier & Source Link |
| :--- | :--- | :--- |
| **Active Fires** | *Active Fires As Observed by VIIRS, 2024-Present* | [SVS Entry #5113](https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005113/) |
| **Wetlands Methane** | *Methane Emissions from Wetlands* | [SVS Entry #5054](https://svs.gsfc.nasa.gov/vis/a000000/a005000/a005054/) |
| **Ocean Temperature** | *Global Sea Surface Currents and Temperature* | [SVS Entry #3912](https://svs.gsfc.nasa.gov/vis/a000000/a003900/a003912/) |
| **Atmospheric CO₂** | *DYAMOND Global Carbon Dioxide for Science On A Sphere* | [SVS Entry #5436](https://svs.gsfc.nasa.gov/vis/a000000/a005400/a005436/) |
| **Surface Ozone (O₃)** | *Near Surface Ozone (O3)* | [SVS Entry #5152](https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005152/) |
| **Precipitation & Clouds** | *GEOS-FP Precipitation and Clouds* | [SVS Entry #5149](https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005149/) |

---

## 💻 Tech Stack & Dependencies

- **[Globe.gl](https://globe.gl/)**: 3D globe data visualization component.
- **[Three.js](https://threejs.org/)**: WebGL 3D rendering pipeline and camera raycasting.
- **[Tone.js](https://tonejs.github.io/)**: Interactive Web Audio API framework for polyphonic synthesis, sequencing, and effects.
- **HTML5 Canvas 2D + Video Element**: Real-time pixel buffer sampling and matrix kernel extraction.
- **[Dracula UI Palette](https://draculatheme.com/)**: High-contrast, accessibility-first visual dark theme.

---

## 👥 Project Team & Contributions

Developed for the **NASA Space Apps Challenge 2026**:

* **Sam0Net**
  * **Lead Architecture & Full-Stack Development**: Core software architecture, event coordination, and performance engineering.
  * **3D WebGL & Coordinate Geometry**: 3D globe integration (`globeView.js`), raycasting, and equirectangular spherical coordinate transformations.
  * **Real-Time Sonification Engine**: Mathematical parameter mapping, synthesizer modeling, and musical sequencer timing in Tone.js (`audioEngine.js`).
  * **Accessibility & Localization**: WCAG compliance, screen reader integration, and English/Spanish bilingual framework (`i18n.js`).

* **JLoayz**
  * **Frontend Development & UI/UX**: User interface engineering, interactive control panel design, responsive layout, and Dracula styling.
  * **Video Editing & Multimedia Production**: Video editing, official hackathon presentation video production, visual pacing, and demo showreels.
  * **Sound Design & Musical Curation**: House subgenre selection, harmonic scale design, tempo calibration, and audio parameter tuning.
  * **Project Documentation & Storytelling**: Challenge proposal formulation, scientific research synthesis, and presentation documentation.

---

<p align="center">
  <strong>NASA Space Apps Challenge 2026 — The Earth Information Jukebox 🌎✨</strong>
</p>
