import type { SolfegeName } from '@/domain/solfegePractice'
import { onBeforeUnmount, ref } from 'vue'

export function useSolfegeAudio() {
  const playingKey = ref<string | null>(null)
  const error = ref('')
  const autoPlaying = ref(false)
  let audio: HTMLAudioElement | undefined
  let sequence: SolfegeName[] = []
  let playbackIndex = -1
  let generation = 0
  let timer: number | undefined
  let settle: ((completed: boolean) => void) | undefined

  function stop() {
    generation += 1
    window.clearTimeout(timer)
    timer = undefined
    if (audio) {
      audio.onplaying = null
      audio.onended = null
      audio.onerror = null
      audio.pause()
    }
    settle?.(false)
    settle = undefined
    playingKey.value = null
    autoPlaying.value = false
  }

  function play(name: SolfegeName, key: string, token: number): Promise<boolean> {
    return new Promise((resolve) => {
      settle = resolve
      audio ??= new Audio()
      const player = audio
      const finish = (completed: boolean) => {
        if (token !== generation) {
          return
        }
        playingKey.value = null
        settle = undefined
        resolve(completed)
      }
      const fail = () => {
        if (token !== generation) {
          return
        }
        error.value = '音频暂时无法播放，请点击小喇叭重试。'
        finish(false)
      }
      player.onplaying = () => {
        if (token === generation) {
          playingKey.value = key
        }
      }
      player.onended = () => finish(true)
      player.onerror = fail
      player.src = `${import.meta.env.BASE_URL}solfege/${name}.mp3`
      void player.play().catch(fail)
    })
  }

  function playItem(name: SolfegeName, key: string) {
    stop()
    error.value = ''
    void play(name, key, generation)
  }

  async function playSequence(names: SolfegeName[], startIndex = 0) {
    stop()
    error.value = ''
    const token = generation
    sequence = names
    autoPlaying.value = true
    for (let index = startIndex; index < names.length; index += 1) {
      if (token !== generation) {
        return
      }
      playbackIndex = index
      const completed = await play(names[index]!, `prompt-${index}`, token)
      if (token !== generation) {
        return
      }
      if (!completed) {
        break
      }
      if (index < names.length - 1) {
        await new Promise<boolean>((resolve) => {
          settle = resolve
          timer = window.setTimeout(() => {
            settle = undefined
            resolve(true)
          }, 1500)
        })
      }
    }
    if (token === generation) {
      autoPlaying.value = false
    }
  }

  function advanceTo(index: number) {
    // Never replay an item already reached, or resume a manually cancelled sequence.
    if (autoPlaying.value && index > playbackIndex && index < sequence.length) {
      void playSequence(sequence, index)
    }
  }

  onBeforeUnmount(stop)
  return { playingKey, error, autoPlaying, stop, playItem, playSequence, advanceTo }
}
