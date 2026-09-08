<script setup lang="ts">
import type { CoreScaleDegree, DegreeQuestion, RelativePitchMode, TonalHint } from '@/domain/relativePitch'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PracticeSetupDialog from '@/components/PracticeSetupDialog.vue'
import { useInstrumentPlayer } from '@/composables/useInstrumentPlayer'
import {
  coreScaleDegrees,
  createDegreeQuestionGenerator,
  degreeQuestionSteps,
  degreeResolutionSteps,
  isDegreeAnswer,
  tonalHintLabels,
} from '@/domain/relativePitch'

type Phase = 'setup' | 'playing' | 'complete'
type AnswerState = 'listening' | 'answering' | 'correct' | 'wrong'

const degreeCopy: Record<CoreScaleDegree, { name: string, role: string }> = {
  1: { name: 'do', role: '主音 · 稳定与归属' },
  3: { name: 'mi', role: '中音 · 明亮的大调色彩' },
  5: { name: 'sol', role: '属音 · 支撑与向心力' },
}

const route = useRoute()
const router = useRouter()
const phase = ref<Phase>('setup')
const draftMode = ref<RelativePitchMode>(route.query.mode === 'infinite' ? 'infinite' : 'fixed')
const activeMode = ref<RelativePitchMode>(draftMode.value)
const draftHint = ref<TonalHint>('scale')
const activeHint = ref<TonalHint>('scale')
const question = ref<DegreeQuestion>()
const answerState = ref<AnswerState>('listening')
const answered = ref(0)
const selectedDegree = ref<CoreScaleDegree>()
const heading = ref<HTMLElement>()
const nextButton = ref<HTMLButtonElement>()
let nextQuestion = createDegreeQuestionGenerator()

const {
  error: audioError,
  isPlaying,
  playTimeline,
  prepare,
  status: audioStatus,
  stop,
} = useInstrumentPlayer('piano')

const locked = computed(() => answerState.value === 'correct' || answerState.value === 'wrong')
const wasCorrect = computed(() => answerState.value === 'correct')
const lastQuestion = computed(() => activeMode.value === 'fixed' && answered.value >= 10)
const feedback = computed(() => {
  const current = question.value
  if (!current || !locked.value) {
    return ''
  }
  const noteName = current.scale.notes[current.targetDegree - 1]
  return `${current.scale.name}的 ${current.targetDegree} 是 ${noteName}（${degreeCopy[current.targetDegree].name}）。现在再听一次 1 → ${current.targetDegree}。`
})
const setupAudioMessage = computed(() => {
  if (audioStatus.value === 'loading') {
    return '钢琴音色正在加载；开始后如未完成，会先使用基础音色。'
  }
  if (audioStatus.value === 'fallback') {
    return '钢琴采样暂不可用，当前使用基础合成音色。'
  }
  return '首次播放需要点击开始，以启用浏览器声音。'
})

function focusHeading() {
  void nextTick(() => heading.value?.focus())
}

function playCurrentQuestion() {
  const current = question.value
  if (!current || locked.value) {
    return
  }
  answerState.value = 'listening'
  void playTimeline(degreeQuestionSteps(current, activeHint.value), {
    onComplete: () => {
      if (!locked.value && question.value?.id === current.id) {
        answerState.value = 'answering'
      }
    },
  })
}

function prepareQuestion() {
  stop()
  question.value = nextQuestion()
  selectedDegree.value = undefined
  answerState.value = 'listening'
  focusHeading()
  playCurrentQuestion()
}

async function begin(repeat = false) {
  stop()
  if (!repeat) {
    activeMode.value = draftMode.value
    activeHint.value = draftHint.value
  }
  void router.replace({ query: { mode: activeMode.value } })
  answered.value = 0
  nextQuestion = createDegreeQuestionGenerator()
  phase.value = 'playing'
  await nextTick()
  prepareQuestion()
}

function chooseDegree(degree: CoreScaleDegree) {
  const current = question.value
  if (!current || answerState.value !== 'answering') {
    return
  }
  selectedDegree.value = degree
  answered.value++
  answerState.value = isDegreeAnswer(current, degree) ? 'correct' : 'wrong'
  void playTimeline(degreeResolutionSteps(current), {
    onComplete: () => void nextTick(() => nextButton.value?.focus()),
  })
}

function advance() {
  if (!locked.value) {
    return
  }
  if (lastQuestion.value) {
    stop()
    phase.value = 'complete'
    focusHeading()
    return
  }
  prepareQuestion()
}

function setup() {
  stop()
  draftMode.value = activeMode.value
  draftHint.value = activeHint.value
  phase.value = 'setup'
  question.value = undefined
  focusHeading()
}

function leave() {
  stop()
  if (phase.value === 'playing' && activeMode.value === 'infinite' && answered.value > 0) {
    phase.value = 'complete'
    focusHeading()
    return
  }
  void router.push({ name: 'relative-pitch-practice', query: { mode: activeMode.value } })
}

onMounted(() => void prepare())
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header class="border-b border-line bg-white">
      <div class="mx-auto grid min-h-20 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-8">
        <button type="button" class="flex min-h-11 items-center gap-2 justify-self-start rounded-xl px-2 text-sm font-bold text-muted hover:bg-brand-soft" @click="leave">
          <span aria-hidden="true">‹</span><span class="hidden sm:inline">{{ phase === 'playing' && activeMode === 'infinite' ? '结束训练' : phase === 'playing' ? '退出练习' : '返回练习' }}</span><span class="sm:hidden">返回</span>
        </button>
        <div class="text-center">
          <p class="text-sm font-extrabold sm:text-base">
            相对音高 · 音级听辨
          </p>
          <p class="mt-1 text-xs text-muted">
            {{ phase === 'setup' ? '练习设置' : phase === 'complete' ? '训练完成' : '辨认 1、3、5' }}
          </p>
        </div>
        <span v-if="phase === 'playing'" class="justify-self-end text-xs font-bold text-muted sm:text-sm">{{ activeMode === 'fixed' ? `${answered + (locked ? 0 : 1)} / 10` : `已完成 ${answered} 题` }}</span>
        <RouterLink v-else :to="{ name: 'relative-pitch-learn' }" class="flex min-h-11 items-center justify-self-end rounded-xl px-3 text-xs font-extrabold text-brand hover:bg-brand-soft sm:text-sm">
          去学习
        </RouterLink>
      </div>
      <div v-if="phase === 'playing' && activeMode === 'fixed'" class="h-1 bg-line" role="progressbar" aria-label="已完成题数" :aria-valuenow="answered" aria-valuemin="0" aria-valuemax="10">
        <div class="h-full bg-brand transition-all motion-reduce:transition-none" :style="{ width: `${answered * 10}%` }" />
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-3 py-8 sm:px-8 sm:py-12">
      <section v-if="phase === 'setup'" class="rounded-3xl border border-line bg-white p-5 opacity-60 shadow-card sm:p-6">
        <div>
          <p class="text-xs font-extrabold tracking-widest text-brand">
            核心音级听辨
          </p>
          <h1 class="mt-2 text-xl/tight font-black outline-none sm:text-2xl">
            听出大调里的“1、3、5”
          </h1>
          <p class="mt-3 text-sm/6 text-muted">
            每题先建立一个大调，再播放目标音。请判断它是主音 1、中音 3，还是属音 5；十二调循环出现，但不计算分数或正确率。
          </p>
          <div class="mt-4 hidden grid-cols-3 gap-2 md:grid" aria-label="本轮练习的音级">
            <div v-for="degree in coreScaleDegrees" :key="degree" class="rounded-2xl border border-line bg-canvas p-3 text-center">
              <strong class="block text-2xl font-black text-brand-dark">{{ degree }}</strong>
              <span class="mt-1 block text-xs font-bold">{{ degreeCopy[degree].name }}</span>
              <span class="mt-1 hidden text-[10px]/4 text-muted sm:block">{{ degreeCopy[degree].role }}</span>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="phase === 'playing' && question" class="rounded-3xl border border-line bg-white px-3 py-7 shadow-card sm:p-9">
        <div class="text-center">
          <p class="text-xs font-extrabold tracking-widest text-brand">
            {{ question.scale.id }} MAJOR · {{ tonalHintLabels[activeHint] }}
          </p>
          <h1 ref="heading" tabindex="-1" class="mt-3 text-2xl font-black outline-none sm:text-3xl">
            目标音是几级？
          </h1>
          <p class="mt-3 text-xs/5 text-muted sm:text-sm">
            {{ answerState === 'listening' ? '先听完调性提示和最后一个目标音' : locked ? '答案已揭晓，再听 1 到目标音的关系' : '保留脑中的主音参照，选择 1、3 或 5' }}
          </p>
          <button type="button" class="mt-5 min-h-11 rounded-xl border border-line px-5 text-sm font-extrabold hover:bg-brand-soft disabled:opacity-45" :disabled="locked" @click="playCurrentQuestion">
            {{ isPlaying ? '↻ 从头重播' : '▶ 重播题目' }}
          </button>
        </div>

        <div class="mx-auto mt-8 grid max-w-3xl grid-cols-3 gap-2 sm:gap-5">
          <button v-for="degree in coreScaleDegrees" :key="degree" type="button" class="min-h-32 rounded-2xl border-2 p-3 text-center transition sm:min-h-40" :class="locked && degree === question.targetDegree ? 'border-brand bg-brand-soft text-brand-dark' : locked && degree === selectedDegree && !wasCorrect ? 'border-error bg-error-soft text-error' : 'border-line hover:border-brand hover:bg-brand-soft disabled:hover:border-line disabled:hover:bg-white'" :disabled="answerState !== 'answering'" @click="chooseDegree(degree)">
            <span class="block text-4xl font-black sm:text-5xl">{{ degree }}</span>
            <span class="mt-2 block text-xs font-extrabold sm:text-sm">{{ degreeCopy[degree].name }}</span>
            <span class="mt-1 hidden text-[10px]/4 text-muted sm:block">{{ degreeCopy[degree].role }}</span>
          </button>
        </div>

        <div class="mx-auto mt-7 min-h-28 max-w-4xl" aria-live="polite" aria-atomic="true">
          <div v-if="locked" class="rounded-2xl border p-4 sm:flex sm:items-center sm:justify-between sm:gap-4" :class="wasCorrect ? 'border-brand/20 bg-brand-soft' : 'border-error/20 bg-error-soft'">
            <div>
              <p class="text-sm font-extrabold" :class="wasCorrect ? 'text-brand-dark' : 'text-error'">
                {{ wasCorrect ? `✓ 听出了音级 ${question.targetDegree}` : `× 这是音级 ${question.targetDegree}` }}
              </p>
              <p class="mt-1 text-xs/5 text-muted">
                {{ feedback }}
              </p>
            </div>
            <button ref="nextButton" type="button" class="mt-3 min-h-11 rounded-xl bg-brand px-5 text-xs font-extrabold text-white hover:bg-brand-dark sm:mt-0 sm:shrink-0" @click="advance">
              {{ lastQuestion ? '完成训练 →' : '下一题 →' }}
            </button>
          </div>
        </div>
        <p v-if="audioError" class="mt-2 text-center text-xs text-muted" role="status">
          {{ audioError }}
        </p>
      </section>

      <section v-else class="mx-auto max-w-2xl rounded-3xl border border-line bg-white p-6 text-center shadow-card sm:p-10">
        <span class="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-soft text-3xl text-brand" aria-hidden="true">✓</span>
        <h1 ref="heading" tabindex="-1" class="mt-5 text-3xl font-black outline-none">
          训练完成
        </h1>
        <p class="mt-3 text-sm/6 text-muted">
          你已经完成 {{ answered }} 道核心音级听辨。本轮不计算分数、正确率或掌握度。
        </p>
        <p class="mt-2 text-xs text-muted">
          十二调 · 1/3/5 · {{ tonalHintLabels[activeHint] }} · {{ activeMode === 'fixed' ? '固定练习' : '自由练习' }}
        </p>
        <div class="mt-7 grid gap-3 sm:grid-cols-2">
          <button type="button" class="min-h-14 rounded-xl border border-line font-bold hover:bg-brand-soft" @click="setup">
            调整设置
          </button>
          <button type="button" class="min-h-14 rounded-xl bg-brand font-bold text-white hover:bg-brand-dark" @click="begin(true)">
            再练一次 →
          </button>
        </div>
        <button type="button" class="mt-3 min-h-11 rounded-xl px-5 text-sm font-bold text-muted hover:bg-brand-soft" @click="leave">
          返回练习选择
        </button>
      </section>
    </main>

    <PracticeSetupDialog v-if="phase === 'setup'" title="开始音级听辨训练" description="选择调性提示和题目数量，练习辨认 1、3、5" cancel-label="返回练习" @start="begin()" @cancel="leave">
      <fieldset>
        <legend class="mb-2 text-sm font-bold text-muted">
          调性提示
        </legend>
        <div class="grid gap-2 sm:grid-cols-2">
          <label v-for="hint in (['scale', 'triad', 'cadence', 'tonic'] as const)" :key="hint" class="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 p-3 has-focus-visible:outline-2 has-focus-visible:outline-brand" :class="draftHint === hint ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line'">
            <span><strong class="block text-sm">{{ tonalHintLabels[hint] }}</strong><span class="mt-1 block text-[11px] text-muted">{{ hint === 'scale' ? '最完整的调性参照' : hint === 'triad' ? '依次听 1–3–5–1' : hint === 'cadence' ? '用和声感受回到主音' : '只保留最少参照' }}</span></span>
            <input v-model="draftHint" type="radio" name="hint" :value="hint" class="size-4 accent-brand">
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend class="mb-2 text-sm font-bold text-muted">
          练习长度
        </legend>
        <div class="grid grid-cols-2 gap-3">
          <label v-for="mode in (['fixed', 'infinite'] as const)" :key="mode" class="flex min-h-12 cursor-pointer items-center justify-between gap-2 rounded-2xl border-2 p-3 text-sm font-bold has-focus-visible:outline-2 has-focus-visible:outline-brand" :class="draftMode === mode ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line'">
            {{ mode === 'fixed' ? '10 题' : '自由练习 ∞' }}<input v-model="draftMode" type="radio" name="mode" :value="mode" class="size-4 accent-brand">
          </label>
        </div>
      </fieldset>
      <p class="text-center text-xs/5 text-muted" role="status">
        {{ setupAudioMessage }}
      </p>
    </PracticeSetupDialog>
  </div>
</template>
