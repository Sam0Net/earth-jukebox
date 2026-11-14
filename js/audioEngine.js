
class HouseAudioEngine {
  constructor() {
    this.isInitialized = false
    this.isMuted = false
    this.isPlaying = false
 
    this.masterCompressor = null
    this.masterFilter = null
    this.reverb = null
 
    this.kickDrum = null
    this.hiHat = null
    this.openHat = null
    this.clap = null
    this.bongoPerc = null
    this.oceanSurf = null
 
    this.acidSynth = null
    this.subBass = null
    this.stabSynth = null
    this.marimbaSynth = null
    this.oceanPad = null
    this.crystalArp = null
 
    this.currentBpm = 124
    this.stepCounter = 0
    this.eventId = null
    this.getFrame = null
    this.currentTrack = 'fires'
    this.smoothLum = 90
    this.cutoffBase = 1200
    this.cutoffRange = 20
    this.cutoffMax = 9000
 
    this.scales = {
      fires: ['C2', 'Eb2', 'F2', 'G2', 'Bb2', 'C3', 'Eb3', 'G3', 'Bb3', 'C4'],
      met: ['F3', 'G3', 'A3', 'C4', 'D4', 'F4', 'G4', 'A4', 'C5', 'D5'],
      ocean: ['D3', 'E3', 'F3', 'A3', 'C4', 'D4', 'E4', 'A4', 'C5', 'E5']
    }
 
    this.firesRoots = ['C2', 'Ab1', 'Bb1', 'G1']
    this.firesChords = [
      ['C4', 'Eb4', 'G4'],
      ['Ab3', 'C4', 'Eb4'],
      ['Bb3', 'D4', 'F4'],
      ['G3', 'Bb3', 'D4']
    ]
    this.acidPatterns = [
      [0, null, 0, 12, null, 0, 3, null, 0, null, 7, null, 0, 12, null, 5],
      [0, 0, null, 3, 0, null, 12, null, 0, null, 0, 10, null, 7, null, 0],
      [0, null, 12, null, 0, 7, null, 5, 0, 0, null, 3, null, 10, 12, null],
      [0, null, null, 0, 12, null, 0, 7, null, 0, 3, null, 5, null, 7, 10]
    ]
    this.firesPerc = [
      [null, null, null, 'G3', null, null, null, 'C4', null, null, 'G3', null, null, null, 'C4', null],
      [null, null, 'C4', null, null, 'G3', null, null, null, 'C4', null, null, null, 'G3', null, 'C4'],
      [null, null, null, null, 'G3', null, null, 'C4', null, null, null, 'G3', null, 'C4', null, null]
    ]
 
    this.oceanRoots = ['D2', 'Bb1', 'F2', 'A1']
    this.oceanChords = [
      ['D3', 'F3', 'A3', 'C4', 'E4'],
      ['Bb2', 'D3', 'F3', 'A3', 'C4'],
      ['F3', 'A3', 'C4', 'E4', 'G4'],
      ['A2', 'E3', 'G3', 'C4', 'E4']
    ]
    this.oceanBassPatterns = [
      [0, null, null, 12, null, null, 0, null, null, 0, null, null, 7, null, null, null],
      [0, null, null, null, null, 0, null, null, 12, null, null, 0, null, null, 7, null],
      [0, null, 12, null, null, null, 0, null, null, null, 0, null, null, 5, null, null]
    ]
    this.oceanArpPatterns = [
      [0, null, 2, null, 1, null, 3, 2, null, 4, null, 3, 1, null, 2, null],
      [null, 0, null, 2, 3, null, 1, null, 4, null, 2, 3, null, 1, null, 0],
      [0, 1, 2, null, 3, 2, 1, null, 0, null, 4, null, 3, null, 2, 1]
    ]
  }
 
  async init() {
    if (this.isInitialized) return
 
    await Tone.start()
 
    this.masterCompressor = new Tone.Compressor({
      threshold: -12,
      ratio: 4,
      attack: 0.02,
      release: 0.12
    }).toDestination()
 
    this.masterFilter = new Tone.Filter({
      frequency: 2200,
      type: 'lowpass',
      rolloff: -12
    }).connect(this.masterCompressor)
 
    this.reverb = new Tone.Reverb({
      decay: 2.5,
      wet: 0.15
    }).connect(this.masterFilter)
    await this.reverb.generate()
 
    this.kickDrum = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.28, sustain: 0.0, release: 0.1 }
    }).connect(this.masterCompressor)
 
    this.hiHat = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.002, decay: 0.05, sustain: 0.0 }
    }).connect(this.masterFilter)
 
    this.openHat = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.002, decay: 0.2, sustain: 0.0 }
    }).connect(this.masterFilter)
 
    this.clap = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.004, decay: 0.12, sustain: 0.0 }
    }).connect(this.reverb)
 
    this.bongoPerc = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0.0, release: 0.1 }
    }).connect(this.reverb)
 
    this.oceanSurf = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.4, decay: 0.8, sustain: 0.1, release: 0.6 }
    }).connect(this.reverb)
    this.oceanSurf.volume.value = -12
 
    this.acidSynth = new Tone.MonoSynth({
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
    }).connect(this.masterFilter)
 
    this.subBass = new Tone.MonoSynth({
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
    }).connect(this.masterCompressor)
 
    this.stabSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.16, sustain: 0.0, release: 0.12 }
    }).connect(this.reverb)
 
    this.marimbaSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.008, decay: 0.22, sustain: 0.05, release: 0.3 }
    }).connect(this.reverb)
 
    this.oceanPad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.8, decay: 0.8, sustain: 0.8, release: 2.2 }
    }).connect(this.reverb)
 
    this.crystalArp = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.18, sustain: 0.0, release: 0.4 }
    }).connect(this.reverb)
 
    this.isInitialized = true
  }
 
  setMute(muted) {
    this.isMuted = muted
    Tone.getDestination().mute = muted
  }
 
  configureTrack(trackType) {
    this.currentTrack = trackType
 
    this.kickDrum.volume.value = 0
    this.hiHat.volume.value = -12
    this.openHat.volume.value = -14
    this.clap.volume.value = -10
    this.bongoPerc.volume.value = -10
    this.acidSynth.volume.value = -8
    this.subBass.volume.value = -8
    this.stabSynth.volume.value = -20
    this.marimbaSynth.volume.value = -8
    this.oceanPad.volume.value = -18
    this.crystalArp.volume.value = -14
 
    if (trackType === 'fires') {
      this.currentBpm = 128
      this.cutoffBase = 1400
      this.cutoffRange = 22
      this.cutoffMax = 9000
      this.kickDrum.volume.value = 2
      this.hiHat.volume.value = -14
      this.openHat.volume.value = -13
      this.clap.volume.value = -8
      this.bongoPerc.volume.value = -11
      this.acidSynth.volume.value = -6
      this.stabSynth.volume.value = -19
    } else if (trackType === 'met') {
      this.currentBpm = 116
      this.cutoffBase = 350
      this.cutoffRange = 22
      this.cutoffMax = 7000
      this.kickDrum.volume.value = 0
      this.hiHat.volume.value = -10
      this.clap.volume.value = -8
      this.bongoPerc.volume.value = -3
      this.marimbaSynth.volume.value = -2
    } else {
      this.currentBpm = 122
      this.cutoffBase = 800
      this.cutoffRange = 14
      this.cutoffMax = 5500
      this.kickDrum.volume.value = 0
      this.hiHat.volume.value = -19
      this.openHat.volume.value = -17
      this.clap.volume.value = -16
      this.subBass.volume.value = -7
      this.oceanPad.volume.value = -16
      this.crystalArp.volume.value = -13
      this.oceanSurf.volume.value = -14
    }
  }
 
  shift(note, semitones) {
    return Tone.Frequency(note).transpose(semitones).toNote()
  }
 
  clamp(v) {
    return Math.max(0.05, Math.min(1, v))
  }
 
  tick(time) {
    const frame = this.getFrame ? this.getFrame() : null
 
    let lum = 90
    let r = 120
    let g = 120
    let b = 120
    if (frame) {
      lum = Number(frame.luminance) || 0
      r = Number(frame.r) || 0
      g = Number(frame.g) || 0
      b = Number(frame.b) || 0
    }
 
    this.smoothLum += (lum - this.smoothLum) * 0.2
    const cutoff = Math.min(this.cutoffBase + this.smoothLum * this.cutoffRange, this.cutoffMax)
    this.masterFilter.frequency.rampTo(cutoff, 0.1)
 
    const step = this.stepCounter
    const s = step % 16
    const barIdx = Math.floor(step / 16)
    const phrase = barIdx % 8
    const density = Math.min(1, 0.5 + (this.smoothLum / 255) * 0.5)
 
    if (this.currentTrack === 'fires') {
      this.tickFires(time, s, barIdx, phrase, density, r, g, b)
    } else if (this.currentTrack === 'met') {
      this.tickMet(time, step, g, lum)
    } else {
      this.tickOcean(time, s, barIdx, phrase, density, r, g, b)
    }
 
    this.stepCounter++
  }
 
  tickFires(time, s, barIdx, phrase, density, r, g, b) {
    const chordIdx = Math.floor(barIdx / 2) % 4
    const root = this.firesRoots[chordIdx]
    const chord = this.firesChords[chordIdx]
    const intro = phrase < 2
    const fillBar = phrase === 7
 
    if (s % 4 === 0) {
      if (!(fillBar && s >= 12)) {
        this.kickDrum.triggerAttackRelease('C1', '8n', time, 1.0)
      }
    }
 
    if (!intro && (s === 4 || s === 12)) {
      this.clap.triggerAttackRelease('16n', time, 0.85)
    }
 
    if (fillBar && s >= 8 && s % 2 === 0) {
      this.clap.triggerAttackRelease('32n', time, this.clamp(0.3 + (s - 8) * 0.1))
    }
 
    if (s % 4 === 2) {
      this.openHat.triggerAttackRelease('16n', time, 0.6)
    } else if (s % 2 === 1) {
      if (Math.random() < 0.55 + density * 0.3) {
        this.hiHat.triggerAttackRelease('32n', time, this.clamp(0.25 + Math.random() * 0.3 + r / 1200))
      }
    } else if (s % 4 === 0 && !intro) {
      this.hiHat.triggerAttackRelease('32n', time, 0.3)
    }
 
    if (!intro) {
      const percPattern = this.firesPerc[(barIdx + Math.floor(b / 90)) % this.firesPerc.length]
      const percNote = percPattern[s]
      if (percNote && Math.random() < density) {
        this.bongoPerc.triggerAttackRelease(percNote, '16n', time, 0.55 + Math.random() * 0.2)
      }
    }
 
    if (s === 0) {
      this.acidSynth.filterEnvelope.octaves = 2 + (g / 255) * 3
    }
 
    const pattern = this.acidPatterns[(barIdx + Math.floor(r / 64)) % this.acidPatterns.length]
    const semi = pattern[s]
    if (semi !== null && semi !== undefined) {
      const accent = s % 4 === 0
      if (accent || Math.random() < density) {
        const note = this.shift(root, semi)
        const dur = accent ? '8n' : '16n'
        const vel = accent ? 0.95 : this.clamp(0.5 + Math.random() * 0.25)
        this.acidSynth.triggerAttackRelease(note, dur, time, vel)
      }
    }
 
    if (!intro && (s === 3 || s === 10 || (phrase >= 5 && s === 6))) {
      this.stabSynth.triggerAttackRelease(chord, '16n', time, this.clamp(0.3 + g / 800))
    }
  }
 
  tickOcean(time, s, barIdx, phrase, density, r, g, b) {
    const chordIdx = Math.floor(barIdx / 2) % 4
    const root = this.oceanRoots[chordIdx]
    const chord = this.oceanChords[chordIdx]
    const breakdown = phrase === 7
    const intro = phrase === 0 && barIdx < 8
 
    if (s % 4 === 0 && !breakdown) {
      this.kickDrum.triggerAttackRelease('D1', '8n', time, 0.9)
    }
 
    if (!intro && !breakdown && (s === 4 || s === 12)) {
      this.clap.triggerAttackRelease('16n', time, 0.45)
    }
 
    if (s % 4 === 2) {
      this.openHat.triggerAttackRelease('16n', time, 0.5)
    }
    const hatVel = [0.15, 0.3, 0.2, 0.35][s % 4]
    if (s % 4 !== 2 && Math.random() < 0.5 + density * 0.4) {
      this.hiHat.triggerAttackRelease('32n', time, this.clamp(hatVel + Math.random() * 0.15))
    }
 
    if (s === 0 && barIdx % 2 === 0) {
      this.oceanPad.triggerAttackRelease(chord, '2m', time, 0.45)
    }
 
    if (s === 0 && barIdx % 4 === 0) {
      this.oceanSurf.triggerAttackRelease('1m', time, 0.4)
    }
 
    if (!breakdown) {
      const bassPattern = this.oceanBassPatterns[(Math.floor(barIdx / 2) + Math.floor(r / 100)) % this.oceanBassPatterns.length]
      const bassSemi = bassPattern[s]
      if (bassSemi !== null && bassSemi !== undefined) {
        const note = this.shift(root, bassSemi)
        this.subBass.triggerAttackRelease(note, '8n', time, s === 0 ? 0.9 : 0.65)
      }
    }
 
    if (!intro) {
      const arpPattern = this.oceanArpPatterns[(barIdx + Math.floor(b / 64)) % this.oceanArpPatterns.length]
      const idx = arpPattern[s]
      if (idx !== null && idx !== undefined && Math.random() < 0.55 + density * 0.4) {
        const note = this.shift(chord[idx % chord.length], 12)
        const vel = this.clamp(0.3 + (b / 255) * 0.35 + Math.random() * 0.1)
        this.crystalArp.triggerAttackRelease(note, '16n', time, vel)
      }
    }
  }
 
  tickMet(time, step, g, lum) {
    if (step % 2 !== 0) return
    const s8 = step / 2
    const currentScale = this.scales.met
    const maxIndex = currentScale.length - 1
 
    if (s8 % 8 === 0 || s8 % 16 === 10) {
      this.kickDrum.triggerAttackRelease('F1', '8n', time, 0.85)
    }
    if (s8 % 4 === 1 || s8 % 8 === 6) {
      const bongoPitch = s8 % 2 === 0 ? 'C3' : 'G2'
      this.bongoPerc.triggerAttackRelease(bongoPitch, '16n', time, 0.75)
    }
    if (s8 % 2 === 1) {
      this.hiHat.triggerAttackRelease('32n', time, 0.4)
    }
    const gIndex = Math.min(Math.floor((g / 255) * maxIndex), maxIndex)
    const marimbaNote = currentScale[gIndex]
    if (s8 % 2 === 0 || lum > 80) {
      this.marimbaSynth.triggerAttackRelease(marimbaNote, '8n', time + 0.04, this.clamp(0.6 + lum / 400))
    }
  }
 
  startPlayback(trackType, getCurrentFrameData) {
    this.stopPlayback()
    this.configureTrack(trackType)
    this.stepCounter = 0
    this.smoothLum = 90
    this.getFrame = getCurrentFrameData
    this.isPlaying = true
 
    const transport = Tone.getTransport()
    transport.cancel(0)
    transport.bpm.value = this.currentBpm
    transport.swingSubdivision = '16n'
    transport.swing = trackType === 'ocean' ? 0.18 : 0.1
 
    this.eventId = transport.scheduleRepeat((time) => {
      if (!this.isPlaying) return
      this.tick(time)
    }, '16n')
 
    transport.start('+0.05')
  }
 
  stopPlayback() {
    this.isPlaying = false
    const transport = Tone.getTransport()
    if (this.eventId !== null) {
      transport.clear(this.eventId)
      this.eventId = null
    }
    transport.stop()
    transport.cancel(0)
    if (this.isInitialized) {
      this.oceanPad.releaseAll()
      this.stabSynth.releaseAll()
      this.crystalArp.releaseAll()
      this.marimbaSynth.releaseAll()
    }
  }
}
 
export const audioEngine = new HouseAudioEngine()
 