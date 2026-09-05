import { onBeforeUnmount, ref } from 'vue'

export function usePianoAudio() {
  const error = ref('')
  let context: AudioContext | undefined
  let oscillator: OscillatorNode | undefined
  let generation = 0

  function stop() {
    generation++
    oscillator?.stop()
    oscillator?.disconnect()
    oscillator = undefined
  }

  async function play(midi: number) {
    stop()
    const current = generation
    try {
      context ??= new AudioContext()
      await context.resume()
      if (current !== generation) {
        return
      }
      if (context.state !== 'running') {
        throw new Error('Audio unavailable')
      }
      const voice = context.createOscillator()
      const gain = context.createGain()
      const now = context.currentTime
      voice.type = 'triangle'
      voice.frequency.value = 440 * 2 ** ((midi - 69) / 12)
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.18, now + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55)
      voice.connect(gain).connect(context.destination)
      voice.start(now)
      voice.stop(now + 0.6)
      oscillator = voice
      voice.onended = () => {
        voice.disconnect()
        gain.disconnect()
        if (oscillator === voice) {
          oscillator = undefined
        }
      }
      error.value = ''
    }
    catch {
      if (current === generation) {
        error.value = '声音暂不可用，你仍可继续答题；下次点击琴键会重试。'
      }
    }
  }

  onBeforeUnmount(() => {
    stop()
    void context?.close()
  })

  return { play, stop, error }
}
