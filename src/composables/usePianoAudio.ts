import type { MidiNote } from '@/domain/pitch'
import { onBeforeUnmount, ref } from 'vue'
import { getPianoAudioEngine } from '@/audio/tonePianoAudio'

export function usePianoAudio() {
  const error = ref('')
  const engine = getPianoAudioEngine()
  const status = ref(engine.state.status)
  let generation = 0
  const requestedNotes = new Set<MidiNote>()
  const unsubscribe = engine.subscribe(state => status.value = state.status)

  function stop() {
    generation++
    requestedNotes.clear()
    engine.stop()
  }

  function stopNote(midi: MidiNote) {
    requestedNotes.delete(midi)
    engine.stopNote(midi)
  }

  function prepare() {
    return engine.prepare()
  }

  async function unlock() {
    const available = await engine.unlock()
    if (!available) {
      error.value = '声音暂不可用，你仍可继续答题；下次点击琴键会重试。'
    }
    return available
  }

  async function play(midi: MidiNote) {
    stop()
    const current = generation
    if (await unlock() && current === generation) {
      engine.playNote(midi)
      error.value = ''
    }
  }

  async function startNote(midi: MidiNote) {
    if (requestedNotes.has(midi)) {
      return
    }
    requestedNotes.add(midi)
    if (await unlock() && requestedNotes.has(midi)) {
      engine.startNote(midi)
      error.value = ''
    }
  }

  function setVolume(volume: number) {
    engine.setVolume(volume)
  }

  onBeforeUnmount(() => {
    stop()
    unsubscribe()
  })

  return { play, prepare, unlock, startNote, stopNote, stop, setVolume, status, error }
}
