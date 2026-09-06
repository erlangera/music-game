import type { PlayNoteOptions } from '@/audio/instrumentAudio'
import type { MidiNote } from '@/domain/pitch'
import { onBeforeUnmount, ref } from 'vue'
import { useInstrument } from '@/composables/instrumentInjection'

interface PlayOptions extends PlayNoteOptions {
  highlightMilliseconds?: number
}

interface SequenceOptions extends PlayNoteOptions {
  intervalMilliseconds?: number
}

export function useInstrumentPlayer(instrumentId: string) {
  const instrument = useInstrument(instrumentId)
  const engine = instrument.audio
  const error = ref('')
  const status = ref(engine.state.status)
  const activeNotes = ref<MidiNote[]>([])
  const heldNotes = new Set<MidiNote>()
  const timers = new Set<ReturnType<typeof setTimeout>>()
  let generation = 0
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
    const available = await engine.unlock()
    if (available) {
      error.value = ''
    }
    else {
      error.value = '声音暂不可用，你仍可继续答题；下次点击乐器会重试。'
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
    stop()
    const current = generation
    const intervalMilliseconds = options.intervalMilliseconds ?? 480
    const durationSeconds = options.durationSeconds ?? Math.min(0.55, intervalMilliseconds / 1000)
    void unlock()
    notes.forEach((note, index) => {
      schedule(() => {
        if (current !== generation) {
          return
        }
        activeNotes.value = [note]
        engine.playNote(note, { durationSeconds, velocity: options.velocity })
      }, index * intervalMilliseconds)
    })
    schedule(() => {
      if (current === generation) {
        activeNotes.value = []
      }
    }, notes.length * intervalMilliseconds)
  }

  function setVolume(volume: number) {
    engine.setVolume(volume)
  }

  onBeforeUnmount(() => {
    stop()
    unsubscribe()
  })

  return {
    activeNotes,
    error,
    instrument,
    playNote,
    playSequence,
    prepare,
    pressNote,
    releaseNote,
    setVolume,
    status,
    stop,
    unlock,
  }
}
