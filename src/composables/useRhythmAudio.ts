import type { RhythmPattern } from '@/domain/rhythm'
import { onBeforeUnmount, ref } from 'vue'
import { rhythmTimeline } from '@/domain/rhythm'

/** Schedule sound on the audio clock, never on UI timers. Each view owns its context. */
export function useRhythmAudio() {
  const playing = ref(false)
  const error = ref('')
  let context: AudioContext | undefined
  let nodes: OscillatorNode[] = []
  let generation = 0
  let frame = 0
  let settle: ((completed: boolean) => void) | undefined

  function stop() {
    generation++
    cancelAnimationFrame(frame)
    nodes.forEach((node) => {
      try {
        node.stop()
      }
      catch {}
      node.disconnect()
    })
    nodes = []
    playing.value = false
    settle?.(false)
    settle = undefined
  }

  async function play(patterns: readonly RhythmPattern[], bpm: number): Promise<boolean> {
    stop()
    const token = generation
    error.value = ''
    playing.value = true
    try {
      context ??= new AudioContext()
      await context.resume()
      if (token !== generation) {
        return false
      }
      if (context.state !== 'running') {
        throw new Error('Audio unavailable')
      }
      const seconds = 60 / bpm
      const start = context.currentTime + 0.08
      const end = start + (4 + patterns.length) * seconds
      for (const sound of rhythmTimeline(patterns)) {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.frequency.value = sound.kind === 'note' ? 330 : sound.accent ? 1400 : 1000
        const at = start + sound.beat * seconds
        const duration = sound.duration * seconds
        gain.gain.setValueAtTime(0, at)
        gain.gain.linearRampToValueAtTime(sound.kind === 'note' ? 0.2 : 0.09, at + 0.005)
        gain.gain.exponentialRampToValueAtTime(0.001, at + duration)
        oscillator.connect(gain).connect(context.destination)
        oscillator.start(at)
        oscillator.stop(at + duration + 0.01)
        oscillator.onended = () => {
          oscillator.disconnect()
          gain.disconnect()
        }
        nodes.push(oscillator)
      }
      return await new Promise<boolean>((resolve) => {
        settle = resolve
        const tick = () => {
          if (token !== generation) {
            return
          }
          if (context!.state !== 'running') {
            error.value = '音频已中断，请重新播放。'
            stop()
            return
          }
          if (context!.currentTime >= end) {
            settle = undefined
            stop()
            resolve(true)
          }
          else {
            frame = requestAnimationFrame(tick)
          }
        }
        tick()
      })
    }
    catch {
      if (token === generation) {
        stop()
        error.value = '无法播放音频，请检查浏览器声音权限后重试。'
      }
      return false
    }
  }
  onBeforeUnmount(() => {
    stop()
    void context?.close()
  })
  return { playing, error, play, stop }
}
