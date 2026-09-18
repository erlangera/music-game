<script setup lang="ts">
import type { PianoKeyMark } from '@/domain/piano'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PianoKeyboard from '@/components/PianoKeyboard.vue'
import PracticePageHeader from '@/components/PracticePageHeader.vue'
import { useInstrumentPlayer } from '@/composables/useInstrumentPlayer'
import { majorScaleIds, majorScales, majorScaleSteps, scaleMidiNotes } from '@/domain/majorScale'
import { midiNote } from '@/domain/pitch'

const router = useRouter()
const lessonIndex = ref(0)
const fullKeyboard = ref(false)
const coursePicker = ref<HTMLDetailsElement>()
const courseSummary = ref<HTMLElement>()
const lessonScales = majorScaleIds.map(id => majorScales[id])
const lessonLabels = ['原理', ...majorScaleIds]
const totalLessons = lessonLabels.length
const scale = computed(() => lessonIndex.value === 0 ? majorScales.C : lessonScales[lessonIndex.value - 1]!)
const keyboardFrom = computed(() => {
  if (fullKeyboard.value) {
    return midiNote(60)
  }
  const tonic = scale.value.lowTonicMidi
  return midiNote(tonic - ([1, 3, 6, 8, 10].includes(tonic % 12) ? 1 : 0))
})
const keyboardTo = computed(() => {
  if (fullKeyboard.value) {
    return midiNote(83)
  }
  const tonic = scale.value.lowTonicMidi + 12
  return midiNote(tonic + ([1, 3, 6, 8, 10].includes(tonic % 12) ? 1 : 0))
})
const scaleMidi = computed(() => scaleMidiNotes(scale.value))
const scaleKeys = computed<PianoKeyMark[]>(() => scaleMidi.value.map((midi, index) => ({
  midi,
  state: 'member',
  label: index === 7 ? scale.value.notes[0] : scale.value.notes[index]!,
  detail: String(index === 7 ? 1 : index + 1),
})))
const { activeNotes, error: audioError, playSequence, prepare, status: audioStatus, stop } = useInstrumentPlayer('piano')
const keyboardMarks = computed<PianoKeyMark[]>(() => [
  ...scaleKeys.value,
  ...activeNotes.value.map(midi => ({ midi, state: 'active' as const })),
])

function clearPlayback() {
  stop()
}

function playScale() {
  playSequence(scaleMidi.value, { intervalMilliseconds: 480 })
}

function setLesson(index: number) {
  clearPlayback()
  lessonIndex.value = index
  if (coursePicker.value?.open) {
    coursePicker.value.open = false
    courseSummary.value?.focus({ preventScroll: true })
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function leave() {
  clearPlayback()
  void router.push({ name: 'home' })
}

onMounted(() => void prepare())
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <PracticePageHeader>
      <div class="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-6">
        <button type="button" class="min-h-11 justify-self-start rounded-xl px-2 text-sm font-bold text-muted hover:bg-brand-soft" @click="leave">
          ‹ 返回
        </button>
        <p class="text-sm font-extrabold">
          自然大调 · 学习
        </p>
        <RouterLink :to="{ name: 'scale-practice' }" class="grid min-h-11 place-items-center justify-self-end rounded-xl px-2 text-sm font-bold text-brand hover:bg-brand-soft">
          去练习
        </RouterLink>
      </div>
      <nav class="mx-auto flex max-w-6xl items-center gap-2 px-3 pb-2 sm:px-6" aria-label="自然大调课程">
        <button type="button" class="min-h-11 rounded-xl border border-line px-3 text-sm font-bold disabled:opacity-40" :disabled="lessonIndex === 0" aria-label="上一课" @click="setLesson(lessonIndex - 1)">
          ‹
        </button>
        <details ref="coursePicker" class="relative min-w-0 flex-1" @keydown.esc="coursePicker?.removeAttribute('open'); courseSummary?.focus()">
          <summary ref="courseSummary" class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl border border-line bg-canvas px-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-brand">
            <span>{{ lessonIndex === 0 ? '构造原理' : scale.name }} <span class="ml-2 text-xs font-medium text-muted">{{ lessonIndex + 1 }} / {{ totalLessons }}</span></span><span aria-hidden="true">⌄</span>
          </summary>
          <div class="absolute inset-x-0 top-full z-40 mt-2 max-h-[60dvh] overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-card">
            <button type="button" class="mb-2 min-h-11 w-full rounded-xl text-sm font-bold hover:bg-brand-soft" :class="lessonIndex === 0 ? 'bg-brand-soft text-brand-dark' : 'text-muted'" :aria-current="lessonIndex === 0 ? 'step' : undefined" @click="setLesson(0)">
              构造原理
            </button>
            <div class="grid grid-cols-3 gap-1">
              <button v-for="(id, index) in majorScaleIds" :key="id" type="button" class="min-h-11 rounded-xl text-sm font-bold hover:bg-brand-soft" :class="lessonIndex === index + 1 ? 'bg-brand-soft text-brand-dark' : 'text-muted'" :aria-current="lessonIndex === index + 1 ? 'step' : undefined" @click="setLesson(index + 1)">
                {{ id }} 大调
              </button>
            </div>
          </div>
        </details>
        <button type="button" class="min-h-11 rounded-xl border border-line px-3 text-sm font-bold disabled:opacity-40" :disabled="lessonIndex === totalLessons - 1" aria-label="下一课" @click="setLesson(lessonIndex + 1)">
          ›
        </button>
      </nav>
      <div class="h-1 bg-line" role="progressbar" aria-label="课程进度" :aria-valuenow="lessonIndex + 1" aria-valuemin="1" :aria-valuemax="totalLessons">
        <div class="h-full bg-brand transition-all motion-reduce:transition-none" :style="{ width: `${(lessonIndex + 1) / totalLessons * 100}%` }" />
      </div>
    </PracticePageHeader>

    <main class="mx-auto max-w-5xl px-2 py-4 sm:p-6">
      <article class="min-w-0 rounded-2xl border border-line bg-white px-3 py-4 shadow-card sm:p-6">
        <h1 class="text-xl/tight font-black sm:text-2xl">
          {{ lessonIndex === 0 ? '全音、半音与大调结构' : scale.name }}
        </h1>
        <p class="mt-2 text-sm/6 text-muted">
          {{ lessonIndex === 0 ? '半音是相邻琴键的距离，全音等于两个半音。从任意主音出发，都可以走出自然大调。' : scale.summary }}
        </p>

        <section class="mt-4" aria-label="自然大调音程结构">
          <p class="mb-2 text-xs font-bold text-muted">
            从主音到高八度主音 · 两处半音用绿色标出
          </p>
          <div class="flex items-center">
            <template v-for="(note, index) in [...scale.notes, scale.notes[0]]" :key="index">
              <div class="flex min-w-0 flex-1 flex-col items-center rounded-lg bg-canvas py-2 text-xs font-black sm:text-base">
                <span>{{ note }}</span><span class="mt-1 text-[10px] font-medium text-muted">{{ index === 7 ? '1′' : index + 1 }}</span>
              </div>
              <span v-if="index < 7" class="shrink-0 px-0.5 text-[10px] font-bold sm:px-2 sm:text-xs" :class="majorScaleSteps[index] === '半' ? 'text-brand' : 'text-muted'">{{ majorScaleSteps[index] }}</span>
            </template>
          </div>
        </section>

        <section class="mt-4">
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-sm font-extrabold">
              {{ scale.name }}琴键位置
            </h2>
            <button type="button" class="min-h-11 rounded-xl border border-line px-3 text-sm font-bold hover:bg-brand-soft" @click="playScale">
              ▶ 播放音阶
            </button>
          </div>
          <div class="-mx-3 overflow-x-auto border-y border-line bg-canvas sm:mx-0 sm:rounded-xl sm:border" tabindex="0" :aria-label="fullKeyboard ? '可横向滚动的两八度钢琴' : '当前音阶钢琴，可横向滚动'">
            <PianoKeyboard compact :from="keyboardFrom" :marks="keyboardMarks" :minimum-white-key-width="fullKeyboard ? 44 : 30" :to="keyboardTo" show-labels />
          </div>
          <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p class="text-xs text-muted">
              {{ fullKeyboard ? '左右滑动查看琴键' : '主音 → 高八度主音' }}
            </p>
            <button type="button" class="min-h-11 rounded-xl px-3 text-xs font-bold text-brand hover:bg-brand-soft" :aria-pressed="fullKeyboard" @click="fullKeyboard = !fullKeyboard">
              {{ fullKeyboard ? '聚焦当前音阶' : '完整两八度' }}
            </button>
          </div>
        </section>

        <aside class="mt-3 rounded-xl border border-brand/20 bg-brand-soft p-3">
          <p class="text-sm/6 text-brand-dark">
            {{ lessonIndex === 0 ? '全 · 全 · 半 · 全 · 全 · 全 · 半：改变主音，就是从不同位置走同一套距离。' : scale.insight }}
          </p>
        </aside>
        <div v-if="lessonIndex === 0" class="mt-3 grid gap-3 sm:grid-cols-2">
          <section class="rounded-xl bg-canvas p-3">
            <h2 class="text-sm font-bold">
              半音：E → F
            </h2>
            <p class="mt-1 text-sm/6 text-muted">
              相邻琴键相差一个半音，E–F 与 B–C 之间没有黑键。
            </p>
          </section>
          <section class="rounded-xl bg-canvas p-3">
            <h2 class="text-sm font-bold">
              全音：C → C♯ → D
            </h2>
            <p class="mt-1 text-sm/6 text-muted">
              跨过中间的 C♯，从 C 到 D 共走两个半音。
            </p>
          </section>
        </div>
        <RouterLink v-if="lessonIndex === 0" :to="{ name: 'tone-step-practice' }" class="mt-4 flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-brand/20 bg-brand-soft px-4 py-3 text-brand-dark transition hover:border-brand/40 hover:bg-[#d8ecdf]">
          <span><strong class="block text-sm font-extrabold">练一练半音与全音</strong><span class="mt-0.5 block text-xs font-bold text-brand/80">用音名或简谱，填写上行、下行的目标音</span></span>
          <span class="shrink-0 text-xl" aria-hidden="true">→</span>
        </RouterLink>
      </article>
      <p v-if="audioError" class="mt-3 text-xs text-muted" role="status">
        {{ audioError }}
      </p>
      <p v-else-if="audioStatus === 'loading'" class="mt-3 text-xs text-muted" role="status">
        钢琴音色正在加载，暂用基础音色。
      </p>
      <div class="mt-4 flex items-center justify-between gap-3">
        <button type="button" class="min-h-11 rounded-xl border border-line px-4 text-sm font-bold disabled:opacity-40" :disabled="lessonIndex === 0" @click="setLesson(lessonIndex - 1)">
          ← 上一课
        </button>
        <button v-if="lessonIndex < totalLessons - 1" type="button" class="min-h-11 rounded-xl bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark" @click="setLesson(lessonIndex + 1)">
          下一课 →
        </button>
        <RouterLink v-else :to="{ name: 'scale-practice' }" class="grid min-h-11 place-items-center rounded-xl bg-brand px-4 text-sm font-bold text-white">
          开始练习 →
        </RouterLink>
      </div>
    </main>
  </div>
</template>
