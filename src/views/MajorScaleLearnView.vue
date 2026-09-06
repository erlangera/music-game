<script setup lang="ts">
import type { PianoKeyMark } from '@/domain/piano'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PianoKeyboard from '@/components/PianoKeyboard.vue'
import { useInstrumentPlayer } from '@/composables/useInstrumentPlayer'
import { majorScaleIds, majorScales, majorScaleSteps, scaleMidiNotes } from '@/domain/majorScale'
import { midiNote } from '@/domain/pitch'

const router = useRouter()
const lessonIndex = ref(0)
const keyboardFrom = midiNote(60)
const keyboardTo = midiNote(83)
const lessonScales = majorScaleIds.map(id => majorScales[id])
const lessonLabels = ['原理', ...majorScaleIds]
const totalLessons = lessonLabels.length
const scale = computed(() => lessonIndex.value === 0 ? majorScales.C : lessonScales[lessonIndex.value - 1]!)
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
    <header class="border-b border-line bg-white">
      <div class="mx-auto grid min-h-20 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-8">
        <button type="button" class="flex min-h-11 items-center gap-2 justify-self-start rounded-xl px-2 text-sm font-bold text-muted hover:bg-brand-soft" @click="leave">
          <span aria-hidden="true">‹</span><span class="hidden sm:inline">返回首页</span><span class="sm:hidden">返回</span>
        </button>
        <div class="text-center">
          <p class="text-sm font-extrabold sm:text-base">
            自然大调 · 学习
          </p>
          <p class="mt-1 text-xs text-muted">
            第 {{ lessonIndex + 1 }} / {{ totalLessons }} 课
          </p>
        </div>
        <RouterLink :to="{ name: 'scale-practice' }" class="flex min-h-11 items-center justify-self-end rounded-xl px-3 text-xs font-extrabold text-brand hover:bg-brand-soft sm:text-sm">
          去练习
        </RouterLink>
      </div>
      <div class="h-1 bg-line" role="progressbar" aria-label="课程进度" :aria-valuenow="lessonIndex + 1" aria-valuemin="1" :aria-valuemax="totalLessons">
        <div class="h-full bg-brand transition-all motion-reduce:transition-none" :style="{ width: `${(lessonIndex + 1) / totalLessons * 100}%` }" />
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-3 py-8 sm:px-8 sm:py-12">
      <nav class="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-1.5 shadow-sm" aria-label="自然大调课程">
        <button v-for="(label, index) in lessonLabels" :key="label" type="button" class="min-h-11 shrink-0 rounded-xl px-4 text-xs font-extrabold sm:text-sm" :class="lessonIndex === index ? 'bg-brand-soft text-brand-dark' : 'text-muted hover:bg-canvas'" :aria-current="lessonIndex === index ? 'step' : undefined" @click="setLesson(index)">
          {{ label }}<span class="hidden sm:inline">{{ index ? ' 大调' : '' }}</span>
        </button>
      </nav>

      <article v-if="lessonIndex === 0" class="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-9">
        <p class="text-xs font-extrabold tracking-widest text-brand">
          STEP 1 · 全音与半音
        </p>
        <h1 class="mt-3 text-3xl/tight font-black sm:text-4xl">
          先认识琴键距离，再理解音阶公式
        </h1>
        <p class="mt-4 max-w-3xl text-sm/7 text-muted">
          自然大调不是固定的一组白键，而是从任意主音出发，按照固定距离依次走出的七个音。
        </p>

        <div class="mt-8 grid gap-4 md:grid-cols-2">
          <section class="min-w-0 rounded-2xl border border-line bg-canvas p-5">
            <p class="text-xs font-extrabold text-brand">
              半音 = 1 个琴键距离
            </p>
            <div class="mt-4 flex items-center gap-3 text-2xl font-black">
              <span class="rounded-xl bg-white px-5 py-3 shadow-sm">E</span><span>→</span><span class="rounded-xl bg-white px-5 py-3 shadow-sm">F</span>
            </div>
            <p class="mt-4 text-sm/6 text-muted">
              钢琴上两个相邻琴键相差一个半音，E–F 与 B–C 之间没有黑键。
            </p>
          </section>
          <section class="min-w-0 rounded-2xl border border-line bg-canvas p-5">
            <p class="text-xs font-extrabold text-brand">
              全音 = 2 个半音
            </p>
            <div class="mt-4 flex items-center gap-2 text-2xl font-black">
              <span class="rounded-xl bg-white px-4 py-3 shadow-sm">C</span><span>→</span><span class="rounded-xl bg-ink p-3 text-white shadow-sm">C♯</span><span>→</span><span class="rounded-xl bg-white px-4 py-3 shadow-sm">D</span>
            </div>
            <p class="mt-4 text-sm/6 text-muted">
              跨过中间的 C♯，从 C 到 D 一共走了两个半音，也就是一个全音。
            </p>
          </section>
        </div>

        <section class="mt-5 rounded-2xl border border-brand/20 bg-brand-soft p-5">
          <p class="text-sm font-extrabold text-brand-dark">
            自然大调永远使用同一个结构
          </p>
          <div class="mt-4 grid grid-cols-7 gap-1.5" aria-label="自然大调音程结构">
            <span v-for="step in majorScaleSteps" :key="step" class="grid min-h-12 place-items-center rounded-xl bg-white text-sm font-black text-brand-dark">{{ step }}</span>
          </div>
          <p class="mt-4 text-sm/6 text-muted">
            改变主音，只是在钢琴上从不同位置开始走这套距离。
          </p>
        </section>

        <section class="mt-7">
          <div class="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 class="text-lg font-extrabold">
                C 大调示范
              </h2><p class="mt-1 text-xs text-muted">
                从 C4 开始，完整走一次“全全半全全全半”
              </p>
            </div>
            <button type="button" class="min-h-11 rounded-xl border border-line px-4 text-sm font-extrabold hover:bg-brand-soft" @click="playScale">
              ▶ 播放演示
            </button>
          </div>
          <div class="overflow-x-auto rounded-2xl border border-line bg-canvas p-3" tabindex="0" aria-label="可横向滚动的两八度钢琴">
            <PianoKeyboard :from="keyboardFrom" :marks="keyboardMarks" :minimum-white-key-width="44" :to="keyboardTo" show-labels />
          </div>
        </section>
      </article>

      <article v-else class="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-9">
        <p class="text-xs font-extrabold tracking-widest text-brand">
          {{ scale.id }} MAJOR · 第 {{ scale.lesson }} / {{ totalLessons }} 课
        </p>
        <h1 class="mt-3 text-3xl/tight font-black sm:text-4xl">
          {{ scale.name }}：{{ scale.summary }}
        </h1>
        <p class="mt-4 max-w-3xl text-sm/7 text-muted">
          从 {{ scale.id }} 开始按大调结构前进，观察全音、半音怎样决定每一个音名和琴键。
        </p>

        <div class="mt-8 overflow-x-auto pb-2">
          <div class="grid min-w-[680px] grid-cols-[repeat(7,auto_1fr)] items-center gap-2">
            <template v-for="(note, index) in scale.notes" :key="note">
              <div class="grid size-14 place-items-center rounded-2xl border-2 text-xl font-black" :class="note.includes('♯') || note.includes('♭') ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line bg-white'">
                <span>{{ note }}</span><span class="text-[10px] text-muted">{{ index + 1 }}</span>
              </div>
              <span class="text-center text-xs font-extrabold text-muted">{{ majorScaleSteps[index] }}</span>
            </template>
          </div>
        </div>

        <aside class="mt-5 rounded-2xl border border-brand/20 bg-brand-soft p-5">
          <p class="font-extrabold text-brand-dark">
            记住这里
          </p>
          <p class="mt-2 text-sm/6 text-muted">
            {{ scale.insight }}
          </p>
        </aside>

        <section class="mt-7">
          <div class="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 class="text-lg font-extrabold">
                {{ scale.name }}琴键位置
              </h2><p class="mt-1 text-xs text-muted">
                音阶成员显示音名与音级；黑键按当前调正确拼写
              </p>
            </div>
            <button type="button" class="min-h-11 rounded-xl border border-line px-4 text-sm font-extrabold hover:bg-brand-soft" @click="playScale">
              ▶ 播放音阶
            </button>
          </div>
          <div class="overflow-x-auto rounded-2xl border border-line bg-canvas p-3" tabindex="0" aria-label="可横向滚动的两八度钢琴">
            <PianoKeyboard :from="keyboardFrom" :marks="keyboardMarks" :minimum-white-key-width="44" :to="keyboardTo" show-labels />
          </div>
        </section>
      </article>

      <p v-if="audioError" class="mt-4 text-center text-xs text-muted" role="status">
        {{ audioError }}
      </p>
      <p v-else-if="audioStatus === 'loading'" class="mt-4 text-center text-xs text-muted" role="status">
        钢琴音色正在加载，暂用基础音色。
      </p>

      <div class="mt-6 flex items-center justify-between gap-3">
        <button type="button" class="min-h-12 rounded-xl border border-line px-5 text-sm font-extrabold disabled:opacity-40" :disabled="lessonIndex === 0" @click="setLesson(lessonIndex - 1)">
          ← 上一课
        </button>
        <button v-if="lessonIndex < totalLessons - 1" type="button" class="min-h-12 rounded-xl bg-brand px-6 text-sm font-extrabold text-white hover:bg-brand-dark" @click="setLesson(lessonIndex + 1)">
          下一课 →
        </button>
        <RouterLink v-else :to="{ name: 'scale-practice' }" class="grid min-h-12 place-items-center rounded-xl bg-brand px-6 text-sm font-extrabold text-white hover:bg-brand-dark">
          开始练习 →
        </RouterLink>
      </div>
    </main>
  </div>
</template>
