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
    this.clap = null
    this.bongoPerc = null
    this.oceanSurf = null

    this.acidSynth = null
    this.marimbaSynth = null
    this.oceanPad = null
    this.crystalArp = null

    this.currentBpm = 124
    this.stepCounter = 0
    this.clockInterval = null

    this.scales = {
      fires: ['C2', 'Eb2', 'F2', 'G2', 'Bb2', 'C3', 'Eb3', 'G3', 'Bb3', 'C4'],
      met: ['F3', 'G3', 'A3', 'C4', 'D4', 'F4', 'G4', 'A4', 'C5', 'D5'],
      ocean: ['D3', 'E3', 'F3', 'A3', 'C4', 'D4', 'E4', 'A4', 'C5', 'E5']
    }
  }

  async init() {
    if (this.isInitialized) return

    await Tone.start()

    this.masterCompressor = new Tone.Compressor({
      threshold: -12,
      ratio: 4,
      attack: 0.005,
      release: 0.12
    }).toDestination()

    this.masterFilter = new Tone.Filter({
      frequency: 2200,
      type: 'lowpass',
      rolloff: -12
    }).connect(this.masterCompressor)

    this.reverb = new Tone.Reverb({
      decay: 2.5,
      wet: 0.3
    }).connect(this.masterFilter)
    await this.reverb.generate()

    this.kickDrum = new Tone.MembraneSynth({
      pitchDecay: 0.04,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.28, sustain: 0.0, release: 0.1 }
    }).connect(this.masterCompressor)

    this.hiHat = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.002, decay: 0.05, sustain: 0.0 }
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
      filter: { Q: 7, type: 'lowpass', rolloff: -24 },
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

    this.marimbaSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.008, decay: 0.22, sustain: 0.05, release: 0.3 }
    }).connect(this.reverb)

    this.oceanPad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.6, decay: 0.8, sustain: 0.8, release: 1.8 }
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
    if (trackType === 'fires') {
      this.currentBpm = 128
      this.kickDrum.volume.value = 3
      this.hiHat.volume.value = -7
      this.clap.volume.value = -6
      this.acidSynth.volume.value = -2
    } else if (trackType === 'met') {
      this.currentBpm = 116
      this.kickDrum.volume.value = 0
      this.hiHat.volume.value = -10
      this.clap.volume.value = -8
      this.bongoPerc.volume.value = -3
      this.marimbaSynth.volume.value = -2
    } else {
      this.currentBpm = 122
      this.kickDrum.volume.value = 1
      this.hiHat.volume.value = -9
      this.oceanPad.volume.value = -6
      this.crystalArp.volume.value = -3
    }
  }

  processPulse(frameData, trackType) {
    if (!this.isInitialized || this.isMuted || !frameData) return

    const now = Tone.now()
    const currentScale = this.scales[trackType] || this.scales.fires

    const lum = Number(frameData.luminance) || 0
    const r = Number(frameData.r) || 0
    const g = Number(frameData.g) || 0
    const b = Number(frameData.b) || 0

    const cutoff = Math.min(350 + lum * 22, 7000)
    this.masterFilter.frequency.rampTo(cutoff, 0.06)

    const maxIndex = currentScale.length - 1

    if (trackType === 'fires') {
      if (this.stepCounter % 4 === 0) {
        this.kickDrum.triggerAttackRelease('C1', '8n', now, 1.0)
      }
      if (this.stepCounter % 8 === 4) {
        this.clap.triggerAttackRelease('16n', now, 0.9)
      }
      if (this.stepCounter % 2 === 1) {
        this.hiHat.triggerAttackRelease('32n', now, Math.min(0.5 + r / 400, 1))
      }
      const rIndex = Math.min(Math.floor((r / 255) * maxIndex), maxIndex)
      const acidNote = currentScale[rIndex]
      const acidDuration = this.stepCounter % 4 === 2 ? '8n' : '16n'
      this.acidSynth.triggerAttackRelease(acidNote, acidDuration, now, Math.min(0.7 + lum / 500, 1))
    } else if (trackType === 'met') {
      if (this.stepCounter % 8 === 0 || this.stepCounter % 16 === 10) {
        this.kickDrum.triggerAttackRelease('F1', '8n', now, 0.85)
      }
      if (this.stepCounter % 4 === 1 || this.stepCounter % 8 === 6) {
        const bongoPitch = this.stepCounter % 2 === 0 ? 'C3' : 'G2'
        this.bongoPerc.triggerAttackRelease(bongoPitch, '16n', now, 0.75)
      }
      if (this.stepCounter % 2 === 1) {
        this.hiHat.triggerAttackRelease('32n', now, 0.4)
      }
      const gIndex = Math.min(Math.floor((g / 255) * maxIndex), maxIndex)
      const marimbaNote = currentScale[gIndex]
      if (this.stepCounter % 2 === 0 || lum > 80) {
        this.marimbaSynth.triggerAttackRelease(marimbaNote, '8n', now + 0.04, Math.min(0.6 + lum / 400, 1))
      }
    } else {
      if (this.stepCounter % 4 === 0) {
        this.kickDrum.triggerAttackRelease('D1', '8n', now, 0.9)
      }
      if (this.stepCounter % 16 === 0) {
        this.oceanSurf.triggerAttackRelease('2n', now, 0.5)
      }
      if (this.stepCounter % 4 === 2) {
        this.hiHat.triggerAttackRelease('16n', now, 0.6)
      }
      if (this.stepCounter % 16 === 0) {
        this.oceanPad.triggerAttackRelease(['D3', 'A3', 'F4'], '1n', now, 0.5)
      }
      const bIndex = Math.min(Math.floor((b / 255) * maxIndex), maxIndex)
      const crystalNote = currentScale[bIndex]
      this.crystalArp.triggerAttackRelease(crystalNote, '8n', now + 0.02, Math.min(0.5 + lum / 450, 1))
    }

    this.stepCounter++
  }

  startPlayback(trackType, getCurrentFrameData) {
    this.stopPlayback()
    this.configureTrack(trackType)
    this.stepCounter = 0
    this.isPlaying = true

    const stepIntervalMs = (60 / this.currentBpm / 2) * 1000

    this.clockInterval = setInterval(() => {
      if (!this.isPlaying) return
      const frameData = getCurrentFrameData()
      this.processPulse(frameData, trackType)
    }, stepIntervalMs)
  }

  stopPlayback() {
    this.isPlaying = false
    if (this.clockInterval) {
      clearInterval(this.clockInterval)
      this.clockInterval = null
    }
  }
}

export const audioEngine = new HouseAudioEngine()