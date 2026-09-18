<script setup lang="ts">
import type { Accidental, MajorScaleExercise, MajorScaleQuestion, MajorScaleSettings } from '@/domain/majorScale'
import type { PianoKeyMark } from '@/domain/piano'
import type { MidiNote } from '@/domain/pitch'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import PianoKeyboard from '@/components/PianoKeyboard.vue'
import PracticeSetupDialog from '@/components/PracticeSetupDialog.vue'
import { useInstrumentPlayer } from '@/composables/useInstrumentPlayer'
import {
  accidentalOf,
  createMajorScaleGenerator,
  isAccidentalsAnswer,
  isMappingAnswer,
  isRepairAnswer,
  majorScaleExercises,
  majorScaleIds,
  naturalLetter,
  scaleMidiNotes,
} from '@/domain/majorScale'
import { midiNote } from '@/domain/pitch'

const emit = defineEmits<{ exit: [] }>()
const questionTypeOptions: readonly { value: MajorScaleExercise, label: string, description: string }[] = [
  { value: 'accidentals', label: '变化音', description: '给音阶添加升降号' },
  { value: 'repair', label: '修复音阶', description: '找出并改正错误音' },
  { value: 'mapping', label: '音级映射', description: '音级与音名双向转换' },
  { value: 'piano', label: '钢琴弹奏', description: '从低八度主音顺序弹奏' },
]
const exerciseLabels: Record<MajorScaleExercise, string> = {
  accidentals: '变化音',
  repair: '修复音阶',
  mapping: '音级映射',
  piano: '钢琴弹奏',
}

const phase = ref<'setup' | 'playing' | 'result'>('setup')
const settings = ref<MajorScaleSettings>({ exercises: [...majorScaleExercises], key: 'all', mode: 'fixed' })
const active = ref<MajorScaleSettings>({ ...settings.value, exercises: [...settings.value.exercises] })
const question = ref<MajorScaleQuestion>()
const questionNumber = ref(0)
const correctCount = ref(0)
const wrongCount = ref(0)
const answerState = ref<'answering' | 'correct' | 'wrong'>('answering')
const selectedIndices = ref<number[]>([])
const selectedRepairIndex = ref<number>()
const selectedAccidental = ref<Accidental>()
const selectedMapping = ref<string>()
const pianoIndex = ref(0)
const wrongMidi = ref<MidiNote>()
const keyboardFrom = midiNote(60)
const keyboardTo = midiNote(83)
const heading = ref<HTMLElement>()
const nextButton = ref<HTMLButtonElement>()
const { activeNotes, error: audioError, playNote, playSequence, prepare, status: audioStatus, stop } = useInstrumentPlayer('piano')
let generate = createMajorScaleGenerator(active.value)
let advanceTimer: number | undefined

const answered = computed(() => correctCount.value + wrongCount.value)
const accuracy = computed(() => answered.value ? `${Math.round(correctCount.value / answered.value * 100)}%` : '—')
const locked = computed(() => answerState.value !== 'answering')
const wasCorrect = computed(() => answerState.value === 'correct')
const lastQuestion = computed(() => active.value.mode === 'fixed' && questionNumber.value === 10)
const currentExercise = computed(() => question.value?.type ? exerciseLabels[question.value.type] : '')
const expectedMapping = computed(() => {
  const current = question.value
  if (current?.type !== 'mapping') {
    return ''
  }
  return current.direction === 'degree-to-note' ? current.scale.notes[current.degree - 1] : String(current.degree)
})
const scaleKeys = computed<PianoKeyMark[]>(() => {
  const current = question.value
  if (!current) {
    return []
  }
  return scaleMidiNotes(current.scale).map((midi, index) => ({
    midi,
    state: 'member',
    label: index === 7 ? current.scale.notes[0] : current.scale.notes[index]!,
    detail: String(index === 7 ? 1 : index + 1),
  }))
})
const keyboardMarks = computed<PianoKeyMark[]>(() => {
  const marks: PianoKeyMark[] = [
    ...(locked.value ? scaleKeys.value : []),
    ...activeNotes.value.map(midi => ({ midi, state: 'active' as const })),
  ]
  const current = question.value
  if (locked.value && !wasCorrect.value && current?.type === 'piano') {
    marks.push({
      midi: current.expectedMidi[pianoIndex.value]!,
      state: 'correct',
      label: current.scale.notes[pianoIndex.value] ?? current.scale.notes[0],
    })
  }
  if (wrongMidi.value !== undefined) {
    marks.push({ midi: wrongMidi.value, state: 'wrong' })
  }
  return marks
})
const feedback = computed(() => {
  const current = question.value
  if (!current || !locked.value) {
    return ''
  }
  if (current.type === 'accidentals') {
    const changes = current.expectedIndices.map(index => current.scale.notes[index]).join('、') || '无升降号'
    return `${current.scale.name}：${current.scale.notes.join(' ')}；变化音：${changes}`
  }
  if (current.type === 'repair') {
    return `正确音阶：${current.scale.notes.join(' ')}`
  }
  if (current.type === 'mapping') {
    return `${current.scale.name}：${current.degree} = ${current.scale.notes[current.degree - 1]}`
  }
  return `正确顺序：${[...current.scale.notes, current.scale.notes[0]].join(' ')}`
})
const setupAudioMessage = computed(() => {
  if (audioStatus.value === 'ready') {
    return '钢琴音色已就绪。'
  }
  if (audioStatus.value === 'fallback') {
    return '钢琴采样未加载成功，本次将使用基础音色。'
  }
  if (audioStatus.value === 'unavailable') {
    return '声音暂不可用，仍可完成练习。'
  }
  return '正在准备钢琴音色；未完成时会自动使用基础音色。'
})

function focusHeading() {
  void nextTick(() => heading.value?.focus())
}

function clearPlayback() {
  stop()
}

function clearTransition() {
  if (advanceTimer !== undefined) {
    window.clearTimeout(advanceTimer)
    advanceTimer = undefined
  }
  clearPlayback()
}

function isQuestionTypeSelected(exercise: MajorScaleExercise) {
  return settings.value.exercises.includes(exercise)
}

function toggleQuestionType(exercise: MajorScaleExercise) {
  if (isQuestionTypeSelected(exercise)) {
    if (settings.value.exercises.length === 1) {
      return
    }
    settings.value.exercises = settings.value.exercises.filter(item => item !== exercise)
    return
  }
  settings.value.exercises = majorScaleExercises.filter(item => (
    item === exercise || settings.value.exercises.includes(item)
  ))
}

function finish() {
  clearTransition()
  phase.value = 'result'
  focusHeading()
}

function resetAnswer() {
  selectedIndices.value = []
  selectedRepairIndex.value = undefined
  selectedAccidental.value = undefined
  selectedMapping.value = undefined
  pianoIndex.value = 0
  wrongMidi.value = undefined
  answerState.value = 'answering'
}

function advance() {
  clearTransition()
  if (lastQuestion.value) {
    finish()
    return
  }
  question.value = generate()
  questionNumber.value++
  resetAnswer()
  focusHeading()
}

function begin(usePrevious = false) {
  clearTransition()
  if (!usePrevious) {
    active.value = { ...settings.value, exercises: [...settings.value.exercises] }
  }
  generate = createMajorScaleGenerator(active.value)
  correctCount.value = 0
  wrongCount.value = 0
  questionNumber.value = 0
  phase.value = 'playing'
  advance()
}

function setup() {
  clearTransition()
  settings.value = { ...active.value, exercises: [...active.value.exercises] }
  phase.value = 'setup'
  question.value = undefined
  focusHeading()
}

function leave() {
  clearTransition()
  if (phase.value === 'playing' && active.value.mode === 'infinite') {
    finish()
  }
  else {
    emit('exit')
  }
}

function complete(correct: boolean) {
  answerState.value = correct ? 'correct' : 'wrong'
  if (correct) {
    correctCount.value++
    const delay = question.value?.type === 'accidentals' || question.value?.type === 'repair' ? 1500 : question.value?.type === 'piano' ? 1100 : 1000
    advanceTimer = window.setTimeout(advance, delay)
  }
  else {
    wrongCount.value++
    void nextTick(() => nextButton.value?.focus())
  }
}

function toggleAccidental(index: number) {
  if (locked.value) {
    return
  }
  selectedIndices.value = selectedIndices.value.includes(index)
    ? selectedIndices.value.filter(item => item !== index)
    : [...selectedIndices.value, index]
}

function submitAccidentals() {
  const current = question.value
  if (current?.type === 'accidentals' && !locked.value) {
    complete(isAccidentalsAnswer(current, selectedIndices.value))
  }
}

function submitRepair() {
  const current = question.value
  if (current?.type === 'repair' && !locked.value && selectedAccidental.value !== undefined) {
    complete(isRepairAnswer(current, selectedRepairIndex.value, selectedAccidental.value))
  }
}

function answerMapping(answer: string) {
  const current = question.value
  if (current?.type !== 'mapping' || locked.value) {
    return
  }
  selectedMapping.value = answer
  complete(isMappingAnswer(current, answer))
}

function choosePiano(midi: MidiNote) {
  const current = question.value
  if (current?.type !== 'piano' || locked.value) {
    return
  }
  void playNote(midi)
  if (midi !== current.expectedMidi[pianoIndex.value]) {
    wrongMidi.value = midi
    complete(false)
    return
  }
  pianoIndex.value++
  if (pianoIndex.value === current.expectedMidi.length) {
    complete(true)
  }
}

function playCorrectScale() {
  const current = question.value
  if (!current) {
    return
  }
  if (advanceTimer !== undefined) {
    window.clearTimeout(advanceTimer)
    advanceTimer = undefined
  }
  playSequence(scaleMidiNotes(current.scale), { intervalMilliseconds: 450 })
}

onMounted(() => void prepare())
onBeforeUnmount(clearTransition)
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header class="border-b border-line bg-white">
      <div class="mx-auto grid min-h-20 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-8">
        <button type="button" class="flex min-h-11 items-center gap-2 justify-self-start rounded-xl px-2 text-sm font-bold text-muted hover:bg-brand-soft" @click="leave">
          <span aria-hidden="true">‹</span><span class="hidden sm:inline">{{ phase === 'playing' && active.mode === 'infinite' ? '结束训练' : '返回首页' }}</span><span class="sm:hidden">返回</span>
        </button>
        <div class="text-center">
          <p class="text-sm font-extrabold sm:text-base">
            自然大调 · 练习
          </p><p class="mt-1 text-xs text-muted">
            {{ phase === 'playing' ? currentExercise : phase === 'setup' ? '十二个主音' : '本轮训练完成' }}
          </p>
        </div>
        <span v-if="phase === 'playing'" class="justify-self-end text-xs font-bold text-muted sm:text-sm">{{ active.mode === 'fixed' ? `${questionNumber} / 10` : `已答 ${answered} 题` }}</span>
        <RouterLink v-else :to="{ name: 'scale-learn' }" class="flex min-h-11 items-center justify-self-end rounded-xl px-3 text-xs font-extrabold text-brand hover:bg-brand-soft sm:text-sm">
          去学习
        </RouterLink>
      </div>
      <div v-if="phase === 'playing' && active.mode === 'fixed'" class="h-1 bg-line" role="progressbar" aria-label="已完成题数" :aria-valuenow="answered" aria-valuemin="0" aria-valuemax="10">
        <div class="h-full bg-brand transition-all motion-reduce:transition-none" :style="{ width: `${answered * 10}%` }" />
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-3 py-8 sm:px-8 sm:py-12">
      <section v-if="phase === 'setup'" class="rounded-3xl border border-line bg-white p-5 opacity-60 shadow-card sm:p-6">
        <div>
          <p class="text-xs font-extrabold tracking-widest text-brand">
            自然大调训练
          </p>
          <h1 class="mt-2 text-xl/tight font-black outline-none sm:text-2xl">
            把音阶从“知道”练成“直接想起”
          </h1>
          <p class="mt-3 text-sm/6 text-muted">
            练习从七个白键和五个黑键开始的十二个自然大调。每道题只考察变化音、音级映射或钢琴键位中的一个核心能力。
          </p>
          <div class="mt-4 hidden overflow-hidden rounded-2xl border border-line bg-canvas p-4 md:block">
            <div class="flex items-center justify-between text-xs font-extrabold text-muted">
              <span>白键主音 · 7</span><span>黑键主音 · 5</span>
            </div>
            <div class="mt-3 grid grid-cols-6 gap-1.5">
              <span v-for="id in majorScaleIds" :key="id" class="grid min-h-8 place-items-center rounded-lg bg-white text-[11px] font-extrabold text-brand-dark">{{ id }}</span>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="phase === 'playing' && question" class="rounded-3xl border border-line bg-white px-3 py-7 shadow-card sm:p-9">
        <div class="mb-7 flex flex-wrap justify-center gap-1.5" aria-label="本题训练类型">
          <span v-for="type in majorScaleExercises" :key="type" class="rounded-full px-3 py-1.5 text-[11px] font-extrabold" :class="question.type === type ? 'bg-brand-soft text-brand-dark' : 'bg-canvas text-muted'" :aria-current="question.type === type ? 'true' : undefined">{{ exerciseLabels[type] }}</span>
        </div>

        <div class="text-center">
          <p class="text-xs font-extrabold tracking-widest text-brand">
            {{ question.scale.id }} MAJOR · {{ currentExercise }}
          </p>
          <h1 ref="heading" tabindex="-1" class="mt-2 text-2xl font-black outline-none sm:text-3xl">
            <template v-if="question.type === 'accidentals'">
              给 {{ question.scale.name }}添加正确的升降号
            </template>
            <template v-else-if="question.type === 'repair'">
              这个 {{ question.scale.name }}音阶哪里错了？
            </template>
            <template v-else-if="question.type === 'mapping'">
              {{ question.direction === 'degree-to-note' ? `${question.scale.name}的第 ${question.degree} 级是什么音？` : `${question.scale.name}中的 ${question.scale.notes[question.degree - 1]} 是第几级？` }}
            </template>
            <template v-else>
              请按顺序弹出 {{ question.scale.name }}
            </template>
          </h1>
          <p class="mt-3 text-xs text-muted sm:text-sm">
            <template v-if="question.type === 'accidentals'">
              选中所有需要变化的音；如果没有，直接提交
            </template>
            <template v-else-if="question.type === 'repair'">
              先选择错误的音，再选择它正确的升降号
            </template>
            <template v-else-if="question.type === 'mapping'">
              不要重新计算完整音阶，尝试直接回忆
            </template>
            <template v-else>
              从低八度主音开始；答错后停留在当前位置
            </template>
          </p>
        </div>

        <div v-if="question.type === 'accidentals'" class="mx-auto mt-7 max-w-3xl">
          <div class="seven-option-grid">
            <button v-for="(note, index) in question.scale.notes" :key="index" type="button" class="min-h-12 rounded-lg border-2 text-base font-black sm:min-h-20 sm:rounded-xl sm:text-xl" :class="selectedIndices.includes(index) ? 'border-brand bg-brand-soft text-brand-dark' : locked && question.expectedIndices.includes(index) ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line'" :disabled="locked" :aria-pressed="selectedIndices.includes(index)" @click="toggleAccidental(index)">
              {{ naturalLetter(note) }}<span v-if="selectedIndices.includes(index) || locked && question.expectedIndices.includes(index)" class="text-brand">{{ accidentalOf(note) || '•' }}</span><span class="mt-1 block text-[10px] text-muted">{{ index + 1 }}</span>
            </button>
          </div>
          <button v-if="!locked" type="button" class="mx-auto mt-6 block min-h-12 rounded-xl bg-brand px-7 text-sm font-extrabold text-white hover:bg-brand-dark" @click="submitAccidentals">
            提交答案
          </button>
        </div>

        <div v-else-if="question.type === 'repair'" class="mx-auto mt-7 max-w-3xl">
          <div class="seven-option-grid">
            <button v-for="(note, index) in question.displayedNotes" :key="index" type="button" class="min-h-12 rounded-lg border-2 text-sm font-black sm:min-h-20 sm:rounded-xl sm:text-xl" :class="selectedRepairIndex === index ? 'border-brand bg-brand-soft text-brand-dark' : locked && index === question.wrongIndex ? 'border-error bg-error-soft text-error' : 'border-line'" :disabled="locked" :aria-pressed="selectedRepairIndex === index" @click="selectedRepairIndex = index; selectedAccidental = undefined">
              {{ note }}<span class="mt-1 block text-[10px] text-muted">{{ index + 1 }}</span>
            </button>
          </div>
          <div class="mt-5 flex flex-wrap justify-center gap-2" role="group" aria-label="选择正确升降号">
            <button v-for="symbol in ([{ value: '', label: '♮ 还原' }, { value: '♯', label: '♯ 升号' }, { value: '♭', label: '♭ 降号' }] as const)" :key="symbol.label" type="button" class="min-h-11 rounded-xl border px-5 text-sm font-extrabold" :class="selectedAccidental === symbol.value ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line'" :disabled="locked || selectedRepairIndex === undefined" :aria-pressed="selectedAccidental === symbol.value" @click="selectedAccidental = symbol.value">
              {{ symbol.label }}
            </button>
          </div>
          <button v-if="!locked" type="button" class="mx-auto mt-5 block min-h-12 rounded-xl bg-brand px-7 text-sm font-extrabold text-white hover:bg-brand-dark disabled:opacity-40" :disabled="selectedRepairIndex === undefined || selectedAccidental === undefined" @click="submitRepair">
            修复音阶
          </button>
        </div>

        <div v-else-if="question.type === 'mapping'" class="mx-auto mt-7 max-w-3xl">
          <div class="mx-auto grid size-24 place-items-center rounded-3xl bg-brand-soft text-4xl font-black text-brand-dark">
            {{ question.direction === 'degree-to-note' ? question.degree : question.scale.notes[question.degree - 1] }}
          </div>
          <div class="seven-option-grid mt-7">
            <button v-for="option in question.options" :key="option" type="button" class="min-h-12 rounded-lg border-2 text-sm font-black sm:min-h-14 sm:rounded-xl sm:text-lg" :class="locked && option === expectedMapping ? 'border-brand bg-brand-soft text-brand-dark' : locked && option === selectedMapping && !wasCorrect ? 'border-error bg-error-soft text-error' : 'border-line hover:border-brand hover:bg-brand-soft'" :disabled="locked" @click="answerMapping(option)">
              {{ option }}
            </button>
          </div>
        </div>

        <div v-else-if="question.type === 'piano'" class="mt-7">
          <ol class="mx-auto mb-5 grid max-w-3xl grid-cols-8 gap-1.5" aria-label="弹奏进度">
            <li v-for="(midi, index) in question.expectedMidi" :key="midi" class="grid min-h-14 place-items-center rounded-xl border-2 text-xs font-extrabold" :class="index < pianoIndex ? 'border-brand/30 bg-brand-soft text-brand-dark' : index === pianoIndex && !locked ? 'border-brand text-brand-dark' : locked && index === pianoIndex && !wasCorrect ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line text-muted'" :aria-current="index === pianoIndex && !locked ? 'step' : undefined">
              <span>{{ index + 1 === 8 ? 1 : index + 1 }}</span><span>{{ index < pianoIndex || locked ? (index === 7 ? question.scale.notes[0] : question.scale.notes[index]) : '?' }}</span>
            </li>
          </ol>
          <p class="mb-3 text-center text-xs font-bold text-muted">
            已完成 {{ pianoIndex }} / 8
          </p>
          <div class="overflow-x-auto rounded-2xl border border-line bg-canvas p-3" tabindex="0" aria-label="可横向滚动的两八度钢琴">
            <PianoKeyboard
              :from="keyboardFrom" :interactive="!locked" :marks="keyboardMarks"
              :minimum-white-key-width="44" :to="keyboardTo" @select="choosePiano"
            />
          </div>
        </div>

        <div class="mx-auto mt-7 min-h-28 max-w-4xl" aria-live="polite" aria-atomic="true">
          <div v-if="locked" class="rounded-2xl border p-4 sm:flex sm:items-center sm:justify-between sm:gap-4" :class="wasCorrect ? 'border-brand/20 bg-brand-soft' : 'border-error/20 bg-error-soft'">
            <div>
              <p class="text-sm font-extrabold" :class="wasCorrect ? 'text-brand-dark' : 'text-error'">
                {{ wasCorrect ? '✓ 回答正确' : '× 再看一次正确映射' }}
              </p><p class="mt-1 text-xs/5 text-muted">
                {{ feedback }}
              </p>
            </div>
            <div class="mt-3 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
              <button type="button" class="min-h-11 rounded-xl border border-line bg-white px-4 text-xs font-extrabold hover:bg-brand-soft" @click="playCorrectScale">
                ▶ 播放音阶
              </button>
              <button ref="nextButton" type="button" class="min-h-11 rounded-xl bg-brand px-5 text-xs font-extrabold text-white hover:bg-brand-dark" @click="advance">
                {{ lastQuestion ? '查看结果 →' : '下一题 →' }}
              </button>
            </div>
          </div>
        </div>
        <p v-if="audioError" class="mt-2 text-center text-xs text-muted" role="status">
          {{ audioError }}
        </p>
      </section>

      <section v-else class="mx-auto max-w-2xl rounded-3xl border border-line bg-white p-6 text-center shadow-card sm:p-10">
        <span class="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-soft text-3xl text-brand" aria-hidden="true">✓</span>
        <h1 ref="heading" tabindex="-1" class="mt-5 text-3xl font-black outline-none">
          {{ answered ? '训练完成' : '尚未作答' }}
        </h1>
        <p class="mt-3 text-sm/6 text-muted">
          本轮结果只用于即时反馈，不会生成掌握度或保存长期记录。
        </p>
        <p class="mt-2 text-xs text-muted">
          {{ active.key === 'all' ? '全部大调' : `${active.key} 大调` }} · {{ active.exercises.length }} 种题型 · 共 {{ answered }} 题
        </p>
        <dl class="mt-7 grid grid-cols-3 gap-2 sm:gap-4">
          <div v-for="stat in [{ label: '正确', value: correctCount }, { label: '错误', value: wrongCount }, { label: '正确率', value: accuracy }]" :key="stat.label" class="rounded-xl border border-line py-5">
            <dd class="text-2xl font-black">
              {{ stat.value }}
            </dd><dt class="mt-2 text-xs text-muted">
              {{ stat.label }}
            </dt>
          </div>
        </dl>
        <div class="mt-7 grid gap-3 sm:grid-cols-2">
          <button type="button" class="min-h-14 rounded-xl border border-line font-bold hover:bg-brand-soft" @click="setup">
            调整设置
          </button><button type="button" class="min-h-14 rounded-xl bg-brand font-bold text-white hover:bg-brand-dark" @click="begin(true)">
            再练一次 →
          </button>
        </div>
        <button type="button" class="mt-3 min-h-11 rounded-xl px-5 text-sm font-bold text-muted hover:bg-brand-soft" @click="leave">
          返回首页
        </button>
      </section>
    </main>

    <PracticeSetupDialog v-if="phase === 'setup'" title="开始自然大调训练" description="选择题型、调性和题目数量" cancel-label="返回首页" @start="begin()" @cancel="leave">
      <fieldset>
        <legend class="text-sm font-extrabold text-ink">
          题型（可多选）
        </legend>
        <div class="mt-2 grid grid-cols-4 gap-2">
          <button v-for="option in questionTypeOptions" :key="option.value" type="button" role="checkbox" :aria-checked="isQuestionTypeSelected(option.value)" class="relative min-h-16 rounded-[20px] border-2 p-1.5 text-center transition sm:min-h-24 sm:p-3 sm:text-left" :class="isQuestionTypeSelected(option.value) ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand/30'" @click="toggleQuestionType(option.value)">
            <strong class="block pt-5 text-[10px]/4 font-black whitespace-nowrap text-ink sm:pt-0 sm:pr-5 sm:text-sm sm:whitespace-normal">{{ option.label }}</strong>
            <span class="mt-2 hidden text-xs font-bold text-muted sm:block">{{ option.description }}</span>
            <span v-if="isQuestionTypeSelected(option.value)" class="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-brand text-xs font-black text-white" aria-hidden="true">✓</span>
          </button>
        </div>
        <p class="mt-2 text-[11px] font-bold text-muted">
          默认全选；训练时会在所选题型间均衡出题，至少保留一种。
        </p>
      </fieldset>
      <fieldset>
        <legend class="mb-2 text-sm font-bold text-muted">
          练习调性
        </legend>
        <div class="grid grid-cols-4 gap-2 sm:grid-cols-7">
          <label v-for="id in (['all', ...majorScaleIds] as const)" :key="id" class="grid min-h-12 cursor-pointer place-items-center rounded-xl border text-sm font-extrabold has-focus-visible:outline-2 has-focus-visible:outline-brand" :class="settings.key === id ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line'">
            <input v-model="settings.key" type="radio" name="key" :value="id" class="sr-only">{{ id === 'all' ? '全部' : id }}
          </label>
        </div>
      </fieldset>
      <fieldset>
        <legend class="text-sm font-extrabold text-ink">
          题目数量
        </legend>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <button type="button" role="radio" class="relative min-h-20 rounded-[20px] border-2 p-3 text-left transition" :class="settings.mode === 'fixed' ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand/30'" :aria-checked="settings.mode === 'fixed'" @click="settings.mode = 'fixed'">
            <strong class="text-sm font-black text-ink">10 题练习</strong>
            <span class="mt-2.5 block text-[11px] font-bold text-muted sm:text-xs">完成后查看正确率</span>
            <span v-if="settings.mode === 'fixed'" class="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-brand text-xs font-black text-white" aria-hidden="true">✓</span>
          </button>
          <button type="button" role="radio" class="relative min-h-20 rounded-[20px] border-2 p-3 text-left transition" :class="settings.mode === 'infinite' ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand/30'" :aria-checked="settings.mode === 'infinite'" @click="settings.mode = 'infinite'">
            <strong class="text-sm font-black text-ink">无限练习</strong>
            <span class="mt-2.5 block text-[11px] font-bold text-muted sm:text-xs">随时结束查看报告</span>
            <span v-if="settings.mode === 'infinite'" class="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-brand text-xs font-black text-white" aria-hidden="true">✓</span>
          </button>
        </div>
      </fieldset>
      <p class="text-center text-xs/5 text-muted" role="status">
        {{ setupAudioMessage }}
      </p>
    </PracticeSetupDialog>
  </div>
</template>
