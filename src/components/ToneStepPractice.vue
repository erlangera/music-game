<script setup lang="ts">
import type {
  Accidental,
  PracticeMode,
  SpelledPitch,
  ToneStepDirection,
  ToneStepDistance,
  ToneStepNotation,
  ToneStepQuestion,
  ToneStepSettings,
  ToneStepSymbol,
} from '@/domain/toneStepPractice'
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import PracticePageHeader from '@/components/PracticePageHeader.vue'
import PracticeSetupDialog from '@/components/PracticeSetupDialog.vue'
import {
  answerSpellings,
  createToneStepQuestionQueue,
  degrees,
  formatSpelledPitch,
  isCorrectToneStepAnswer,
  naturalNotes,
  preferredAnswer,
  toneStepDirections,
  toneStepDistances,
  toneStepNotations,
} from '@/domain/toneStepPractice'

type AnswerState = 'answering' | 'correct' | 'incorrect'
type PracticePhase = 'setup' | 'playing' | 'result'

const emit = defineEmits<{ exit: [] }>()
const fixedQuestionCount = 10
const accidentalLabels: Record<Accidental, string> = { flat: '♭', natural: '♮', sharp: '♯' }
const answerAccidentals: readonly Accidental[] = ['flat', 'sharp']
const notationLabels: Record<ToneStepNotation, string> = { note: '音名', degree: '简谱' }
const distanceLabels: Record<ToneStepDistance, string> = { 'semitone': '半音', 'whole-tone': '全音' }
const directionLabels: Record<ToneStepDirection, string> = { up: '上行', down: '下行' }

const phase = ref<PracticePhase>('setup')
const draftNotations = ref<ToneStepNotation[]>([...toneStepNotations])
const draftDistances = ref<ToneStepDistance[]>([...toneStepDistances])
const draftDirections = ref<ToneStepDirection[]>([...toneStepDirections])
const draftMode = ref<PracticeMode>('fixed')
const activeSettings = ref<ToneStepSettings>({
  notations: [...toneStepNotations],
  distances: [...toneStepDistances],
  directions: [...toneStepDirections],
  mode: 'fixed',
})
const questionQueue = ref<ToneStepQuestion[]>([])
const currentQuestion = ref<ToneStepQuestion | null>(null)
const questionIndex = ref(0)
const selectedAccidental = ref<Accidental>('natural')
const selectedSymbol = ref<ToneStepSymbol | null>(null)
const submittedAnswer = ref<SpelledPitch | null>(null)
const answerState = ref<AnswerState>('answering')
const correctCount = ref(0)
const answeredCount = ref(0)
const nextButton = ref<HTMLButtonElement | null>(null)

let advanceTimer: number | undefined

const availableSymbols = computed<readonly ToneStepSymbol[]>(() => (
  currentQuestion.value?.notation === 'degree' ? degrees : naturalNotes
))
const canSubmit = computed(() => selectedSymbol.value !== null)
const selectedPreview = computed(() => {
  if (!currentQuestion.value || selectedSymbol.value === null) {
    return '？'
  }
  return formatSpelledPitch({ accidental: selectedAccidental.value, symbol: selectedSymbol.value }, currentQuestion.value.notation)
})
const preferredAnswerText = computed(() => currentQuestion.value
  ? formatSpelledPitch(preferredAnswer(currentQuestion.value), currentQuestion.value.notation)
  : '')
const submittedAnswerText = computed(() => currentQuestion.value && submittedAnswer.value
  ? formatSpelledPitch(submittedAnswer.value, currentQuestion.value.notation)
  : '')
const equivalentAnswerText = computed(() => {
  if (!currentQuestion.value) {
    return ''
  }
  const displayedAnswer = answerState.value === 'correct' ? submittedAnswerText.value : preferredAnswerText.value
  return answerSpellings(currentQuestion.value)
    .map(answer => formatSpelledPitch(answer, currentQuestion.value!.notation))
    .filter(answer => answer !== displayedAnswer)
    .join('、')
})
const incorrectCount = computed(() => answeredCount.value - correctCount.value)
const accuracy = computed(() => answeredCount.value === 0 ? 0 : Math.round(correctCount.value / answeredCount.value * 100))
const progress = computed(() => {
  if (phase.value === 'result' && activeSettings.value.mode === 'fixed') {
    return 100
  }
  if (phase.value !== 'playing' || activeSettings.value.mode === 'infinite') {
    return 0
  }
  return (questionIndex.value + 1) / fixedQuestionCount * 100
})
const headerCounter = computed(() => {
  if (phase.value === 'setup') {
    return '设置'
  }
  if (phase.value === 'result') {
    return '完成'
  }
  return activeSettings.value.mode === 'infinite' ? `第 ${questionIndex.value + 1} 题 · ∞` : `${questionIndex.value + 1} / ${fixedQuestionCount}`
})
const headerModeLabel = computed(() => (
  activeSettings.value.notations.map(notation => notationLabels[notation]).join(' + ')
))
const promptText = computed(() => {
  if (!currentQuestion.value) {
    return ''
  }
  return String(currentQuestion.value.prompt)
})
const directionArrow = computed(() => currentQuestion.value?.direction === 'down' ? '↓' : '↑')

function toggleOption<T>(selected: T[], option: T, allOptions: readonly T[]) {
  if (selected.includes(option)) {
    return selected.length === 1 ? selected : selected.filter(item => item !== option)
  }
  return allOptions.filter(item => item === option || selected.includes(item))
}

function clearAdvanceTimer() {
  if (advanceTimer !== undefined) {
    window.clearTimeout(advanceTimer)
    advanceTimer = undefined
  }
}

function prepareQuestion(question: ToneStepQuestion) {
  currentQuestion.value = question
  selectedAccidental.value = 'natural'
  selectedSymbol.value = null
  submittedAnswer.value = null
  answerState.value = 'answering'
}

function createNextInfiniteQuestion() {
  return createToneStepQuestionQueue(1, activeSettings.value)[0]!
}

function beginSession(settings: ToneStepSettings) {
  clearAdvanceTimer()
  activeSettings.value = {
    ...settings,
    notations: [...settings.notations],
    distances: [...settings.distances],
    directions: [...settings.directions],
  }
  questionIndex.value = 0
  correctCount.value = 0
  answeredCount.value = 0
  questionQueue.value = settings.mode === 'fixed'
    ? createToneStepQuestionQueue(fixedQuestionCount, settings)
    : []
  prepareQuestion(settings.mode === 'fixed' ? questionQueue.value[0]! : createNextInfiniteQuestion())
  phase.value = 'playing'
}

function startSession() {
  beginSession({
    notations: [...draftNotations.value],
    distances: [...draftDistances.value],
    directions: [...draftDirections.value],
    mode: draftMode.value,
  })
}

function restartSession() {
  beginSession(activeSettings.value)
}

function openSetup() {
  clearAdvanceTimer()
  draftNotations.value = [...activeSettings.value.notations]
  draftDistances.value = [...activeSettings.value.distances]
  draftDirections.value = [...activeSettings.value.directions]
  draftMode.value = activeSettings.value.mode
  currentQuestion.value = null
  phase.value = 'setup'
}

function finishSession() {
  clearAdvanceTimer()
  if (answeredCount.value === 0) {
    openSetup()
    return
  }
  phase.value = 'result'
}

function advanceQuestion() {
  clearAdvanceTimer()
  if (activeSettings.value.mode === 'fixed') {
    const nextIndex = questionIndex.value + 1
    if (nextIndex >= fixedQuestionCount) {
      phase.value = 'result'
      return
    }
    questionIndex.value = nextIndex
    prepareQuestion(questionQueue.value[nextIndex]!)
    return
  }
  questionIndex.value += 1
  prepareQuestion(createNextInfiniteQuestion())
}

function submitAnswer() {
  if (!currentQuestion.value || !canSubmit.value || answerState.value !== 'answering') {
    return
  }
  const answer: SpelledPitch = {
    accidental: selectedAccidental.value,
    symbol: selectedSymbol.value!,
  }
  submittedAnswer.value = answer
  answeredCount.value += 1
  if (isCorrectToneStepAnswer(currentQuestion.value, answer)) {
    answerState.value = 'correct'
    correctCount.value += 1
    advanceTimer = window.setTimeout(advanceQuestion, equivalentAnswerText.value ? 1500 : 1000)
    return
  }
  answerState.value = 'incorrect'
  void nextTick(() => nextButton.value?.focus())
}

function toggleAccidental(accidental: Accidental) {
  selectedAccidental.value = selectedAccidental.value === accidental ? 'natural' : accidental
}

function handleExitAction() {
  if (phase.value === 'playing' && activeSettings.value.mode === 'infinite') {
    finishSession()
    return
  }
  emit('exit')
}

onBeforeUnmount(clearAdvanceTimer)
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <PracticePageHeader :inert="phase === 'setup'" :aria-hidden="phase === 'setup'">
      <div class="mx-auto flex min-h-16 max-w-[1180px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:min-h-[76px] lg:px-8">
        <button type="button" class="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-extrabold text-muted transition-colors hover:bg-canvas hover:text-ink sm:px-3" @click="handleExitAction">
          <span aria-hidden="true">‹</span>
          <span class="hidden sm:inline">{{ phase === 'playing' && activeSettings.mode === 'infinite' ? '结束训练' : '退出训练' }}</span>
          <span class="sm:hidden">{{ phase === 'playing' && activeSettings.mode === 'infinite' ? '结束' : '退出' }}</span>
        </button>
        <div class="min-w-0 text-center">
          <div class="flex items-center justify-center gap-2">
            <h1 class="truncate text-sm font-extrabold text-ink sm:text-base">
              半音与全音
            </h1>
            <span class="hidden rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-extrabold text-brand-dark sm:inline">{{ headerModeLabel }}</span>
          </div>
          <p class="mt-0.5 text-[10px] font-bold text-muted sm:hidden">
            {{ headerModeLabel }}
          </p>
        </div>
        <div class="min-w-[74px] text-right text-sm font-extrabold text-ink tabular-nums">
          {{ headerCounter }}
        </div>
      </div>
      <div class="h-1 bg-[#edf0ed]" aria-hidden="true">
        <div v-if="activeSettings.mode === 'fixed'" class="h-full bg-brand transition-[width] duration-300" :style="{ width: `${progress}%` }" />
      </div>
    </PracticePageHeader>

    <main class="mx-auto flex min-h-[calc(100vh-80px)] max-w-[940px] flex-col px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12" :inert="phase === 'setup'" :aria-hidden="phase === 'setup'">
      <section v-if="phase === 'setup'" class="flex flex-1 flex-col opacity-70" aria-hidden="true">
        <div class="rounded-[26px] border border-line bg-white px-3 py-8 text-center shadow-card sm:p-10">
          <p class="text-sm font-extrabold text-muted">
            填写目标音
          </p>
          <p class="py-10 text-5xl font-black text-brand-dark sm:text-7xl">
            B <span class="text-brand">↑</span> 半音 = ?
          </p>
          <div class="grid grid-cols-2 gap-2">
            <span v-for="item in ['♭', '♯']" :key="item" class="rounded-2xl border-2 border-line py-4 text-2xl font-black">{{ item }}</span>
          </div>
        </div>
      </section>

      <section v-else-if="phase === 'playing' && currentQuestion" class="flex flex-1 flex-col" aria-labelledby="question-title">
        <div class="rounded-[26px] border border-line bg-white px-3 py-7 text-center shadow-card sm:rounded-[30px] sm:px-9 sm:py-10 lg:p-12">
          <p id="question-title" class="text-xs font-extrabold tracking-wide text-muted sm:text-sm">
            选择{{ currentQuestion.notation === 'note' ? '音名' : '简谱数字' }}，需要时添加升降号
          </p>
          <div class="flex items-center justify-center gap-3 py-7 text-4xl font-black text-ink sm:gap-5 sm:py-10 sm:text-6xl">
            <span>{{ promptText }}</span>
            <span class="text-brand" :aria-label="directionLabels[currentQuestion.direction]">{{ directionArrow }}</span>
            <span class="shrink-0 text-xl whitespace-nowrap text-muted sm:text-4xl">{{ distanceLabels[currentQuestion.distance] }}</span>
            <span class="text-muted">=</span>
            <span class="min-w-[1.5em] text-brand-dark">{{ selectedPreview }}</span>
          </div>

          <fieldset :disabled="answerState !== 'answering'">
            <legend class="text-xs font-extrabold text-muted">
              升降号（可选，默认不加）
            </legend>
            <div class="mx-auto mt-2 grid max-w-sm grid-cols-2 gap-2.5 sm:gap-3">
              <button v-for="accidental in answerAccidentals" :key="accidental" type="button" class="min-h-14 rounded-2xl border-2 text-2xl font-black transition sm:min-h-16" :class="selectedAccidental === accidental ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:border-brand/40 hover:bg-brand-soft'" :aria-pressed="selectedAccidental === accidental" @click="toggleAccidental(accidental)">
                {{ accidentalLabels[accidental] }}
              </button>
            </div>
          </fieldset>

          <fieldset class="mt-5 min-w-0" :disabled="answerState !== 'answering'">
            <legend class="text-xs font-extrabold text-muted">
              再选择{{ currentQuestion.notation === 'note' ? '音名' : '简谱数字' }}
            </legend>
            <div class="seven-option-grid mt-2">
              <button v-for="symbol in availableSymbols" :key="symbol" type="button" class="min-h-12 rounded-xl border-2 text-base font-black transition sm:min-h-16 sm:rounded-2xl sm:text-2xl" :class="selectedSymbol === symbol ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:border-brand/40 hover:bg-brand-soft'" :aria-pressed="selectedSymbol === symbol" @click="selectedSymbol = symbol">
                {{ symbol }}
              </button>
            </div>
          </fieldset>

          <button v-if="answerState === 'answering'" type="button" class="mt-5 min-h-12 w-full max-w-md rounded-2xl bg-brand px-5 text-sm font-extrabold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40" :disabled="!canSubmit" @click="submitAnswer">
            提交答案
          </button>

          <div class="mt-5 min-h-[88px]" aria-live="polite">
            <div v-if="answerState === 'correct'" class="flex min-h-[72px] items-center justify-center gap-3 rounded-2xl bg-brand-soft px-4 text-left text-brand-dark">
              <span class="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-white">✓</span>
              <div>
                <p class="text-sm font-extrabold sm:text-base">
                  答对了！{{ promptText }} {{ directionArrow }} {{ distanceLabels[currentQuestion.distance] }} = {{ selectedPreview }}
                </p>
                <p class="mt-0.5 text-xs font-bold text-brand/80">
                  {{ equivalentAnswerText ? `等音写法也可以是：${equivalentAnswerText}` : '即将进入下一题' }}
                </p>
              </div>
            </div>
            <div v-else-if="answerState === 'incorrect'" class="flex flex-col items-center justify-between gap-3 rounded-2xl bg-[#fff5e9] px-4 py-3 text-left sm:min-h-[72px] sm:flex-row sm:px-5">
              <div class="flex items-center gap-3 text-[#805420]">
                <span class="grid size-9 shrink-0 place-items-center rounded-full bg-[#f2b55f] text-white">!</span>
                <div>
                  <p class="text-sm font-extrabold sm:text-base">
                    再走一遍：正确答案是 {{ preferredAnswerText }}
                  </p>
                  <p class="mt-0.5 text-xs font-bold text-[#9b7242]">
                    {{ equivalentAnswerText ? `也接受：${equivalentAnswerText}` : `你的答案：${submittedAnswerText}` }}
                  </p>
                </div>
              </div>
              <button ref="nextButton" type="button" class="min-h-11 w-full rounded-xl bg-ink px-5 text-sm font-extrabold text-white transition hover:bg-brand-dark sm:w-auto" @click="advanceQuestion">
                下一题
              </button>
            </div>
          </div>
        </div>
        <div class="mt-5 text-center text-xs font-bold text-muted">
          忽略八度，按十二音循环判定；等音写法都算正确。
        </div>
      </section>

      <section v-else-if="phase === 'result'" class="my-auto rounded-[28px] border border-line bg-white px-5 py-10 text-center shadow-card sm:px-10 sm:py-14" aria-labelledby="result-title">
        <span class="mx-auto grid size-16 place-items-center rounded-[22px] bg-brand-soft text-3xl text-brand">✓</span>
        <p class="mt-5 text-sm font-extrabold text-brand">
          {{ activeSettings.mode === 'infinite' ? '本次无限练习已结束' : '本轮训练完成' }}
        </p>
        <h1 id="result-title" class="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">
          你答对了 {{ correctCount }} 题
        </h1>
        <p class="mt-3 text-sm font-bold text-muted">
          正确率 {{ accuracy }}% · 共 {{ answeredCount }} 题
        </p>
        <div class="mx-auto mt-7 grid max-w-md grid-cols-2 gap-3 rounded-2xl bg-canvas p-4">
          <div><strong class="block text-2xl font-black text-brand">{{ correctCount }}</strong><span class="text-xs font-bold text-muted">正确</span></div>
          <div class="border-l border-line">
            <strong class="block text-2xl font-black text-[#b56052]">{{ incorrectCount }}</strong><span class="text-xs font-bold text-muted">需要复习</span>
          </div>
        </div>
        <div class="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
          <button type="button" class="min-h-12 rounded-2xl border border-line bg-white px-4 text-sm font-extrabold text-ink transition hover:bg-canvas" @click="emit('exit')">
            返回课程
          </button>
          <button type="button" class="min-h-12 rounded-2xl border border-brand/20 bg-brand-soft px-4 text-sm font-extrabold text-brand-dark transition hover:bg-[#d8ecdf]" @click="openSetup">
            调整设置
          </button>
          <button type="button" class="min-h-12 rounded-2xl bg-brand px-4 text-sm font-extrabold text-white transition hover:bg-brand-dark" @click="restartSession">
            再练一次
          </button>
        </div>
      </section>
    </main>

    <PracticeSetupDialog v-if="phase === 'setup'" title="开始半音与全音训练" description="选择表示方式、移动方向和距离" cancel-label="返回课程" @start="startSession" @cancel="emit('exit')">
      <fieldset>
        <legend class="text-sm font-extrabold text-ink">
          表示方式（可多选）
        </legend>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <button v-for="notation in toneStepNotations" :key="notation" type="button" role="checkbox" class="relative min-h-20 rounded-[20px] border-2 p-3 text-left transition" :class="draftNotations.includes(notation) ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand/30'" :aria-checked="draftNotations.includes(notation)" @click="draftNotations = toggleOption(draftNotations, notation, toneStepNotations)">
            <strong class="text-sm font-black text-ink">{{ notationLabels[notation] }}</strong>
            <span class="mt-2 block text-xs font-bold text-muted">{{ notation === 'note' ? '使用 C–B 作答' : '使用 1–7 作答' }}</span>
            <span v-if="draftNotations.includes(notation)" class="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-brand text-xs font-black text-white">✓</span>
          </button>
        </div>
      </fieldset>
      <fieldset>
        <legend class="text-sm font-extrabold text-ink">
          距离（可多选）
        </legend>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <button v-for="distance in toneStepDistances" :key="distance" type="button" role="checkbox" class="relative min-h-16 rounded-[18px] border-2 p-3 text-left transition" :class="draftDistances.includes(distance) ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand/30'" :aria-checked="draftDistances.includes(distance)" @click="draftDistances = toggleOption(draftDistances, distance, toneStepDistances)">
            <strong class="text-sm font-black">{{ distanceLabels[distance] }}</strong>
            <span class="mt-1 block text-xs font-bold text-muted">{{ distance === 'semitone' ? '移动 1 个半音' : '移动 2 个半音' }}</span>
            <span v-if="draftDistances.includes(distance)" class="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-brand text-xs font-black text-white">✓</span>
          </button>
        </div>
      </fieldset>
      <fieldset>
        <legend class="text-sm font-extrabold text-ink">
          方向（可多选）
        </legend>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <button v-for="direction in toneStepDirections" :key="direction" type="button" role="checkbox" class="relative min-h-16 rounded-[18px] border-2 p-3 text-left transition" :class="draftDirections.includes(direction) ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand/30'" :aria-checked="draftDirections.includes(direction)" @click="draftDirections = toggleOption(draftDirections, direction, toneStepDirections)">
            <strong class="text-sm font-black">{{ direction === 'up' ? '↑ 上行' : '↓ 下行' }}</strong>
            <span class="mt-1 block text-xs font-bold text-muted">{{ direction === 'up' ? '寻找更高的音' : '寻找更低的音' }}</span>
            <span v-if="draftDirections.includes(direction)" class="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-brand text-xs font-black text-white">✓</span>
          </button>
        </div>
      </fieldset>
      <fieldset>
        <legend class="text-sm font-extrabold text-ink">
          题目数量
        </legend>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <button v-for="mode in (['fixed', 'infinite'] as const)" :key="mode" type="button" role="radio" class="relative min-h-20 rounded-[20px] border-2 p-3 text-left transition" :class="draftMode === mode ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand/30'" :aria-checked="draftMode === mode" @click="draftMode = mode">
            <strong class="text-sm font-black">{{ mode === 'fixed' ? '10 题练习' : '无限练习' }}</strong>
            <span class="mt-2 block text-xs font-bold text-muted">{{ mode === 'fixed' ? '完成后查看正确率' : '随时结束查看报告' }}</span>
            <span v-if="draftMode === mode" class="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-brand text-xs font-black text-white">✓</span>
          </button>
        </div>
      </fieldset>
      <div class="flex gap-3 rounded-2xl bg-brand-soft px-4 py-3 text-xs font-bold text-brand-dark">
        <span aria-hidden="true">💡</span><p>不选升降号就是自然音。忽略八度并接受等音写法，例如 B 上行半音可答 C 或 B♯。</p>
      </div>
    </PracticeSetupDialog>
  </div>
</template>
