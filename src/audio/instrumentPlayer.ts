import type { MidiNote } from '../domain/pitch.ts'
import type { PlayableInstrument, PlayNoteOptions } from './instrumentAudio.ts'
import { ref } from 'vue'
import { defaultInstrumentVolume } from './instrumentAudio.ts'

interface PlayOptions extends PlayNoteOptions {
  highlightMilliseconds?: number
}

interface SequenceOptions extends PlayNoteOptions {
  intervalMilliseconds?: number
}

export interface InstrumentTimelineStep {
  notes: readonly MidiNote[]
  durationMilliseconds: number
  gapMilliseconds: number
}

interface TimelineOptions extends Omit<PlayNoteOptions, 'durationSeconds'> {
  onComplete?: () => void
  onUnavailable?: () => void
}

export function createInstrumentPlayer(instrument: PlayableInstrument) {
  const engine = instrument.audio
  const error = ref('')
  const status = ref(engine.state.status)
  const activeNotes = ref<MidiNote[]>([])
  const isPlaying = ref(false)
  const heldNotes = new Set<MidiNote>()
  const timers = new Set<ReturnType<typeof setTimeout>>()
  let generation = 0
  let volumeChanged = false
  const unsubscribe = engine.subscribe(state => status.value = state.status)

  function setActive(note: MidiNote, active: boolean) {
    activeNotes.value = active
      ? activeNotes.value.includes(note) ? activeNotes.value : [...activeNotes.value, note]
      : activeNotes.value.filter(item => item !== note)
  }

  function clearTimers() {
    timers.forEach(clearTimeout)
    timers.clear()
  }

  function schedule(callback: () => void, delay: number) {
    const timer = setTimeout(() => {
      timers.delete(timer)
      callback()
    }, delay)
    timers.add(timer)
  }

  async function unlock() {
    const available = await engine.unlock().catch(() => false)
    if (available) {
      error.value = ''
    }
    else {
      error.value = '声音暂不可用，请点击播放按钮重试。'
    }
    return available
  }

  function prepare() {
    return engine.prepare()
  }

  function stop() {
    generation++
    clearTimers()
    heldNotes.clear()
    activeNotes.value = []
    isPlaying.value = false
    engine.stop()
  }

  async function playNote(note: MidiNote, options: PlayOptions = {}) {
    stop()
    const current = generation
    const durationSeconds = options.durationSeconds ?? 0.55
    const highlightMilliseconds = options.highlightMilliseconds ?? durationSeconds * 1000
    setActive(note, true)
    schedule(() => setActive(note, false), highlightMilliseconds)
    if (await unlock() && current === generation) {
      engine.playNote(note, { durationSeconds, velocity: options.velocity })
    }
  }

  async function pressNote(note: MidiNote, options: Omit<PlayNoteOptions, 'durationSeconds'> = {}) {
    if (heldNotes.has(note)) {
      return
    }
    heldNotes.add(note)
    setActive(note, true)
    if (await unlock() && heldNotes.has(note)) {
      engine.startNote(note, options)
    }
  }

  function releaseNote(note: MidiNote) {
    heldNotes.delete(note)
    setActive(note, false)
    engine.stopNote(note)
  }

  function playSequence(notes: readonly MidiNote[], options: SequenceOptions = {}) {
    const intervalMilliseconds = options.intervalMilliseconds ?? 480
    const durationSeconds = options.durationSeconds ?? Math.min(0.55, intervalMilliseconds / 1000)
    void playTimeline(notes.map(note => ({
      notes: [note],
      durationMilliseconds: durationSeconds * 1000,
      gapMilliseconds: Math.max(0, intervalMilliseconds - durationSeconds * 1000),
    })), { velocity: options.velocity })
  }

  async function playTimeline(steps: readonly InstrumentTimelineStep[], options: TimelineOptions = {}) {
    stop()
    const current = generation
    isPlaying.value = true
    const available = await unlock()
    if (current !== generation) {
      return
    }

    if (!available) {
      isPlaying.value = false
      options.onUnavailable?.()
      return
    }

    let offset = 0
    for (const step of steps) {
      schedule(() => {
        if (current !== generation) {
          return
        }
        activeNotes.value = [...step.notes]
        step.notes.forEach(note => engine.playNote(note, {
          durationSeconds: step.durationMilliseconds / 1000,
          velocity: options.velocity,
        }))
      }, offset)
      schedule(() => {
        if (current === generation) {
          activeNotes.value = activeNotes.value.filter(note => !step.notes.includes(note))
        }
      }, offset + step.durationMilliseconds)
      offset += step.durationMilliseconds + step.gapMilliseconds
    }

    schedule(() => {
      if (current === generation) {
        activeNotes.value = []
        isPlaying.value = false
        options.onComplete?.()
      }
    }, offset)
  }

  function setVolume(volume: number) {
    volumeChanged = true
    engine.setVolume(volume)
  }

  function dispose() {
    stop()
    unsubscribe()
    if (volumeChanged) {
      engine.setVolume(defaultInstrumentVolume)
      volumeChanged = false
    }
  }

  return {
    activeNotes,
    dispose,
    error,
    instrument,
    isPlaying,
    playNote,
    playSequence,
    playTimeline,
    prepare,
    pressNote,
    releaseNote,
    setVolume,
    status,
    stop,
    unlock,
  }
}
