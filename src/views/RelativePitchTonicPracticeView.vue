<script setup lang="ts">
import type { PianoKeyMark } from '@/domain/piano'
import type { MidiNote } from '@/domain/pitch'
import type { RelativePitchAudioStep, RelativePitchMode, TonalHint, TonicQuestion } from '@/domain/relativePitch'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PianoKeyboard from '@/components/PianoKeyboard.vue'
import PracticeSetupDialog from '@/components/PracticeSetupDialog.vue'
import { useInstrumentPlayer } from '@/composables/useInstrumentPlayer'
import {
  createTonicQuestionGenerator,
  isTonicChoiceAnswer,
  isTonicPianoAnswer,
  tonalHintLabels,
  tonicKeyboardFrom,
  tonicKeyboardTo,
  tonicQuestionSteps,
  tonicResolutionSteps,
} from '@/domain/relativePitch'

type Phase = 'setup' | 'playing' | 'complete'
type AnswerState = 'listening' | 'answering' | 'correct' | 'wrong'

const route = useRoute()
const router = useRouter()
const phase = ref<Phase>('setup')
const draftMode = ref<RelativePitchMode>(route.query.mode === 'infinite' ? 'infinite' : 'fixed')
const activeMode = ref<RelativePitchMode>(draftMode.value)
const draftHint = ref<TonalHint>('scale')
const activeHint = ref<TonalHint>('scale')
const question = ref<TonicQuestion>()
const answerState = ref<AnswerState>('listening')
const answered = ref(0)
const selectedCandidate = ref<number>()
const selectedMidi = ref<MidiNote>()
const heading = ref<HTMLElement>()
const nextButton = ref<HTMLButtonElement>()
let nextQuestion = createTonicQuestionGenerator()

const {
  activeNotes,
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
const keyboardMarks = computed<PianoKeyMark[]>(() => {
  const current = question.value
  const marks: PianoKeyMark[] = activeNotes.value.map(midi => ({ midi, state: 'active' }))
  if (!current || !locked.value || current.type !== 'piano') {
    return marks
  }
  marks.push({ midi: current.tonicMidi, state: 'correct', label: '1', detail: current.scale.id })
  if (!wasCorrect.value && selectedMidi.value !== undefined) {
    marks.push({ midi: selectedMidi.value, state: 'wrong', label: '×' })
  }
  return marks
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
const feedback = computed(() => {
  const current = question.value
  if (!current || !locked.value) {
    return ''
  }
  if (current.type === 'choice') {
    const answer = current.correctCandidateIndex === 0 ? '第一个音 A' : '第二个音 B'
    return `${answer} 是 ${current.scale.name}的主音 ${current.scale.id}，也就是音级 1。`
  }
  return `${current.scale.name}的主音是 ${current.scale.id}，琴键位置已标为 1。`
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
  void playTimeline(tonicQuestionSteps(current, activeHint.value), {
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
  selectedCandidate.value = undefined
  selectedMidi.value = undefined
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
  nextQuestion = createTonicQuestionGenerator()
  phase.value = 'playing'
  await nextTick()
  prepareQuestion()
}

function complete(correct: boolean, audioSteps?: readonly RelativePitchAudioStep[]) {
  answered.value++
  answerState.value = correct ? 'correct' : 'wrong'
  const current = question.value
  if (current) {
    void playTimeline(audioSteps ?? tonicResolutionSteps(current), {
      onComplete: () => void nextTick(() => nextButton.value?.focus()),
    })
  }
}

function chooseCandidate(index: number) {
  const current = question.value
  if (!current || current.type !== 'choice' || answerState.value !== 'answering') {
    return
  }
  selectedCandidate.value = index
  complete(isTonicChoiceAnswer(current, index))
}

function choosePiano(midi: MidiNote) {
  const current = question.value
  if (!current || current.type !== 'piano' || answerState.value !== 'answering') {
    return
  }
  selectedMidi.value = midi
  complete(isTonicPianoAnswer(current, midi), [
    { notes: [midi], durationMilliseconds: 500, gapMilliseconds: 200 },
    ...tonicResolutionSteps(current),
  ])
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
            相对音高 · 主音感
          </p>
          <p class="mt-1 text-xs text-muted">
            {{ phase === 'setup' ? '练习设置' : phase === 'complete' ? '训练完成' : question?.type === 'choice' ? '判断主音' : '钢琴找主音' }}
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
            主音感训练
          </p>
          <h1 class="mt-2 text-xl/tight font-black outline-none sm:text-2xl">
            在十二个调里找到稳定的“1”
          </h1>
          <p class="mt-3 text-sm/6 text-muted">
            题目交替使用“两个音中找主音”和“在钢琴上找主音”。十二调通过洗牌循环出现，不以分数或正确率评价结果。
          </p>
          <div class="mt-4 hidden grid-cols-6 gap-1.5 rounded-2xl border border-line bg-canvas p-4 md:grid" aria-label="练习包含的十二个大调">
            <span v-for="key in ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']" :key="key" class="grid min-h-9 place-items-center rounded-lg bg-white text-[11px] font-extrabold text-brand-dark">{{ key }}</span>
          </div>
        </div>
      </section>

      <section v-else-if="phase === 'playing' && question" class="rounded-3xl border border-line bg-white px-3 py-7 shadow-card sm:p-9">
        <div class="text-center">
          <p class="text-xs font-extrabold tracking-widest text-brand">
            {{ question.scale.id }} MAJOR · {{ tonalHintLabels[activeHint] }}
          </p>
          <h1 ref="heading" tabindex="-1" class="mt-3 text-2xl font-black outline-none sm:text-3xl">
            {{ question.type === 'choice' ? '哪一个音听起来像“回家”？' : '请在钢琴上找到主音 1' }}
          </h1>
          <p class="mt-3 text-xs/5 text-muted sm:text-sm">
            {{ answerState === 'listening' ? '先听完调性提示和题目' : question.type === 'choice' ? '按播放顺序选择第一个音 A 或第二个音 B' : '保持脑中的主音感觉，再点击对应琴键' }}
          </p>
          <button type="button" class="mt-5 min-h-11 rounded-xl border border-line px-5 text-sm font-extrabold hover:bg-brand-soft disabled:opacity-45" :disabled="locked" @click="playCurrentQuestion">
            {{ isPlaying ? '↻ 从头重播' : '▶ 重播题目' }}
          </button>
        </div>

        <div v-if="question.type === 'choice'" class="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:gap-5">
          <button v-for="index in [0, 1]" :key="index" type="button" class="min-h-28 rounded-2xl border-2 p-4 text-center transition" :class="locked && index === question.correctCandidateIndex ? 'border-brand bg-brand-soft text-brand-dark' : locked && index === selectedCandidate && !wasCorrect ? 'border-error bg-error-soft text-error' : 'border-line hover:border-brand hover:bg-brand-soft disabled:hover:border-line disabled:hover:bg-white'" :disabled="answerState !== 'answering'" @click="chooseCandidate(index)">
            <span class="block text-2xl font-black">{{ index === 0 ? 'A' : 'B' }}</span>
            <span class="mt-2 block text-xs font-bold text-muted">第{{ index === 0 ? '一' : '二' }}个音</span>
          </button>
        </div>

        <div v-else class="mx-auto mt-8 max-w-4xl">
          <div class="overflow-x-auto rounded-2xl border border-line bg-canvas p-3" tabindex="0" aria-label="从 C4 到 B4 的主音钢琴">
            <PianoKeyboard compact :depressed-notes="activeNotes" :from="tonicKeyboardFrom" :interactive="answerState === 'answering'" :marks="keyboardMarks" :to="tonicKeyboardTo" @select="choosePiano" />
          </div>
          <p class="mt-3 text-center text-xs text-muted">
            琴键标签在作答前隐藏；答题后只标出主音 1。
          </p>
        </div>

        <div class="mx-auto mt-7 min-h-28 max-w-4xl" aria-live="polite" aria-atomic="true">
          <div v-if="locked" class="rounded-2xl border p-4 sm:flex sm:items-center sm:justify-between sm:gap-4" :class="wasCorrect ? 'border-brand/20 bg-brand-soft' : 'border-error/20 bg-error-soft'">
            <div>
              <p class="text-sm font-extrabold" :class="wasCorrect ? 'text-brand-dark' : 'text-error'">
                {{ wasCorrect ? '✓ 找到了主音' : '× 再听一次回到主音' }}
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
          你已经完成 {{ answered }} 道主音感练习。本轮不计算分数、正确率或掌握度。
        </p>
        <p class="mt-2 text-xs text-muted">
          十二调 · {{ tonalHintLabels[activeHint] }} · {{ activeMode === 'fixed' ? '固定练习' : '自由练习' }}
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

    <PracticeSetupDialog v-if="phase === 'setup'" title="开始主音感训练" description="选择调性提示和题目数量，练习找到主音 1" cancel-label="返回练习" @start="begin()" @cancel="leave">
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
