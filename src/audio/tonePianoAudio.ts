import type { InstrumentAudioEngine, InstrumentAudioState, InstrumentAudioStatus, PlayNoteOptions } from '@/audio/instrumentAudio'
import type { MidiNote } from '@/domain/pitch'
import { Gain, PolySynth, Sampler, start, Synth } from 'tone'
import { pianoSamples } from '@/audio/pianoSamples'
import { scientificPitch } from '@/domain/pitch'

const sampleBaseUrl = `${import.meta.env.BASE_URL}audio/piano/salamander/`
const sampleUrls = Object.fromEntries(pianoSamples.map(sample => [scientificPitch(sample.note), sample.file]))

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

class TonePianoAudioEngine implements InstrumentAudioEngine {
  private status: InstrumentAudioStatus = 'idle'
  private preparedStatus: InstrumentAudioStatus = 'idle'
  private listeners = new Set<(state: InstrumentAudioState) => void>()
  private output: Gain | undefined
  private sampler: Sampler | undefined
  private fallback: PolySynth<Synth> | undefined
  private preparePromise: Promise<void> | undefined
  private settlePrepare: (() => void) | undefined
  private disposed = false
  private unlockFailed = false

  get state(): InstrumentAudioState {
    return { status: this.status }
  }

  prepare(): Promise<void> {
    if (this.disposed || this.preparedStatus === 'ready' || this.preparedStatus === 'fallback' || this.preparedStatus === 'unavailable') {
      return Promise.resolve()
    }
    if (this.preparePromise) {
      return this.preparePromise
    }

    this.preparedStatus = 'loading'
    this.setStatus('loading')
    this.preparePromise = new Promise<void>((resolve) => {
      this.settlePrepare = resolve
    })

    try {
      this.output = new Gain(0.72).toDestination()
      this.fallback = new PolySynth(Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.012, decay: 0.12, sustain: 0.2, release: 0.42 },
      }).connect(this.output)
      this.sampler = new Sampler({
        urls: sampleUrls,
        baseUrl: sampleBaseUrl,
        attack: 0,
        release: 0.8,
        onload: () => this.finishPreparing('ready'),
        onerror: () => this.finishPreparing('fallback'),
      }).connect(this.output)
    }
    catch {
      this.finishPreparing(this.fallback ? 'fallback' : 'unavailable')
    }

    return this.preparePromise
  }

  async unlock(): Promise<boolean> {
    if (this.disposed) {
      return false
    }
    void this.prepare()
    try {
      await start()
      this.unlockFailed = false
      if (this.disposed || this.preparedStatus === 'unavailable') {
        return false
      }
      this.setStatus(this.preparedStatus)
      return true
    }
    catch {
      this.unlockFailed = true
      this.setStatus('unavailable')
      return false
    }
  }

  playNote(note: MidiNote, options: PlayNoteOptions = {}) {
    if (this.disposed || this.status === 'idle' || this.status === 'unavailable') {
      return
    }
    const duration = clamp(options.durationSeconds ?? 0.55, 0.05, 10)
    const velocity = clamp(options.velocity ?? 0.72, 0, 1)
    const pitch = scientificPitch(note)
    if (this.status === 'ready' && this.sampler?.loaded) {
      this.sampler.triggerAttackRelease(pitch, duration, undefined, velocity)
    }
    else {
      this.fallback?.triggerAttackRelease(pitch, duration, undefined, velocity)
    }
  }

  startNote(note: MidiNote, options: Omit<PlayNoteOptions, 'durationSeconds'> = {}) {
    if (this.disposed || this.status === 'idle' || this.status === 'unavailable') {
      return
    }
    const velocity = clamp(options.velocity ?? 0.72, 0, 1)
    const pitch = scientificPitch(note)
    if (this.status === 'ready' && this.sampler?.loaded) {
      this.sampler.triggerAttack(pitch, undefined, velocity)
    }
    else {
      this.fallback?.triggerAttack(pitch, undefined, velocity)
    }
  }

  stopNote(note: MidiNote) {
    const pitch = scientificPitch(note)
    this.sampler?.triggerRelease(pitch)
    this.fallback?.triggerRelease(pitch)
  }

  stop() {
    this.sampler?.releaseAll()
    this.fallback?.releaseAll()
  }

  setVolume(volume: number) {
    if (this.output) {
      this.output.gain.rampTo(clamp(volume, 0, 1), 0.03)
    }
  }

  subscribe(listener: (state: InstrumentAudioState) => void) {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  dispose() {
    if (this.disposed) {
      return
    }
    this.disposed = true
    this.stop()
    this.sampler?.dispose()
    this.fallback?.dispose()
    this.output?.dispose()
    this.listeners.clear()
    this.settlePrepare?.()
    this.settlePrepare = undefined
  }

  private finishPreparing(status: 'ready' | 'fallback' | 'unavailable') {
    if (this.disposed) {
      return
    }
    if (this.preparedStatus === 'fallback' || this.preparedStatus === 'unavailable') {
      this.settlePrepare?.()
      this.settlePrepare = undefined
      return
    }
    if (status !== 'ready') {
      this.sampler?.dispose()
      this.sampler = undefined
    }
    this.preparedStatus = status
    if (!this.unlockFailed) {
      this.setStatus(status)
    }
    this.settlePrepare?.()
    this.settlePrepare = undefined
  }

  private setStatus(status: InstrumentAudioStatus) {
    if (this.disposed || this.status === status) {
      return
    }
    this.status = status
    for (const listener of this.listeners) {
      listener(this.state)
    }
  }
}

const sharedPianoAudio = new TonePianoAudioEngine()

if (import.meta.hot) {
  import.meta.hot.dispose(() => sharedPianoAudio.dispose())
}

export function getPianoAudioEngine(): InstrumentAudioEngine {
  return sharedPianoAudio
}
