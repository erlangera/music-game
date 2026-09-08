<script setup lang="ts">
import type {
  AnswerValue,
  PracticeMode,
  PracticeQuestion,
  PracticeSettings,
  QuestionDirection,
  SolfegeName,
  SolfegePair,
} from '@/domain/solfegePractice'

import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import PracticeSetupDialog from '@/components/PracticeSetupDialog.vue'
import SpeakerIcon from '@/components/SpeakerIcon.vue'
import { useSolfegeAudio } from '@/composables/useSolfegeAudio'
import {
  allDegrees,
  allSolfegeNames,
  createBalancedPairDeck,
  createFixedQuestionQueue,
  expectedAnswerAt,
  promptValueAt,
  shuffle,
  solfegePairs,
} from '@/domain/solfegePractice'

type AnswerState = 'answering' | 'correct' | 'incorrect'
type PracticePhase = 'setup' | 'playing' | 'result'

const emit = defineEmits<{ exit: [] }>()
const fixedQuestionCount = 10
const sequencePresets = [1, 4, 8, 12] as const

const { playingKey, error: audioError, autoPlaying, stop: stopAudio, playItem, playSequence, advanceTo } = useSolfegeAudio()
const draftDictation = ref(true)
const phase = ref<PracticePhase>('setup')
const draftMode = ref<PracticeMode>('fixed')
const draftSequenceLength = ref(1)
const activeSettings = ref<PracticeSettings>({ mode: 'fixed', sequenceLength: 1, dictation: true })
const fixedQuestionQueue = ref<PracticeQuestion[]>([])
const currentQuestion = ref<PracticeQuestion | null>(null)
const questionIndex = ref(0)
const optionOrder = ref<AnswerValue[]>([])
const selectedAnswer = ref<AnswerValue | null>(null)
const answerIndex = ref(0)
const failedAnswerIndex = ref<number | null>(null)
const answerState = ref<AnswerState>('answering')
const correctCount = ref(0)
const answeredCount = ref(0)
const nextButton = ref<HTMLButtonElement | null>(null)

let advanceTimer: number | undefined
let infinitePairBuffer: SolfegePair[] = []
let infiniteDirectionBuffer: QuestionDirection[] = []
let lastInfinitePairName: SolfegeName | undefined

const expectedAnswer = computed(() => currentQuestion.value
  ? expectedAnswerAt(currentQuestion.value, answerIndex.value)
  : undefined)
const questionLength = computed(() => currentQuestion.value?.sequence.length ?? 1)
const isSingleQuestion = computed(() => questionLength.value === 1)
const incorrectCount = computed(() => answeredCount.value - correctCount.value)
const accuracy = computed(() => answeredCount.value === 0
  ? 0
  : Math.round((correctCount.value / answeredCount.value) * 100))
const progress = computed(() => {
  if (phase.value === 'result' && activeSettings.value.mode === 'fixed') {
    return 100
  }
  if (phase.value !== 'playing' || activeSettings.value.mode === 'infinite') {
    return 0
  }
  return ((questionIndex.value + 1) / fixedQuestionCount) * 100
})
const sequenceProgress = computed(() => {
  if (!currentQuestion.value) {
    return 0
  }
  if (answerState.value === 'correct') {
    return 100
  }
  return (answerIndex.value / currentQuestion.value.sequence.length) * 100
})
const headerCounter = computed(() => {
  if (phase.value === 'setup') {
    return '设置'
  }
  if (phase.value === 'result') {
    return '完成'
  }
  if (activeSettings.value.mode === 'infinite') {
    return `第 ${questionIndex.value + 1} 题 · ∞`
  }
  return `${questionIndex.value + 1} / ${fixedQuestionCount}`
})
const headerModeLabel = computed(() => `${activeSettings.value.dictation ? '唱名默写' : '双向文字'} · ${activeSettings.value.sequenceLength} 项`)
const correctSequenceText = computed(() => currentQuestion.value
  ? currentQuestion.value.sequence.map((_, index) => expectedAnswerAt(currentQuestion.value!, index)).join(' ')
  : '')
const promptSequenceText = computed(() => currentQuestion.value
  ? currentQuestion.value.sequence.map((_, index) => promptValueAt(currentQuestion.value!, index)).join(' ')
  : '')

function createOptionOrder(direction: QuestionDirection): AnswerValue[] {
  return [...(direction === 'name-to-degree' ? allDegrees : allSolfegeNames)]
}

function clearAdvanceTimer() {
  if (advanceTimer !== undefined) {
    window.clearTimeout(advanceTimer)
    advanceTimer = undefined
  }
}

function resetInfiniteGenerator() {
  infinitePairBuffer = []
  infiniteDirectionBuffer = []
  lastInfinitePairName = undefined
}

function takeInfinitePairs(count: number) {
  while (infinitePairBuffer.length < count) {
    const nextCycle = createBalancedPairDeck(solfegePairs.length)

    if (lastInfinitePairName && nextCycle[0]?.name === lastInfinitePairName) {
      ;[nextCycle[0], nextCycle[1]] = [nextCycle[1]!, nextCycle[0]!]
    }

    infinitePairBuffer.push(...nextCycle)
    lastInfinitePairName = nextCycle.at(-1)?.name
  }

  return infinitePairBuffer.splice(0, count)
}

function takeInfiniteDirection() {
  if (infiniteDirectionBuffer.length === 0) {
    infiniteDirectionBuffer = shuffle<QuestionDirection>(['name-to-degree', 'degree-to-name'])
  }
  return infiniteDirectionBuffer.shift()!
}

function createInfiniteQuestion(): PracticeQuestion {
  return {
    direction: takeInfiniteDirection(),
    sequence: takeInfinitePairs(activeSettings.value.sequenceLength),
  }
}

function prepareQuestion(question: PracticeQuestion) {
  stopAudio()
  audioError.value = ''
  if (activeSettings.value.dictation) {
    question = { ...question, direction: 'name-to-degree' }
  }
  currentQuestion.value = question
  selectedAnswer.value = null
  answerIndex.value = 0
  failedAnswerIndex.value = null
  answerState.value = 'answering'
  optionOrder.value = createOptionOrder(question.direction)
  if (activeSettings.value.dictation) {
    void playSequence(question.sequence.map(pair => pair.name))
  }
}

function beginSession(settings: PracticeSettings) {
  clearAdvanceTimer()
  activeSettings.value = { ...settings }
  questionIndex.value = 0
  correctCount.value = 0
  answeredCount.value = 0
  resetInfiniteGenerator()

  if (settings.mode === 'fixed') {
    fixedQuestionQueue.value = createFixedQuestionQueue(fixedQuestionCount, settings.sequenceLength)
    prepareQuestion(fixedQuestionQueue.value[0]!)
  }
  else {
    fixedQuestionQueue.value = []
    prepareQuestion(createInfiniteQuestion())
  }

  phase.value = 'playing'
}

function startSession() {
  beginSession({ mode: draftMode.value, sequenceLength: draftSequenceLength.value, dictation: draftDictation.value })
}

function restartSession() {
  beginSession(activeSettings.value)
}

function openSetup() {
  clearAdvanceTimer()
  stopAudio()
  draftDictation.value = activeSettings.value.dictation
  draftMode.value = activeSettings.value.mode
  draftSequenceLength.value = activeSettings.value.sequenceLength
  currentQuestion.value = null
  phase.value = 'setup'
}

function finishSession() {
  stopAudio()
  clearAdvanceTimer()
  if (answeredCount.value === 0) {
    openSetup()
    return
  }
  phase.value = 'result'
}

function advanceQuestion() {
  stopAudio()
  clearAdvanceTimer()

  if (activeSettings.value.mode === 'fixed') {
    const nextQuestionIndex = questionIndex.value + 1
    if (nextQuestionIndex >= fixedQuestionCount) {
      phase.value = 'result'
      return
    }
    questionIndex.value = nextQuestionIndex
    prepareQuestion(fixedQuestionQueue.value[nextQuestionIndex]!)
    return
  }

  questionIndex.value += 1
  prepareQuestion(createInfiniteQuestion())
}

function submitAnswer(answer: AnswerValue) {
  if (phase.value !== 'playing' || answerState.value !== 'answering' || !currentQuestion.value) {
    return
  }

  selectedAnswer.value = answer
  if (answer !== expectedAnswer.value) {
    failedAnswerIndex.value = answerIndex.value
    if (activeSettings.value.dictation) {
      stopAudio()
    }
    answerState.value = 'incorrect'
    answeredCount.value += 1
    void nextTick(() => nextButton.value?.focus())
    return
  }

  if (answerIndex.value < currentQuestion.value.sequence.length - 1) {
    answerIndex.value += 1
    if (activeSettings.value.dictation) {
      advanceTo(answerIndex.value)
    }
    return
  }

  if (activeSettings.value.dictation) {
    stopAudio()
  }
  answerState.value = 'correct'
  correctCount.value += 1
  answeredCount.value += 1
  advanceTimer = window.setTimeout(advanceQuestion, 900)
}

function answerButtonClass(answer: AnswerValue) {
  if (answerState.value === 'correct' && selectedAnswer.value === answer) {
    return 'border-brand bg-brand text-white shadow-[0_8px_22px_rgb(31_122_85_/_0.2)]'
  }
  if (answerState.value === 'incorrect' && answer === expectedAnswer.value) {
    return 'border-brand bg-brand text-white shadow-[0_8px_22px_rgb(31_122_85_/_0.2)]'
  }
  if (answerState.value === 'incorrect' && selectedAnswer.value === answer) {
    return 'border-[#dd746f] bg-[#fff0ef] text-[#a83e39]'
  }
  return 'border-line bg-white text-ink hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand-soft focus-visible:border-brand'
}

function promptTokenClass(index: number) {
  if (answerState.value === 'correct') {
    return 'border-brand/20 bg-brand-soft text-brand-dark'
  }
  if (answerState.value === 'incorrect' && index === failedAnswerIndex.value) {
    return 'border-[#dd746f] bg-[#fff0ef] text-[#a83e39]'
  }
  if (index < answerIndex.value) {
    return 'border-brand/20 bg-brand-soft text-brand-dark'
  }
  if (answerState.value === 'answering' && index === answerIndex.value) {
    return 'border-brand bg-white text-brand-dark shadow-[0_0_0_3px_rgb(31_122_85_/_0.12)]'
  }
  return 'border-line bg-canvas text-muted'
}

function playPrompt(index: number) {
  const pair = currentQuestion.value?.sequence[index]
  if (pair) {
    playItem(pair.name, `prompt-${index}`)
  }
}

function chooseAnswer(answer: AnswerValue) {
  if (typeof answer === 'string') {
    playItem(answer, `answer-${answer}`)
  }
  submitAnswer(answer)
}

function canPlayPrompt(index: number) {
  return activeSettings.value.dictation || typeof questionDisplayAt(index) === 'string'
}

function isConvertedSequenceItem(index: number) {
  return (!isSingleQuestion.value || activeSettings.value.dictation)
    && (answerState.value === 'correct' || index < answerIndex.value)
}

function questionDisplayAt(index: number) {
  if (!currentQuestion.value) {
    return undefined
  }

  if (activeSettings.value.dictation && !isConvertedSequenceItem(index)) {
    return undefined
  }

  return isConvertedSequenceItem(index)
    ? expectedAnswerAt(currentQuestion.value, index)
    : promptValueAt(currentQuestion.value, index)
}

function questionTokenAriaLabel(index: number) {
  if (activeSettings.value.dictation && !isConvertedSequenceItem(index)) {
    return `播放第 ${index + 1} 项`
  }
  const value = questionDisplayAt(index)

  if (isConvertedSequenceItem(index)) {
    return `第 ${index + 1} 项已转换为 ${value}`
  }

  return `第 ${index + 1} 项 ${value}`
}

function handleExitAction() {
  stopAudio()
  if (phase.value === 'playing' && activeSettings.value.mode === 'infinite') {
    finishSession()
    return
  }
  emit('exit')
}

function handleKeydown(event: KeyboardEvent) {
  if (phase.value === 'setup') {
    return
  }
  if (phase.value === 'result') {
    const target = event.target
    const isInteractiveTarget = target instanceof HTMLElement
      && Boolean(target.closest('button, a, input, select, textarea, [contenteditable="true"]'))
    if (event.key === 'Enter' && !isInteractiveTarget) {
      event.preventDefault()
      restartSession()
    }
    return
  }
  if (answerState.value === 'incorrect' && event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) {
    event.preventDefault()
    advanceQuestion()
    return
  }
  if (
    event.target instanceof HTMLInputElement
    || answerState.value !== 'answering'
    || currentQuestion.value?.direction !== 'name-to-degree'
    || !/^[1-7]$/.test(event.key)
  ) {
    return
  }
  event.preventDefault()
  submitAnswer(Number(event.key) as AnswerValue)
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  clearAdvanceTimer()
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header class="border-b border-line bg-white" :inert="phase === 'setup'" :aria-hidden="phase === 'setup'">
      <div class="mx-auto flex min-h-16 max-w-[1180px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:min-h-[76px] lg:px-8">
        <button type="button" class="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-extrabold text-muted transition-colors hover:bg-canvas hover:text-ink sm:px-3" @click="handleExitAction">
          <svg viewBox="0 0 20 20" class="size-4" aria-hidden="true"><path d="m12.5 4.5-5.5 5.5 5.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <span class="hidden sm:inline">{{ phase === 'playing' && activeSettings.mode === 'infinite' ? '结束训练' : '退出训练' }}</span>
          <span class="sm:hidden">{{ phase === 'playing' && activeSettings.mode === 'infinite' ? '结束' : '退出' }}</span>
        </button>
        <div class="min-w-0 text-center">
          <div class="flex items-center justify-center gap-2">
            <h1 class="truncate text-sm font-extrabold text-ink sm:text-base">
              唱名记忆训练
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
    </header>

    <main class="mx-auto flex min-h-[calc(100vh-80px)] max-w-[940px] flex-col px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12" :inert="phase === 'setup'" :aria-hidden="phase === 'setup'">
      <section v-if="phase === 'setup'" class="flex flex-1 flex-col opacity-70" aria-hidden="true">
        <div class="rounded-[26px] border border-line bg-white px-5 py-7 text-center shadow-card sm:rounded-[30px] sm:px-9 sm:py-10 lg:p-12">
          <p class="text-xs font-extrabold tracking-wide text-muted sm:text-sm">
            看到唱名，选择对应的简谱数字
          </p>
          <div class="py-8 sm:py-10 lg:py-12">
            <p class="text-[72px] leading-none font-black tracking-[-0.06em] text-brand-dark sm:text-[96px] lg:text-[112px]">
              mi
            </p>
            <p class="mt-4 text-sm font-bold text-muted sm:text-base">
              它对应哪个数字？
            </p>
          </div>
          <div class="grid grid-cols-4 gap-2.5 sm:gap-3 lg:grid-cols-7">
            <div v-for="answer in allDegrees" :key="answer" class="grid min-h-[68px] place-items-center rounded-2xl border-2 border-line bg-white text-2xl font-black text-ink sm:min-h-[76px] sm:text-3xl">
              {{ answer }}
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="phase === 'playing' && currentQuestion" class="flex flex-1 flex-col" aria-labelledby="question-title">
        <div class="rounded-[26px] border border-line bg-white px-5 py-7 text-center shadow-card sm:rounded-[30px] sm:px-9 sm:py-10 lg:p-12">
          <div class="flex flex-wrap items-center justify-center gap-2">
            <p id="question-title" class="text-xs font-extrabold tracking-wide text-muted sm:text-sm">
              {{ activeSettings.dictation ? '听唱名，依次选择对应的简谱数字' : currentQuestion.direction === 'name-to-degree' ? '看到唱名，依次选择对应的简谱数字' : '看到简谱数字，依次选择对应的唱名' }}
            </p>
            <span v-if="!isSingleQuestion" class="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-extrabold text-brand-dark">第 {{ Math.min(answerIndex + 1, questionLength) }} / {{ questionLength }} 项</span>
          </div>

          <div class="py-7 sm:py-9 lg:py-10">
            <ol class="flex flex-wrap items-center justify-center gap-2 sm:gap-3" aria-label="题目序列">
              <li v-for="(_, index) in currentQuestion.sequence" :key="`${questionIndex}-${index}`" :aria-current="answerState === 'answering' && index === answerIndex ? 'step' : undefined">
                <component :is="canPlayPrompt(index) ? 'button' : 'span'" :type="canPlayPrompt(index) ? 'button' : undefined" class="relative flex size-14 items-center justify-center rounded-2xl border-2 text-xl font-black transition sm:size-16 sm:text-2xl" :class="[promptTokenClass(index), playingKey === `prompt-${index}` ? 'ring-2 ring-brand/30 ring-offset-2' : '']" :aria-label="questionTokenAriaLabel(index)" @click="canPlayPrompt(index) && playPrompt(index)">
                  <span v-if="questionDisplayAt(index) !== undefined">{{ questionDisplayAt(index) }}</span>
                  <SpeakerIcon v-if="canPlayPrompt(index)" :playing="playingKey === `prompt-${index}`" :class="questionDisplayAt(index) === undefined ? 'size-7 sm:size-8' : 'absolute right-1 bottom-1 size-3 sm:size-3.5'" />
                </component>
              </li>
            </ol>
            <p class="mt-4 text-sm font-bold text-muted sm:text-base">
              {{ activeSettings.dictation ? '点击小喇叭可重听，答对后显示数字' : isSingleQuestion ? currentQuestion.direction === 'name-to-degree' ? '它对应哪个数字？' : '它对应哪个唱名？' : '从左到右作答，答对后会在原位置完成转换' }}
            </p>
            <div v-if="!isSingleQuestion" class="mx-auto mt-4 h-1.5 max-w-md overflow-hidden rounded-full bg-[#edf0ed]" aria-hidden="true">
              <div class="h-full rounded-full bg-brand transition-[width] duration-200" :style="{ width: `${sequenceProgress}%` }" />
            </div>
          </div>

          <p v-if="activeSettings.dictation || audioError" class="mb-4 text-xs font-bold text-muted" role="status">
            {{ audioError || (autoPlaying ? '正在依次播放 · 每项结束后间隔 1 秒 · 点击可中断' : '点击任意小喇叭，重听对应唱名') }}
          </p>
          <div class="grid grid-cols-4 gap-2.5 sm:gap-3 lg:grid-cols-7" aria-label="答案选项">
            <button v-for="answer in optionOrder" :key="`${currentQuestion.direction}-${answer}`" type="button" class="relative min-h-[68px] rounded-2xl border-2 text-2xl font-black transition sm:min-h-[76px] sm:text-3xl" :class="answerButtonClass(answer)" :disabled="answerState !== 'answering'" :aria-label="currentQuestion.direction === 'name-to-degree' ? `选择简谱数字 ${answer}` : `选择唱名 ${answer}`" @click="chooseAnswer(answer)">
              {{ answer }}
              <SpeakerIcon v-if="typeof answer === 'string'" class="absolute right-2 bottom-2 size-4" :playing="playingKey === `answer-${answer}`" />
              <svg v-if="answerState !== 'answering' && answer === expectedAnswer" viewBox="0 0 20 20" class="absolute top-2 right-2 size-4" aria-hidden="true"><path d="m5 10.5 3.1 3L15 6.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
              <svg v-if="answerState === 'incorrect' && selectedAnswer === answer" viewBox="0 0 20 20" class="absolute top-2 right-2 size-4" aria-hidden="true"><path d="m6.5 6.5 7 7m0-7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
            </button>
          </div>

          <div class="mt-5 min-h-[88px]" aria-live="polite">
            <div v-if="answerState === 'correct'" class="flex min-h-[72px] items-center justify-center gap-3 rounded-2xl bg-brand-soft px-4 text-left text-brand-dark">
              <span class="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-white"><svg viewBox="0 0 20 20" class="size-5" aria-hidden="true"><path d="m5 10.5 3.1 3L15 6.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
              <div>
                <p class="text-sm font-extrabold sm:text-base">
                  {{ isSingleQuestion ? `答对了！${promptSequenceText} = ${correctSequenceText}` : '序列全部正确！' }}
                </p>
                <p class="mt-0.5 text-xs font-bold text-brand/80">
                  {{ isSingleQuestion ? '即将进入下一题' : `${promptSequenceText} → ${correctSequenceText}` }}
                </p>
              </div>
            </div>
            <div v-else-if="answerState === 'incorrect'" class="flex flex-col items-center justify-between gap-3 rounded-2xl bg-[#fff5e9] px-4 py-3 text-left sm:min-h-[72px] sm:flex-row sm:px-5">
              <div class="flex items-center gap-3 text-[#805420]">
                <span class="grid size-9 shrink-0 place-items-center rounded-full bg-[#f2b55f] text-white"><svg viewBox="0 0 20 20" class="size-5" aria-hidden="true"><path d="M10 5.5v5m0 3.5h.01" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg></span>
                <div>
                  <p class="text-sm font-extrabold sm:text-base">
                    {{ isSingleQuestion ? `再记一下：${promptSequenceText} = ${correctSequenceText}` : `第 ${(failedAnswerIndex ?? 0) + 1} 项出错，正确答案是 ${expectedAnswer}` }}
                  </p>
                  <p class="mt-0.5 text-xs font-bold text-[#9b7242]">
                    {{ isSingleQuestion ? '绿色按钮是正确答案' : `完整答案：${correctSequenceText}` }}
                  </p>
                </div>
              </div>
              <button ref="nextButton" type="button" class="min-h-11 w-full rounded-xl bg-ink px-5 text-sm font-extrabold text-white transition hover:bg-brand-dark sm:w-auto" @click="advanceQuestion">
                下一题
              </button>
            </div>
          </div>
        </div>

        <div class="mt-5 flex flex-col items-center justify-center gap-2 text-xs font-bold text-muted sm:flex-row sm:gap-6">
          <p class="inline-flex items-center gap-2">
            <svg viewBox="0 0 20 20" class="size-4 text-brand" aria-hidden="true"><path d="M4 6.5h12M4 10h12M4 13.5h12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /><path d="m7 4-3 2.5L7 9m6 2 3 2.5-3 2.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>选项按音阶顺序排列，位置保持不变
          </p>
          <p v-if="currentQuestion.direction === 'name-to-degree'" class="inline-flex items-center gap-2">
            <span class="grid size-5 place-items-center rounded-md border border-line bg-white text-[10px] text-ink">1</span>也可以连续按键盘数字 1–7
          </p>
          <p v-else class="inline-flex items-center gap-2">
            <span class="font-black text-brand">do</span>从七个唱名中依次选择答案
          </p>
        </div>
      </section>

      <section v-else-if="phase === 'result'" class="my-auto rounded-[28px] border border-line bg-white px-5 py-10 text-center shadow-card sm:px-10 sm:py-14" aria-labelledby="result-title">
        <span class="mx-auto grid size-16 place-items-center rounded-[22px] bg-brand-soft text-brand"><svg viewBox="0 0 24 24" class="size-9" aria-hidden="true"><path d="M7 12.5 10.2 16 17.5 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8" /></svg></span>
        <p class="mt-5 text-sm font-extrabold text-brand">
          {{ activeSettings.mode === 'infinite' ? '本次无限练习已结束' : '本轮训练完成' }}
        </p>
        <h1 id="result-title" class="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">
          你答对了 {{ correctCount }} 题
        </h1>
        <p class="mt-3 text-sm font-bold text-muted">
          正确率 {{ accuracy }}% · 共 {{ answeredCount }} 题 · {{ activeSettings.sequenceLength }} 项序列
        </p>
        <div class="mx-auto mt-7 grid max-w-md grid-cols-2 gap-3 rounded-2xl bg-canvas p-4">
          <div><strong class="block text-2xl font-black text-brand">{{ correctCount }}</strong><span class="text-xs font-bold text-muted">正确</span></div>
          <div class="border-l border-line">
            <strong class="block text-2xl font-black text-[#b56052]">{{ incorrectCount }}</strong><span class="text-xs font-bold text-muted">需要复习</span>
          </div>
        </div>
        <div class="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
          <button type="button" class="min-h-12 rounded-2xl border border-line bg-white px-4 text-sm font-extrabold text-ink transition hover:bg-canvas" @click="emit('exit')">
            返回首页
          </button>
          <button type="button" class="min-h-12 rounded-2xl border border-brand/20 bg-brand-soft px-4 text-sm font-extrabold text-brand-dark transition hover:bg-[#d8ecdf]" @click="openSetup">
            调整设置
          </button>
          <button type="button" class="min-h-12 rounded-2xl bg-brand px-4 text-sm font-extrabold text-white shadow-[0_8px_20px_rgb(31_122_85/0.18)] transition hover:bg-brand-dark" @click="restartSession">
            再练一次
          </button>
        </div>
        <p class="mt-4 text-xs font-bold text-muted">
          按 Enter 也可以使用相同设置重新开始
        </p>
      </section>
    </main>

    <PracticeSetupDialog v-if="phase === 'setup'" title="开始唱名训练" description="选择适合这次练习的模式和序列长度" @start="startSession" @cancel="emit('exit')">
      <fieldset>
        <legend class="text-sm font-extrabold text-ink">
          唱名默写
        </legend>
        <button type="button" role="switch" :aria-checked="draftDictation" aria-label="唱名默写" class="mt-2 flex min-h-16 w-full items-center gap-3 rounded-[20px] border-2 p-3 text-left transition" :class="draftDictation ? 'border-brand bg-brand-soft' : 'border-line bg-white'" @click="draftDictation = !draftDictation">
          <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand-dark"><SpeakerIcon class="size-5" /></span>
          <span class="flex-1"><strong class="block text-sm font-black text-ink">听唱名，选数字</strong><span class="mt-1 block text-xs font-bold text-muted">{{ draftDictation ? '隐藏唱名，每题自动播放' : '已关闭，使用双向文字训练' }}</span></span>
          <span class="flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors" :class="draftDictation ? 'bg-brand' : 'bg-muted'" aria-hidden="true"><span class="size-4 rounded-full bg-white transition-transform" :class="draftDictation ? 'translate-x-5' : ''" /></span>
        </button>
      </fieldset>

      <fieldset>
        <legend class="text-sm font-extrabold text-ink">
          题目数量
        </legend>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <button type="button" role="radio" class="relative min-h-20 rounded-[20px] border-2 p-3 text-left transition" :class="draftMode === 'fixed' ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand/30'" :aria-checked="draftMode === 'fixed'" @click="draftMode = 'fixed'">
            <span class="flex items-center gap-2"><span class="hidden size-9 place-items-center rounded-xl bg-white text-sm font-black text-brand-dark sm:grid">10</span><strong class="text-sm font-black text-ink">10 题练习</strong></span>
            <span class="mt-2.5 block text-[11px] font-bold text-muted sm:text-xs">完成后查看正确率</span>
            <span v-if="draftMode === 'fixed'" class="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-brand text-xs font-black text-white">✓</span>
          </button>
          <button type="button" role="radio" class="relative min-h-20 rounded-[20px] border-2 p-3 text-left transition" :class="draftMode === 'infinite' ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand/30'" :aria-checked="draftMode === 'infinite'" @click="draftMode = 'infinite'">
            <span class="flex items-center gap-2"><span class="hidden size-9 place-items-center rounded-xl bg-white text-lg font-black text-brand-dark sm:grid">∞</span><strong class="text-sm font-black text-ink">无限练习</strong></span>
            <span class="mt-2.5 block text-[11px] font-bold text-muted sm:text-xs">随时结束查看报告</span>
            <span v-if="draftMode === 'infinite'" class="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-brand text-xs font-black text-white">✓</span>
          </button>
        </div>
      </fieldset>

      <fieldset>
        <div class="flex items-center justify-between gap-3">
          <legend class="text-sm font-extrabold text-ink">
            序列长度
          </legend>
          <span class="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-extrabold text-brand-dark">当前：{{ draftSequenceLength }} 项</span>
        </div>
        <div class="mt-2 rounded-[18px] border border-line bg-[#fbfcfa] p-4">
          <input v-model.number="draftSequenceLength" type="range" min="1" max="12" step="1" class="h-6 w-full cursor-pointer accent-brand" aria-label="序列长度" :aria-valuetext="`${draftSequenceLength} 项`">
          <div class="mt-1 flex justify-between text-[10px] font-extrabold text-muted">
            <span>1 · 单项</span><span>12 · 挑战</span>
          </div>
          <div class="mt-2 grid grid-cols-4 gap-2">
            <button v-for="(preset, index) in sequencePresets" :key="preset" type="button" class="min-h-9 rounded-xl border text-[11px] font-extrabold transition" :class="draftSequenceLength === preset ? 'border-brand-dark bg-brand-dark text-white' : 'border-line bg-white text-muted hover:border-brand/30 hover:text-ink'" @click="draftSequenceLength = preset">
              {{ preset }} · {{ ['入门', '进阶', '熟练', '挑战'][index] }}
            </button>
          </div>
        </div>
      </fieldset>

      <div class="mt-4 flex gap-3 rounded-2xl bg-brand-soft px-4 py-3 text-brand-dark">
        <span class="grid size-8 shrink-0 place-items-center rounded-xl bg-white text-sm">💡</span>
        <div class="flex items-center text-[11px]/5 font-bold sm:text-xs">
          <p><strong class="font-black">序列模式：</strong>按顺序依次点击；任意一步出错，本题立即结束。</p>
        </div>
      </div>
    </PracticeSetupDialog>
  </div>
</template>
