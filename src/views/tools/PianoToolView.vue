<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import PianoKeyboard from '@/components/PianoKeyboard.vue'
import { useInstrumentPlayer } from '@/composables/useInstrumentPlayer'
import { pianoKeys, pianoKeyShortcuts } from '@/domain/piano'

const { activeNotes, error, prepare, pressNote, releaseNote, setVolume, status, stop } = useInstrumentPlayer('piano')
const keyMarks = computed(() => activeNotes.value.map(midi => ({ midi, state: 'active' as const })))
const volume = ref(72)

const statusText = computed(() => ({
  idle: '等待加载',
  loading: '正在加载钢琴音色',
  ready: '钢琴音色已就绪',
  fallback: '当前使用基础合成音色',
  unavailable: '声音暂不可用',
}[status.value]))

function updateVolume() {
  setVolume(volume.value / 100)
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.target instanceof HTMLInputElement) {
    return
  }
  const key = pianoKeys.find(item => item.shortcut === event.key.toLowerCase())
  if (key) {
    event.preventDefault()
    void pressNote(key.midi)
  }
}

function handleKeyUp(event: KeyboardEvent) {
  const key = pianoKeys.find(item => item.shortcut === event.key.toLowerCase())
  if (key) {
    event.preventDefault()
    releaseNote(key.midi)
  }
}

onMounted(() => {
  void prepare()
  updateVolume()
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('blur', stop)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('blur', stop)
})
</script>

<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top,#eef7e7_0,transparent_38rem)]">
    <header class="border-b border-line/80 bg-white/85 backdrop-blur-lg">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6">
        <RouterLink :to="{ name: 'home' }" class="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-extrabold text-brand hover:bg-brand-soft">
          <svg viewBox="0 0 20 20" class="size-4" aria-hidden="true"><path d="m12.5 4-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          返回首页
        </RouterLink>
        <span class="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-extrabold text-brand-dark">音乐工具</span>
      </div>
    </header>

    <main class="mx-auto flex max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
      <section class="text-center" aria-labelledby="piano-tool-title">
        <p class="text-sm font-extrabold tracking-[0.14em] text-brand">
          FREE PLAY
        </p>
        <h1 id="piano-tool-title" class="mt-2 text-3xl font-extrabold tracking-[-0.04em] sm:text-5xl">
          自由钢琴
        </h1>
        <p class="mx-auto mt-3 max-w-xl text-sm/6 text-muted sm:text-base/7">
          没有题目，也不记录成绩。点击琴键，或用电脑键盘自由弹奏。
        </p>
      </section>

      <section class="mt-8 rounded-[28px] border border-line bg-white p-4 shadow-card sm:mt-12 sm:p-7 lg:p-9" aria-label="自由钢琴演奏区">
        <div class="mb-5 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-2 text-xs font-bold" :class="status === 'unavailable' ? 'text-error' : 'text-muted'" role="status">
            <span class="size-2 rounded-full" :class="status === 'ready' ? 'bg-brand' : status === 'unavailable' ? 'bg-error' : 'bg-[#d5a62e]'" />
            {{ statusText }}
          </div>
          <label class="flex items-center gap-3 text-xs font-extrabold text-muted">
            音量
            <input v-model.number="volume" type="range" min="0" max="100" class="w-36 accent-brand" aria-label="钢琴音量" @input="updateVolume">
            <span class="w-8 text-right tabular-nums">{{ volume }}%</span>
          </label>
        </div>

        <PianoKeyboard
          interactive show-labels :depressed-notes="activeNotes" :marks="keyMarks" :shortcuts="pianoKeyShortcuts"
          @note-on="pressNote" @note-off="releaseNote"
        />

        <p class="mt-5 text-center text-xs/5 text-muted sm:mt-6">
          电脑键盘：A W S E D F T G Y H U J
        </p>
        <p v-if="error" class="mt-2 text-center text-xs/5 font-bold text-error" role="alert">
          {{ error }}
        </p>
      </section>

      <p class="mt-5 text-center text-[11px]/5 text-muted">
        Piano samples from <a href="https://archive.org/details/SalamanderGrandPianoV3" target="_blank" rel="noreferrer" class="font-bold underline underline-offset-2">Salamander Grand Piano V3</a>, CC BY 3.0.
      </p>
    </main>
  </div>
</template>
