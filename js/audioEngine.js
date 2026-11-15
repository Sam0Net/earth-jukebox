class MotorAudioHouse {
  constructor() {
    this.estaInicializado = false
    this.estaSilenciado = false
    this.estaReproduciendo = false
 
    this.compresorMaestro = null
    this.filtroMaestro = null
    this.reverberacion = null
 
    this.bombo = null
    this.hiHatCerrado = null
    this.hiHatAbierto = null
    this.palmada = null
    this.percBongo = null
    this.oleaje = null
 
    this.sinteAcido = null
    this.bajoSub = null
    this.sinteAcordes = null
    this.sinteMarimba = null
    this.padOceano = null
    this.arpegioCristal = null
 
    this.bpmActual = 124
    this.contadorPasos = 0
    this.idEvento = null
    this.obtenerFrame = null
    this.pistaActual = 'fires'
    this.luminanciaSuavizada = 90
    this.corteBase = 1200
    this.rangoCorte = 20
    this.corteMaximo = 9000
 
    this.escalas = {
      fires: ['C2', 'Eb2', 'F2', 'G2', 'Bb2', 'C3', 'Eb3', 'G3', 'Bb3', 'C4'],
      met: ['F3', 'G3', 'A3', 'C4', 'D4', 'F4', 'G4', 'A4', 'C5', 'D5'],
      ocean: ['D3', 'E3', 'F3', 'A3', 'C4', 'D4', 'E4', 'A4', 'C5', 'E5']
    }
 
    this.raicesFuegos = ['C2', 'Ab1', 'Bb1', 'G1']
    this.acordesFuegos = [
      ['C4', 'Eb4', 'G4'],
      ['Ab3', 'C4', 'Eb4'],
      ['Bb3', 'D4', 'F4'],
      ['G3', 'Bb3', 'D4']
    ]
    this.patronesAcido = [
      [0, null, 0, 12, null, 0, 3, null, 0, null, 7, null, 0, 12, null, 5],
      [0, 0, null, 3, 0, null, 12, null, 0, null, 0, 10, null, 7, null, 0],
      [0, null, 12, null, 0, 7, null, 5, 0, 0, null, 3, null, 10, 12, null],
      [0, null, null, 0, 12, null, 0, 7, null, 0, 3, null, 5, null, 7, 10]
    ]
    this.percusionFuegos = [
      [null, null, null, 'G3', null, null, null, 'C4', null, null, 'G3', null, null, null, 'C4', null],
      [null, null, 'C4', null, null, 'G3', null, null, null, 'C4', null, null, null, 'G3', null, 'C4'],
      [null, null, null, null, 'G3', null, null, 'C4', null, null, null, 'G3', null, 'C4', null, null]
    ]
 
    this.raicesOceano = ['D2', 'Bb1', 'F2', 'A1']
    this.acordesOceano = [
      ['D3', 'F3', 'A3', 'C4', 'E4'],
      ['Bb2', 'D3', 'F3', 'A3', 'C4'],
      ['F3', 'A3', 'C4', 'E4', 'G4'],
      ['A2', 'E3', 'G3', 'C4', 'E4']
    ]
    this.patronesBajoOceano = [
      [0, null, null, 12, null, null, 0, null, null, 0, null, null, 7, null, null, null],
      [0, null, null, null, null, 0, null, null, 12, null, null, 0, null, null, 7, null],
      [0, null, 12, null, null, null, 0, null, null, null, 0, null, null, 5, null, null]
    ]
    this.patronesArpegioOceano = [
      [0, null, 2, null, 1, null, 3, 2, null, 4, null, 3, 1, null, 2, null],
      [null, 0, null, 2, 3, null, 1, null, 4, null, 2, 3, null, 1, null, 0],
      [0, 1, 2, null, 3, 2, 1, null, 0, null, 4, null, 3, null, 2, 1]
    ]
  }
 
  async iniciar() {
    if (this.estaInicializado) return
 
    await Tone.start()
 
    this.compresorMaestro = new Tone.Compressor({
      threshold: -12,
      ratio: 4,
      attack: 0.02,
      release: 0.12
    }).toDestination()
 
    this.filtroMaestro = new Tone.Filter({
      frequency: 2200,
      type: 'lowpass',
      rolloff: -12
    }).connect(this.compresorMaestro)
 
    this.reverberacion = new Tone.Reverb({
      decay: 2.5,
      wet: 0.15
    }).connect(this.filtroMaestro)
    await this.reverberacion.generate()
 
    this.bombo = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.28, sustain: 0.0, release: 0.1 }
    }).connect(this.compresorMaestro)
 
    this.hiHatCerrado = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.002, decay: 0.05, sustain: 0.0 }
    }).connect(this.filtroMaestro)
 
    this.hiHatAbierto = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.002, decay: 0.2, sustain: 0.0 }
    }).connect(this.filtroMaestro)
 
    this.palmada = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.004, decay: 0.12, sustain: 0.0 }
    }).connect(this.reverberacion)
 
    this.percBongo = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0.0, release: 0.1 }
    }).connect(this.reverberacion)
 
    this.oleaje = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.4, decay: 0.8, sustain: 0.1, release: 0.6 }
    }).connect(this.reverberacion)
    this.oleaje.volume.value = -12
 
    this.sinteAcido = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      filter: { Q: 4, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.01, decay: 0.18, sustain: 0.2, release: 0.15 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.22,
        sustain: 0.1,
        release: 0.2,
        baseFrequency: 70,
        octaves: 4
      }
    }).connect(this.filtroMaestro)
 
    this.bajoSub = new Tone.MonoSynth({
      oscillator: { type: 'triangle' },
      filter: { Q: 1, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.3 },
      filterEnvelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.4,
        release: 0.3,
        baseFrequency: 80,
        octaves: 2
      }
    }).connect(this.compresorMaestro)
 
    this.sinteAcordes = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.16, sustain: 0.0, release: 0.12 }
    }).connect(this.reverberacion)
 
    this.sinteMarimba = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.008, decay: 0.22, sustain: 0.05, release: 0.3 }
    }).connect(this.reverberacion)
 
    this.padOceano = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.8, decay: 0.8, sustain: 0.8, release: 2.2 }
    }).connect(this.reverberacion)
 
    this.arpegioCristal = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.18, sustain: 0.0, release: 0.4 }
    }).connect(this.reverberacion)
 
    this.estaInicializado = true
  }
 
  silenciar(silenciado) {
    this.estaSilenciado = silenciado
    Tone.getDestination().mute = silenciado
  }
 
  configurarPista(tipoPista) {
    this.pistaActual = tipoPista
 
    this.bombo.volume.value = 0
    this.hiHatCerrado.volume.value = -12
    this.hiHatAbierto.volume.value = -14
    this.palmada.volume.value = -10
    this.percBongo.volume.value = -10
    this.sinteAcido.volume.value = -8
    this.bajoSub.volume.value = -8
    this.sinteAcordes.volume.value = -20
    this.sinteMarimba.volume.value = -8
    this.padOceano.volume.value = -18
    this.arpegioCristal.volume.value = -14
 
    if (tipoPista === 'fires') {
      this.bpmActual = 128
      this.corteBase = 1400
      this.rangoCorte = 22
      this.corteMaximo = 9000
      this.bombo.volume.value = 2
      this.hiHatCerrado.volume.value = -14
      this.hiHatAbierto.volume.value = -13
      this.palmada.volume.value = -8
      this.percBongo.volume.value = -11
      this.sinteAcido.volume.value = -6
      this.sinteAcordes.volume.value = -19
    } else if (tipoPista === 'met') {
      this.bpmActual = 116
      this.corteBase = 350
      this.rangoCorte = 22
      this.corteMaximo = 7000
      this.bombo.volume.value = 0
      this.hiHatCerrado.volume.value = -10
      this.palmada.volume.value = -8
      this.percBongo.volume.value = -3
      this.sinteMarimba.volume.value = -2
    } else {
      this.bpmActual = 122
      this.corteBase = 800
      this.rangoCorte = 14
      this.corteMaximo = 5500
      this.bombo.volume.value = 0
      this.hiHatCerrado.volume.value = -19
      this.hiHatAbierto.volume.value = -17
      this.palmada.volume.value = -16
      this.bajoSub.volume.value = -7
      this.padOceano.volume.value = -16
      this.arpegioCristal.volume.value = -13
      this.oleaje.volume.value = -14
    }
  }
 
  transponer(nota, semitonos) {
    return Tone.Frequency(nota).transpose(semitonos).toNote()
  }
 
  limitar(v) {
    return Math.max(0.05, Math.min(1, v))
  }
 
  tick(tiempo) {
    const frame = this.obtenerFrame ? this.obtenerFrame() : null
 
    let lum = 90
    let r = 120
    let g = 120
    let b = 120
    if (frame) {
      lum = Number(frame.luminancia) || 0
      r = Number(frame.r) || 0
      g = Number(frame.g) || 0
      b = Number(frame.b) || 0
    }
 
    this.luminanciaSuavizada += (lum - this.luminanciaSuavizada) * 0.2
    const corte = Math.min(this.corteBase + this.luminanciaSuavizada * this.rangoCorte, this.corteMaximo)
    this.filtroMaestro.frequency.rampTo(corte, 0.1)
 
    const paso = this.contadorPasos
    const s = paso % 16
    const indiceCompas = Math.floor(paso / 16)
    const frase = indiceCompas % 8
    const densidad = Math.min(1, 0.5 + (this.luminanciaSuavizada / 255) * 0.5)
 
    if (this.pistaActual === 'fires') {
      this.tickFuegos(tiempo, s, indiceCompas, frase, densidad, r, g, b)
    } else if (this.pistaActual === 'met') {
      this.tickMetano(tiempo, paso, g, lum)
    } else {
      this.tickOceano(tiempo, s, indiceCompas, frase, densidad, r, g, b)
    }
 
    this.contadorPasos++
  }
 
  tickFuegos(tiempo, s, indiceCompas, frase, densidad, r, g, b) {
    const indiceAcorde = Math.floor(indiceCompas / 2) % 4
    const raiz = this.raicesFuegos[indiceAcorde]
    const acorde = this.acordesFuegos[indiceAcorde]
    const intro = frase < 2
    const compasRelleno = frase === 7
 
    if (s % 4 === 0) {
      if (!(compasRelleno && s >= 12)) {
        this.bombo.triggerAttackRelease('C1', '8n', tiempo, 1.0)
      }
    }
 
    if (!intro && (s === 4 || s === 12)) {
      this.palmada.triggerAttackRelease('16n', tiempo, 0.85)
    }
 
    if (compasRelleno && s >= 8 && s % 2 === 0) {
      this.palmada.triggerAttackRelease('32n', tiempo, this.limitar(0.3 + (s - 8) * 0.1))
    }
 
    if (s % 4 === 2) {
      this.hiHatAbierto.triggerAttackRelease('16n', tiempo, 0.6)
    } else if (s % 2 === 1) {
      if (Math.random() < 0.55 + densidad * 0.3) {
        this.hiHatCerrado.triggerAttackRelease('32n', tiempo, this.limitar(0.25 + Math.random() * 0.3 + r / 1200))
      }
    } else if (s % 4 === 0 && !intro) {
      this.hiHatCerrado.triggerAttackRelease('32n', tiempo, 0.3)
    }
 
    if (!intro) {
      const patronPerc = this.percusionFuegos[(indiceCompas + Math.floor(b / 90)) % this.percusionFuegos.length]
      const notaPerc = patronPerc[s]
      if (notaPerc && Math.random() < densidad) {
        this.percBongo.triggerAttackRelease(notaPerc, '16n', tiempo, 0.55 + Math.random() * 0.2)
      }
    }
 
    if (s === 0) {
      this.sinteAcido.filterEnvelope.octaves = 2 + (g / 255) * 3
    }
 
    const patron = this.patronesAcido[(indiceCompas + Math.floor(r / 64)) % this.patronesAcido.length]
    const semitonos = patron[s]
    if (semitonos !== null && semitonos !== undefined) {
      const acento = s % 4 === 0
      if (acento || Math.random() < densidad) {
        const nota = this.transponer(raiz, semitonos)
        const dur = acento ? '8n' : '16n'
        const vel = acento ? 0.95 : this.limitar(0.5 + Math.random() * 0.25)
        this.sinteAcido.triggerAttackRelease(nota, dur, tiempo, vel)
      }
    }
 
    if (!intro && (s === 3 || s === 10 || (frase >= 5 && s === 6))) {
      this.sinteAcordes.triggerAttackRelease(acorde, '16n', tiempo, this.limitar(0.3 + g / 800))
    }
  }
 
  tickOceano(tiempo, s, indiceCompas, frase, densidad, r, g, b) {
    const indiceAcorde = Math.floor(indiceCompas / 2) % 4
    const raiz = this.raicesOceano[indiceAcorde]
    const acorde = this.acordesOceano[indiceAcorde]
    const pausa = frase === 7
    const intro = frase === 0 && indiceCompas < 8
 
    if (s % 4 === 0 && !pausa) {
      this.bombo.triggerAttackRelease('D1', '8n', tiempo, 0.9)
    }
 
    if (!intro && !pausa && (s === 4 || s === 12)) {
      this.palmada.triggerAttackRelease('16n', tiempo, 0.45)
    }
 
    if (s % 4 === 2) {
      this.hiHatAbierto.triggerAttackRelease('16n', tiempo, 0.5)
    }
    const velHat = [0.15, 0.3, 0.2, 0.35][s % 4]
    if (s % 4 !== 2 && Math.random() < 0.5 + densidad * 0.4) {
      this.hiHatCerrado.triggerAttackRelease('32n', tiempo, this.limitar(velHat + Math.random() * 0.15))
    }
 
    if (s === 0 && indiceCompas % 2 === 0) {
      this.padOceano.triggerAttackRelease(acorde, '2m', tiempo, 0.45)
    }
 
    if (s === 0 && indiceCompas % 4 === 0) {
      this.oleaje.triggerAttackRelease('1m', tiempo, 0.4)
    }
 
    if (!pausa) {
      const patronBajo = this.patronesBajoOceano[(Math.floor(indiceCompas / 2) + Math.floor(r / 100)) % this.patronesBajoOceano.length]
      const semitonosBajo = patronBajo[s]
      if (semitonosBajo !== null && semitonosBajo !== undefined) {
        const nota = this.transponer(raiz, semitonosBajo)
        this.bajoSub.triggerAttackRelease(nota, '8n', tiempo, s === 0 ? 0.9 : 0.65)
      }
    }
 
    if (!intro) {
      const patronArpegio = this.patronesArpegioOceano[(indiceCompas + Math.floor(b / 64)) % this.patronesArpegioOceano.length]
      const indice = patronArpegio[s]
      if (indice !== null && indice !== undefined && Math.random() < 0.55 + densidad * 0.4) {
        const nota = this.transponer(acorde[indice % acorde.length], 12)
        const vel = this.limitar(0.3 + (b / 255) * 0.35 + Math.random() * 0.1)
        this.arpegioCristal.triggerAttackRelease(nota, '16n', tiempo, vel)
      }
    }
  }
 
  tickMetano(tiempo, paso, g, lum) {
    if (paso % 2 !== 0) return
    const s8 = paso / 2
    const escalaActual = this.escalas.met
    const indiceMax = escalaActual.length - 1
 
    if (s8 % 8 === 0 || s8 % 16 === 10) {
      this.bombo.triggerAttackRelease('F1', '8n', tiempo, 0.85)
    }
    if (s8 % 4 === 1 || s8 % 8 === 6) {
      const tonoBongo = s8 % 2 === 0 ? 'C3' : 'G2'
      this.percBongo.triggerAttackRelease(tonoBongo, '16n', tiempo, 0.75)
    }
    if (s8 % 2 === 1) {
      this.hiHatCerrado.triggerAttackRelease('32n', tiempo, 0.4)
    }
    const indiceG = Math.min(Math.floor((g / 255) * indiceMax), indiceMax)
    const notaMarimba = escalaActual[indiceG]
    if (s8 % 2 === 0 || lum > 80) {
      this.sinteMarimba.triggerAttackRelease(notaMarimba, '8n', tiempo + 0.04, this.limitar(0.6 + lum / 400))
    }
  }
 
  iniciarReproduccion(tipoPista, obtenerDatosFrameActual) {
    this.detenerReproduccion()
    this.configurarPista(tipoPista)
    this.contadorPasos = 0
    this.luminanciaSuavizada = 90
    this.obtenerFrame = obtenerDatosFrameActual
    this.estaReproduciendo = true
 
    const transporte = Tone.getTransport()
    transporte.cancel(0)
    transporte.bpm.value = this.bpmActual
    transporte.swingSubdivision = '16n'
    transporte.swing = tipoPista === 'ocean' ? 0.18 : 0.1
 
    this.idEvento = transporte.scheduleRepeat((tiempo) => {
      if (!this.estaReproduciendo) return
      this.tick(tiempo)
    }, '16n')
 
    transporte.start('+0.05')
  }
 
  detenerReproduccion() {
    this.estaReproduciendo = false
    const transporte = Tone.getTransport()
    if (this.idEvento !== null) {
      transporte.clear(this.idEvento)
      this.idEvento = null
    }
    transporte.stop()
    transporte.cancel(0)
    if (this.estaInicializado) {
      this.padOceano.releaseAll()
      this.sinteAcordes.releaseAll()
      this.arpegioCristal.releaseAll()
      this.sinteMarimba.releaseAll()
    }
  }
}
 
export const motorAudio = new MotorAudioHouse()