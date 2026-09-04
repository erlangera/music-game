<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7
type SolfegeName = 'do' | 're' | 'mi' | 'fa' | 'sol' | 'la' | 'si'
type QuestionDirection = 'name-to-degree' | 'degree-to-name'
type AnswerValue = Degree | SolfegeName
type AnswerState = 'answering' | 'correct' | 'incorrect'

interface SolfegeQuestion {
  name: SolfegeName
  degree: Degree
}

type PracticeQuestion = SolfegeQuestion & {
  direction: QuestionDirection
}

const emit = defineEmits<{
  exit: []
}>()

const solfegeQuestions: readonly SolfegeQuestion[] = [
  { name: 'do', degree: 1 },
  { name: 're', degree: 2 },
  { name: 'mi', degree: 3 },
  { name: 'fa', degree: 4 },
  { name: 'sol', degree: 5 },
  { name: 'la', degree: 6 },
  { name: 'si', degree: 7 },
]

const allDegrees: readonly Degree[] = [1, 2, 3, 4, 5, 6, 7]
const allSolfegeNames: readonly SolfegeName[] = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si']
const totalQuestions = 10

const questionQueue = ref<PracticeQuestion[]>([])
const questionIndex = ref(0)
const optionOrder = ref<AnswerValue[]>([])
const previousOptionOrderKeys = ref<Partial<Record<QuestionDirection, string>>>({})
const selectedAnswer = ref<AnswerValue | null>(null)
const answerState = ref<AnswerState>('answering')
const correctCount = ref(0)
const nextButton = ref<HTMLButtonElement | null>(null)
let advanceTimer: number | undefined

const currentQuestion = computed(() => questionQueue.value[questionIndex.value])
const expectedAnswer = computed<AnswerValue | undefined>(() => {
  if (!currentQuestion.value) {
    return undefined
  }
  return currentQuestion.value.direction === 'name-to-degree'
    ? currentQuestion.value.degree
    : currentQuestion.value.name
})
const isComplete = computed(() => questionIndex.value >= totalQuestions)
const progress = computed(() => {
  if (isComplete.value) {
    return 100
  }
  return ((questionIndex.value + 1) / totalQuestions) * 100
})
const accuracy = computed(() => Math.round((correctCount.value / totalQuestions) * 100))

function shuffle<T>(values: readonly T[]): T[] {
  const result = [...values]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!]
  }

  return result
}

function hasThreeConsecutiveDirections(directions: readonly QuestionDirection[]) {
  return directions.some(
    (direction, index) =>
      index >= 2 && direction === directions[index - 1] && direction === directions[index - 2],
  )
}

function createDirectionOrder() {
  const directions: QuestionDirection[] = [
    'name-to-degree',
    'name-to-degree',
    'name-to-degree',
    'name-to-degree',
    'name-to-degree',
    'degree-to-name',
    'degree-to-name',
    'degree-to-name',
    'degree-to-name',
    'degree-to-name',
  ]
  let nextOrder = shuffle(directions)

  while (hasThreeConsecutiveDirections(nextOrder)) {
    nextOrder = shuffle(directions)
  }

  return nextOrder
}

function createOptionOrder(direction: QuestionDirection): AnswerValue[] {
  const canonicalOrder: readonly AnswerValue[]
    = direction === 'name-to-degree' ? allDegrees : allSolfegeNames
  const ascendingKey = canonicalOrder.join('|')
  const descendingKey = [...canonicalOrder].reverse().join('|')
  let nextOrder = shuffle(canonicalOrder)
  let nextKey = nextOrder.join('|')

  while (
    nextKey === ascendingKey
    || nextKey === descendingKey
    || nextKey === previousOptionOrderKeys.value[direction]
  ) {
    nextOrder = shuffle(canonicalOrder)
    nextKey = nextOrder.join('|')
  }

  previousOptionOrderKeys.value[direction] = nextKey
  return nextOrder
}

function createQuestionQueue() {
  const firstCycle = shuffle(solfegeQuestions)
  let secondCycle = shuffle(solfegeQuestions)
  const directions = createDirectionOrder()

  while (firstCycle.at(-1)?.name === secondCycle[0]?.name) {
    secondCycle = shuffle(solfegeQuestions)
  }

  return [...firstCycle, ...secondCycle]
    .slice(0, totalQuestions)
    .map((question, index) => ({ ...question, direction: directions[index]! }))
}

function prepareQuestion() {
  selectedAnswer.value = null
  answerState.value = 'answering'
  optionOrder.value = currentQuestion.value
    ? createOptionOrder(currentQuestion.value.direction)
    : []
}

function startSession() {
  if (advanceTimer !== undefined) {
    window.clearTimeout(advanceTimer)
  }
  questionQueue.value = createQuestionQueue()
  questionIndex.value = 0
  correctCount.value = 0
  previousOptionOrderKeys.value = {}
  prepareQuestion()
}

function advanceQuestion() {
  if (advanceTimer !== undefined) {
    window.clearTimeout(advanceTimer)
    advanceTimer = undefined
  }

  questionIndex.value += 1
  if (!isComplete.value) {
    prepareQuestion()
  }
}

function submitAnswer(answer: AnswerValue) {
  if (answerState.value !== 'answering' || !currentQuestion.value) {
    return
  }

  selectedAnswer.value = answer

  if (answer === expectedAnswer.value) {
    answerState.value = 'correct'
    correctCount.value += 1
    advanceTimer = window.setTimeout(advanceQuestion, 900)
    return
  }

  answerState.value = 'incorrect'
  void nextTick(() => nextButton.value?.focus())
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

function handleKeydown(event: KeyboardEvent) {
  if (isComplete.value) {
    if (event.key === 'Enter') {
      startSession()
    }
    return
  }

  if (answerState.value === 'incorrect' && event.key === 'Enter') {
    event.preventDefault()
    advanceQuestion()
    return
  }

  if (
    answerState.value !== 'answering'
    || currentQuestion.value?.direction !== 'name-to-degree'
    || !/^[1-7]$/.test(event.key)
  ) {
    return
  }

  event.preventDefault()
  submitAnswer(Number(event.key) as Degree)
}

onMounted(() => {
  startSession()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  if (advanceTimer !== undefined) {
    window.clearTimeout(advanceTimer)
  }
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header class="border-b border-line bg-white">
      <div class="mx-auto flex min-h-16 max-w-[1180px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:min-h-[76px] lg:px-8">
        <button
          type="button"
          class="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-extrabold text-muted transition-colors hover:bg-canvas hover:text-ink sm:px-3"
          @click="emit('exit')"
        >
          <svg viewBox="0 0 20 20" class="size-4" aria-hidden="true">
            <path d="m12.5 4.5-5.5 5.5 5.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="hidden sm:inline">退出训练</span>
          <span class="sm:hidden">退出</span>
        </button>

        <div class="min-w-0 text-center">
          <div class="flex items-center justify-center gap-2">
            <h1 class="truncate text-sm font-extrabold text-ink sm:text-base">
              唱名记忆训练
            </h1>
            <span class="hidden rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-extrabold text-brand-dark sm:inline">双向文字模式</span>
          </div>
          <p class="mt-0.5 text-[10px] font-bold text-muted sm:hidden">
            双向文字模式
          </p>
        </div>

        <div class="min-w-[58px] text-right text-sm font-extrabold text-ink tabular-nums">
          <template v-if="!isComplete">
            {{ questionIndex + 1 }} <span class="text-muted">/ {{ totalQuestions }}</span>
          </template>
          <template v-else>
            完成
          </template>
        </div>
      </div>
      <div class="h-1 bg-[#edf0ed]" aria-hidden="true">
        <div class="h-full bg-brand transition-[width] duration-300" :style="{ width: `${progress}%` }" />
      </div>
    </header>

    <main class="mx-auto flex min-h-[calc(100vh-80px)] max-w-[940px] flex-col px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <section v-if="!isComplete && currentQuestion" class="flex flex-1 flex-col" aria-labelledby="question-title">
        <div class="rounded-[26px] border border-line bg-white px-5 py-7 text-center shadow-card sm:rounded-[30px] sm:px-9 sm:py-10 lg:p-12">
          <div class="flex flex-wrap items-center justify-center gap-2">
            <p id="question-title" class="text-xs font-extrabold tracking-wide text-muted sm:text-sm">
              {{ currentQuestion.direction === 'name-to-degree' ? '看到唱名，选择对应的简谱数字' : '看到简谱数字，选择对应的唱名' }}
            </p>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-[10px] font-bold text-muted">
              <svg viewBox="0 0 20 20" class="size-3.5" aria-hidden="true">
                <path d="M4 8v4h3l4 3V5L7 8H4Zm10-.5a4 4 0 0 1 0 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              声音模式后续开放
            </span>
          </div>

          <div class="py-8 sm:py-10 lg:py-12">
            <p class="text-[72px] leading-none font-black tracking-[-0.06em] text-brand-dark sm:text-[96px] lg:text-[112px]">
              {{ currentQuestion.direction === 'name-to-degree' ? currentQuestion.name : currentQuestion.degree }}
            </p>
            <p class="mt-4 text-sm font-bold text-muted sm:text-base">
              {{ currentQuestion.direction === 'name-to-degree' ? '它对应哪个数字？' : '它对应哪个唱名？' }}
            </p>
          </div>

          <div class="grid grid-cols-4 gap-2.5 sm:gap-3 lg:grid-cols-7" aria-label="答案选项">
            <button
              v-for="answer in optionOrder"
              :key="`${currentQuestion.direction}-${answer}`"
              type="button"
              class="relative min-h-[68px] rounded-2xl border-2 text-2xl font-black transition sm:min-h-[76px] sm:text-3xl"
              :class="answerButtonClass(answer)"
              :disabled="answerState !== 'answering'"
              :aria-label="currentQuestion.direction === 'name-to-degree' ? `选择简谱数字 ${answer}` : `选择唱名 ${answer}`"
              @click="submitAnswer(answer)"
            >
              {{ answer }}
              <svg
                v-if="answerState !== 'answering' && answer === expectedAnswer"
                viewBox="0 0 20 20"
                class="absolute top-2 right-2 size-4"
                aria-hidden="true"
              >
                <path d="m5 10.5 3.1 3L15 6.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg
                v-if="answerState === 'incorrect' && selectedAnswer === answer"
                viewBox="0 0 20 20"
                class="absolute top-2 right-2 size-4"
                aria-hidden="true"
              >
                <path d="m6.5 6.5 7 7m0-7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <div class="mt-5 min-h-[88px]" aria-live="polite">
            <div v-if="answerState === 'correct'" class="flex min-h-[72px] items-center justify-center gap-3 rounded-2xl bg-brand-soft px-4 text-left text-brand-dark">
              <span class="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-white">
                <svg viewBox="0 0 20 20" class="size-5" aria-hidden="true"><path d="m5 10.5 3.1 3L15 6.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </span>
              <div>
                <p class="text-sm font-extrabold sm:text-base">
                  答对了！{{ currentQuestion.name }} = {{ currentQuestion.degree }}
                </p>
                <p class="mt-0.5 text-xs font-bold text-brand/80">
                  即将进入下一题
                </p>
              </div>
            </div>

            <div v-else-if="answerState === 'incorrect'" class="flex flex-col items-center justify-between gap-3 rounded-2xl bg-[#fff5e9] px-4 py-3 text-left sm:min-h-[72px] sm:flex-row sm:px-5">
              <div class="flex items-center gap-3 text-[#805420]">
                <span class="grid size-9 shrink-0 place-items-center rounded-full bg-[#f2b55f] text-white">
                  <svg viewBox="0 0 20 20" class="size-5" aria-hidden="true"><path d="M10 5.5v5m0 3.5h.01" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg>
                </span>
                <div>
                  <p class="text-sm font-extrabold sm:text-base">
                    再记一下：{{ currentQuestion.name }} = {{ currentQuestion.degree }}
                  </p>
                  <p class="mt-0.5 text-xs font-bold text-[#9b7242]">
                    绿色按钮是正确答案
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
            <svg viewBox="0 0 20 20" class="size-4 text-brand" aria-hidden="true"><path d="M4 6.5h12M4 10h12M4 13.5h12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /><path d="m7 4-3 2.5L7 9m6 2 3 2.5-3 2.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
            按钮顺序每题都会变化
          </p>
          <p v-if="currentQuestion.direction === 'name-to-degree'" class="inline-flex items-center gap-2">
            <span class="grid size-5 place-items-center rounded-md border border-line bg-white text-[10px] text-ink">1</span>
            也可以直接按键盘数字 1–7 作答
          </p>
          <p v-else class="inline-flex items-center gap-2">
            <span class="font-black text-brand">do</span>
            从七个唱名中选择答案
          </p>
        </div>
      </section>

      <section v-else class="my-auto rounded-[28px] border border-line bg-white px-5 py-10 text-center shadow-card sm:px-10 sm:py-14" aria-labelledby="result-title">
        <span class="mx-auto grid size-16 place-items-center rounded-[22px] bg-brand-soft text-brand">
          <svg viewBox="0 0 24 24" class="size-9" aria-hidden="true"><path d="M7 12.5 10.2 16 17.5 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8" /></svg>
        </span>
        <p class="mt-5 text-sm font-extrabold text-brand">
          本轮训练完成
        </p>
        <h1 id="result-title" class="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">
          你答对了 {{ correctCount }} 题
        </h1>
        <p class="mt-3 text-sm font-bold text-muted">
          正确率 {{ accuracy }}% · 共 {{ totalQuestions }} 题
        </p>

        <div class="mx-auto mt-7 grid max-w-md grid-cols-2 gap-3 rounded-2xl bg-canvas p-4">
          <div>
            <strong class="block text-2xl font-black text-brand">{{ correctCount }}</strong>
            <span class="text-xs font-bold text-muted">正确</span>
          </div>
          <div class="border-l border-line">
            <strong class="block text-2xl font-black text-[#b56052]">{{ totalQuestions - correctCount }}</strong>
            <span class="text-xs font-bold text-muted">需要复习</span>
          </div>
        </div>

        <div class="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
          <button type="button" class="min-h-12 flex-1 rounded-2xl border border-line bg-white px-5 text-sm font-extrabold text-ink transition hover:bg-canvas" @click="emit('exit')">
            返回首页
          </button>
          <button type="button" class="min-h-12 flex-1 rounded-2xl bg-brand px-5 text-sm font-extrabold text-white shadow-[0_8px_20px_rgb(31_122_85/0.18)] transition hover:bg-brand-dark" @click="startSession">
            再练一组
          </button>
        </div>
        <p class="mt-4 text-xs font-bold text-muted">
          按 Enter 也可以重新开始
        </p>
      </section>
    </main>
  </div>
</template>
