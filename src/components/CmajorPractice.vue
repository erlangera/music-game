<script setup lang="ts">
import type { MappingAnswer, MappingDirection, MappingQuestion, MappingSettings } from '@/domain/cMajorPractice'
import type { PianoKeyMark } from '@/domain/piano'
import type { MidiNote } from '@/domain/pitch'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import PianoKeyboard from '@/components/PianoKeyboard.vue'
import PracticePageHeader from '@/components/PracticePageHeader.vue'
import PracticeSetupDialog from '@/components/PracticeSetupDialog.vue'
import { useInstrumentPlayer } from '@/composables/useInstrumentPlayer'
import { answerMapping, cMajorNotes, createMappingGenerator, mappingDirections } from '@/domain/cMajorPractice'
import { createHighlightPlayer } from '@/domain/keyboardPractice'
import { pianoKeys, pianoKeyShortcuts, pitchNames } from '@/domain/piano'
import { pitchClassOf } from '@/domain/pitch'

const emit = defineEmits<{ exit: [] }>()
const sequencePresets = [1, 4, 8, 12] as const
const questionTypeOptions: readonly { value: MappingDirection, label: string, description: string }[] = [
  { value: 'degree-to-key', label: '简谱找琴键', description: '看数字，点击对应琴键' },
  { value: 'key-to-degree', label: '琴键选简谱', description: '看亮键，选择对应数字' },
]
const phase = ref<'setup' | 'playing' | 'result'>('setup')
const settings = ref<MappingSettings>({ directions: [...mappingDirections], sequenceLength: 1, mode: 'fixed' })
const active = ref<MappingSettings>({ ...settings.value, directions: [...settings.value.directions] })
const setupReturn = ref<'playing' | 'result'>()
const question = ref<MappingQuestion>()
const answer = ref<MappingAnswer>({ index: 0, status: 'answering' })
const questionNumber = ref(0)
const correctCount = ref(0)
const wrongCount = ref(0)
const displayIndex = ref<number | null>(null)
const heading = ref<HTMLElement>()
const content = ref<HTMLElement>()
const nextButton = ref<HTMLButtonElement>()
const { activeNotes, playNote, playSequence, prepare, unlock, stop, status: audioStatus, error: audioError } = useInstrumentPlayer('piano')
let generate = createMappingGenerator(active.value)
const heldKeys = new Set<string>()
const player = createHighlightPlayer((index) => {
  displayIndex.value = index
  const note = index === null ? undefined : question.value?.sequence[index]
  if (note && phase.value === 'playing' && answer.value.status === 'answering') {
    void playNote(note.midi)
  }
  else {
    stop()
  }
})
const total = computed(() => correctCount.value + wrongCount.value)
const accuracy = computed(() => total.value ? `${Math.round(correctCount.value / total.value * 100)}%` : '—')
const forward = computed(() => question.value?.direction !== 'key-to-degree')
const directionLabel = computed(() => questionTypeOptions.find(item => item.value === question.value?.direction)?.label ?? '')
const locked = computed(() => answer.value.status !== 'answering')
const correct = computed(() => answer.value.status === 'correct')
const isSequence = computed(() => active.value.sequenceLength > 1)
const currentNote = computed(() => question.value?.sequence[Math.min(answer.value.index, active.value.sequenceLength - 1)])
const lastQuestion = computed(() => active.value.mode === 'fixed' && questionNumber.value === 10)
const fullAnswer = computed(() => question.value?.sequence.map(note => note.degree).join(' · '))
const selectedName = computed(() => answer.value.selected === undefined ? '' : pitchNames[pitchClassOf(answer.value.selected)]![0])
const selectedDegree = computed(() => cMajorNotes.find(note => note.midi === answer.value.selected)?.degree)
const audioMessage = computed(() => audioError.value || (audioStatus.value === 'fallback'
  ? '钢琴采样暂不可用，已使用基础音色。'
  : audioStatus.value === 'unavailable' ? '声音暂不可用，仍可看琴键继续练习。' : ''))
const marks = computed<PianoKeyMark[]>(() => {
  const result: PianoKeyMark[] = activeNotes.value.map(midi => ({ midi, state: 'active' }))
  if (!forward.value && !locked.value && displayIndex.value !== null) {
    const note = question.value?.sequence[displayIndex.value]
    if (note) {
      result.push({ midi: note.midi, state: 'active' })
    }
  }
  if (locked.value && currentNote.value) {
    const note = currentNote.value
    result.push({ midi: note.midi, state: 'correct', label: `${note.degree} = ${note.name}` })
    if (!correct.value && forward.value && answer.value.selected !== undefined) {
      result.push({ midi: answer.value.selected, state: 'wrong', label: selectedName.value })
    }
  }
  return result
})

function stopPlayback() {
  player.stop()
  stop()
  heldKeys.clear()
}
function focusHeading() {
  void nextTick(() => {
    content.value?.scrollTo({ top: 0, behavior: 'instant' })
    heading.value?.focus({ preventScroll: true })
  })
}
function isQuestionTypeSelected(direction: MappingDirection) {
  return settings.value.directions.includes(direction)
}
function toggleQuestionType(direction: MappingDirection) {
  if (isQuestionTypeSelected(direction)) {
    if (settings.value.directions.length === 1) {
      return
    }
    settings.value.directions = settings.value.directions.filter(item => item !== direction)
    return
  }
  settings.value.directions = mappingDirections.filter(item => (
    item === direction || settings.value.directions.includes(item)
  ))
}
function finish() {
  stopPlayback()
  phase.value = 'result'
  focusHeading()
}
function advance() {
  stopPlayback()
  if (lastQuestion.value) {
    finish()
    return
  }
  question.value = generate()
  questionNumber.value++
  answer.value = { index: 0, status: 'answering' }
  if (!forward.value) {
    player.start(active.value.sequenceLength)
  }
  focusHeading()
}
function begin(previous = false) {
  stopPlayback()
  if (!previous) {
    active.value = { ...settings.value, directions: [...settings.value.directions] }
  }
  generate = createMappingGenerator(active.value)
  correctCount.value = 0
  wrongCount.value = 0
  questionNumber.value = 0
  setupReturn.value = undefined
  phase.value = 'playing'
  void unlock()
  advance()
}
function openSetup() {
  stopPlayback()
  setupReturn.value = phase.value === 'result' ? 'result' : 'playing'
  settings.value = { ...active.value, directions: [...active.value.directions] }
  phase.value = 'setup'
}
function cancelSetup() {
  if (setupReturn.value) {
    phase.value = setupReturn.value
    setupReturn.value = undefined
    if (phase.value === 'playing' && !forward.value && !locked.value) {
      replay()
    }
    focusHeading()
  }
  else {
    emit('exit')
  }
}
function leave() {
  stopPlayback()
  if (phase.value === 'playing' && active.value.mode === 'infinite') {
    finish()
  }
  else {
    emit('exit')
  }
}
function replay() {
  if (phase.value !== 'playing' || !question.value) {
    return
  }
  stopPlayback()
  if (locked.value) {
    playSequence(question.value.sequence.map(note => note.midi), { intervalMilliseconds: 1000 })
  }
  else if (!forward.value) {
    player.start(active.value.sequenceLength, answer.value.index)
  }
}
function choose(midi: MidiNote) {
  if (phase.value !== 'playing' || locked.value || !question.value) {
    return
  }
  answer.value = answerMapping(question.value, answer.value, midi)
  if (locked.value) {
    stopPlayback()
    if (correct.value) {
      correctCount.value++
    }
    else {
      wrongCount.value++
    }
    void playNote(forward.value ? midi : currentNote.value!.midi)
    void nextTick(() => nextButton.value?.focus({ preventScroll: true }))
  }
  else if (forward.value) {
    void playNote(midi)
  }
  else {
    player.answered(answer.value.index)
  }
}
function onKeyDown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing || event.repeat) {
    return
  }
  if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) {
    return
  }
  const key = event.key.toLowerCase()
  if (phase.value !== 'playing' || locked.value || heldKeys.has(key)) {
    return
  }
  heldKeys.add(key)
  const midi = forward.value
    ? pianoKeys.find(note => note.shortcut === key)?.midi
    : cMajorNotes.find(note => String(note.degree) === key)?.midi
  if (midi !== undefined) {
    event.preventDefault()
    choose(midi)
  }
}
function onKeyUp(event: KeyboardEvent) {
  heldKeys.delete(event.key.toLowerCase())
}
function onBlur() {
  stopPlayback()
}
onMounted(() => {
  void prepare()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)
})
onBeforeUnmount(() => {
  stopPlayback()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('blur', onBlur)
})
</script>

<template>
  <div :data-sequence="isSequence" data-mapping-practice class="flex h-dvh flex-col overflow-hidden bg-canvas">
    <PracticePageHeader>
      <div class="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-8">
        <button type="button" class="min-h-11 justify-self-start rounded-xl px-2 text-xs font-bold text-muted hover:bg-brand-soft sm:text-sm" @click="leave">
          <span aria-hidden="true">‹</span>
          {{ phase === 'playing' ? active.mode === 'infinite' ? '结束练习' : '退出练习' : '返回首页' }}
        </button>
        <div class="py-3 text-center">
          <p class="text-sm font-extrabold sm:text-lg">
            简谱与琴键
          </p>
          <p class="mt-1 text-[10px] text-muted sm:text-xs">
            {{ phase === 'playing' ? directionLabel : 'C 大调综合映射' }}
          </p>
        </div>
        <span v-if="phase === 'playing'" class="justify-self-end text-xs text-muted sm:text-sm">{{ active.mode === 'fixed' ? `${questionNumber} / 10` : `已答 ${total} 题` }}</span>
      </div>
      <div v-if="phase === 'playing' && active.mode === 'fixed'" class="h-0.5 bg-line" role="progressbar" aria-label="已完成题数" :aria-valuenow="total" :aria-valuemin="0" :aria-valuemax="10">
        <div class="h-full bg-brand transition-all motion-reduce:transition-none" :style="{ width: `${total * 10}%` }" />
      </div>
    </PracticePageHeader>

    <main ref="content" data-practice-content class="mx-auto min-h-0 w-full max-w-[1072px] flex-1 overflow-y-auto px-3 py-5 sm:px-6 sm:py-10">
      <section v-if="phase === 'setup'" class="rounded-[28px] border border-line bg-white p-6 text-center opacity-60 sm:p-12">
        <h1 class="text-2xl font-extrabold">
          连接简谱与琴键
        </h1>
        <p class="mt-3 text-sm text-muted">
          固定 C 大调，建立 1–7 与七个白键的双向联系。
        </p>
        <div class="mx-auto mt-10 max-w-[700px]" aria-hidden="true">
          <PianoKeyboard compact />
        </div>
      </section>

      <section v-else-if="phase === 'playing' && question" data-question-card class="rounded-[28px] border border-line bg-white px-3 py-6 sm:px-10 sm:py-8">
        <div class="text-center">
          <p class="inline-block rounded-full bg-brand-soft px-4 py-2 text-xs font-bold text-brand-dark">
            C 大调 · 1=C
          </p>
          <h1 ref="heading" data-question-title tabindex="-1" class="mt-6 text-xl font-extrabold outline-none sm:text-[32px]">
            {{ forward ? isSequence ? '按顺序弹出对应琴键' : '请弹出对应的琴键' : isSequence ? '按顺序识别亮起的琴键' : '亮起的琴键是几级？' }}
          </h1>
          <p data-question-description class="mt-3 text-xs/6 text-muted sm:text-sm">
            {{ forward ? '看简谱数字，点击下方的琴键' : isSequence ? '琴键每秒依次亮起，按顺序选择简谱数字' : '观察高亮位置，选择对应的简谱数字' }}
          </p>
        </div>

        <ol v-if="forward || isSequence" data-question-sequence class="mx-auto my-6 grid max-w-[700px] gap-2 sm:my-8" :class="isSequence ? 'grid-cols-4 sm:grid-cols-6' : 'w-28 grid-cols-1 sm:w-32'" aria-label="题目序列">
          <li v-for="(note, index) in question.sequence" :key="index" class="flex flex-col items-center justify-center rounded-2xl border-2 p-2 font-extrabold" :class="[isSequence ? 'min-h-18 text-2xl' : 'h-28 text-6xl sm:h-32 sm:text-7xl', index < answer.index ? 'border-brand/30 bg-brand-soft text-brand-dark' : locked && index === answer.index ? 'border-error bg-error-soft text-error' : index === answer.index ? 'border-brand/30 bg-brand-soft text-brand-dark' : 'border-line text-muted']" :aria-current="index === answer.index && !locked ? 'step' : undefined">
            <span v-if="isSequence" class="text-[10px] font-medium">{{ index + 1 }}{{ displayIndex === index ? ' · 展示中' : index === answer.index && !locked ? ' · 待答' : '' }}</span>
            <span>{{ forward || locked || index < answer.index ? note.degree : '?' }}<span v-if="isSequence && index < answer.index" class="text-sm" aria-hidden="true"> ✓</span></span>
          </li>
        </ol>
        <div v-if="isSequence" class="mx-auto mt-4 mb-3 flex max-w-[700px] flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span v-if="isSequence">{{ locked ? correct ? '全部完成' : `第 ${answer.index + 1} 项出错` : `正在回答 ${answer.index + 1} / ${active.sequenceLength}` }}</span>
          <span v-if="!forward && isSequence && !locked">{{ displayIndex === null ? '演示已结束' : `正在展示 ${displayIndex + 1} / ${active.sequenceLength}` }}</span>
          <button v-if="!forward && !locked" type="button" class="ml-auto min-h-11 rounded-xl px-3 font-bold text-brand hover:bg-brand-soft" @click="replay">
            {{ isSequence ? '重新演示未答部分' : '重新演示' }}
          </button>
        </div>
        <div data-question-keyboard class="mx-auto max-w-[700px]" :class="{ 'mt-6': !isSequence }">
          <PianoKeyboard compact :interactive="forward && !locked" :marks="marks" :shortcuts="forward ? pianoKeyShortcuts : undefined" @select="choose" />
        </div>

        <div v-if="!forward" data-number-answers class="mx-auto mt-6 max-w-[700px] sm:mt-8">
          <p class="mb-3 hidden text-xs text-muted sm:block">
            选择简谱数字
          </p>
          <div class="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-3" role="group" aria-label="选择简谱数字">
            <button v-for="note in cMajorNotes" :key="note.degree" type="button" class="min-h-14 rounded-2xl border-2 text-2xl font-extrabold transition-colors sm:min-h-18 sm:text-3xl" :class="locked && note.degree === currentNote?.degree ? 'border-brand bg-brand-soft text-brand-dark' : locked && !correct && note.degree === selectedDegree ? 'border-error bg-error-soft text-error' : 'border-line hover:border-brand hover:bg-brand-soft'" :disabled="locked" :aria-label="`选择简谱 ${note.degree}`" @click="choose(note.midi)">
              <span v-if="locked && (note.degree === currentNote?.degree || (!correct && note.degree === selectedDegree))" class="text-sm" aria-hidden="true">{{ note.degree === currentNote?.degree ? '✓' : '×' }}</span> {{ note.degree }}
            </button>
          </div>
        </div>
        <p class="mt-6 hidden text-center text-xs/6 text-muted sm:mt-8 sm:block">
          {{ forward ? '点击琴键即可作答' : '点击数字即可作答，也可按键盘 1–7' }}
        </p>
        <p v-if="forward" class="mt-1 hidden text-center text-xs text-muted sm:block">
          白键快捷键 A S D F G H J（从左到右）
        </p>
        <p v-if="audioMessage" class="mt-3 text-center text-xs/5 text-muted" role="status">
          {{ audioMessage }}
        </p>
      </section>

      <section v-else class="mx-auto max-w-2xl rounded-[28px] border border-line bg-white p-6 text-center sm:p-10">
        <span class="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-soft text-3xl text-brand" aria-hidden="true">✓</span>
        <h1 ref="heading" tabindex="-1" class="mt-5 text-2xl font-extrabold outline-none sm:text-3xl">
          {{ total ? '训练完成' : '尚未作答' }}
        </h1>
        <p class="mt-3 text-sm/6 text-muted">
          {{ total ? '让简谱数字和琴键位置逐渐形成稳定的联系。' : '准备好后，再开始一轮练习。' }}
        </p>
        <p class="mt-2 text-xs/6 text-muted">
          {{ active.directions.length }} 种题型 · C 大调 · 每题 {{ active.sequenceLength }} 项 · 已答 {{ total }} 题
        </p>
        <dl class="mt-7 grid grid-cols-3 gap-2 sm:gap-4">
          <div v-for="stat in [{ label: '正确', value: correctCount }, { label: '错误', value: wrongCount }, { label: '正确率', value: accuracy }]" :key="stat.label" class="rounded-2xl bg-canvas py-5">
            <dt class="text-xs text-muted">
              {{ stat.label }}
            </dt><dd class="mt-2 text-2xl font-extrabold sm:text-3xl">
              {{ stat.value }}
            </dd>
          </div>
        </dl>
        <div class="mt-7 grid grid-cols-2 gap-3">
          <button type="button" class="min-h-12 rounded-2xl border border-line text-sm font-bold hover:bg-canvas" @click="openSetup">
            调整设置
          </button>
          <button type="button" class="min-h-12 rounded-2xl bg-brand text-sm font-bold text-white hover:bg-brand-dark" @click="begin(true)">
            再练一次 →
          </button>
        </div>
        <button type="button" class="mt-4 min-h-11 rounded-xl px-4 text-sm font-bold text-muted hover:bg-canvas" @click="leave">
          返回首页
        </button>
      </section>
    </main>

    <footer v-if="phase === 'playing'" class="safe-bottom shrink-0 border-t border-line bg-white">
      <div v-if="locked && currentNote" class="mx-auto max-w-[1072px] px-3 pt-3 sm:px-6">
        <div class="flex flex-wrap items-center gap-3 rounded-2xl border p-3 sm:p-4" :class="correct ? 'border-brand/20 bg-brand-soft' : 'border-error/20 bg-error-soft'">
          <div class="min-w-0 flex-1" role="status">
            <p class="text-sm font-extrabold" :class="correct ? 'text-brand-dark' : 'text-error'">
              {{ correct ? '✓ 回答正确' : `× 第 ${answer.index + 1} 项出错` }}
            </p>
            <p class="mt-1 text-xs/6 text-ink">
              {{ correct ? `C 大调：${currentNote.degree} = ${currentNote.name}` : `你选择了 ${forward ? selectedName : selectedDegree}，正确映射：${currentNote.degree} = ${currentNote.name}` }}
            </p>
            <p v-if="isSequence" class="mt-1 text-xs/6 wrap-break-word text-muted">
              完整简谱：{{ fullAnswer }}
            </p>
          </div>
          <button type="button" class="min-h-11 rounded-xl px-3 text-xs font-bold text-brand hover:bg-white" @click="replay">
            播放正确答案
          </button>
          <button ref="nextButton" type="button" class="min-h-11 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark" @click="advance">
            {{ lastQuestion ? '查看结果' : '下一题 →' }}
          </button>
        </div>
      </div>
      <div class="mx-auto flex max-w-[1072px] items-center justify-between gap-3 px-3 pt-2 text-xs text-muted sm:px-6">
        <span>{{ isSequence ? `每题 ${active.sequenceLength} 项` : '单音练习' }}</span>
        <button v-if="!forward && !isSequence && !locked" type="button" class="min-h-11 rounded-xl px-3 font-bold text-brand hover:bg-brand-soft" @click="replay">
          重新演示
        </button>
        <span class="hidden sm:block">{{ forward ? '琴键音名已隐藏，凭位置完成映射。' : '绿色标记表示当前题目的琴键。' }}</span>
        <button type="button" class="min-h-11 rounded-xl px-3 font-bold text-brand hover:bg-brand-soft" @click="openSetup">
          调整设置
        </button>
      </div>
    </footer>

    <PracticeSetupDialog v-if="phase === 'setup'" title="开始简谱琴键训练" description="选择题型、题目数量和序列长度" :cancel-label="setupReturn ? '返回' : '返回首页'" @start="begin()" @cancel="cancelSetup">
      <div class="flex flex-wrap items-center gap-3 text-xs">
        <span class="rounded-full bg-brand-soft px-3 py-1.5 font-extrabold text-brand-dark">C 大调 · 1=C</span>
        <span class="font-bold text-muted">固定调性 · 七个白键</span>
      </div>
      <fieldset>
        <legend class="text-sm font-extrabold text-ink">
          题型（可多选）
        </legend>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <button v-for="option in questionTypeOptions" :key="option.value" type="button" role="checkbox" :aria-checked="isQuestionTypeSelected(option.value)" class="relative min-h-20 rounded-[20px] border-2 p-2 text-center transition sm:min-h-24 sm:p-3 sm:text-left" :class="isQuestionTypeSelected(option.value) ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand/30'" @click="toggleQuestionType(option.value)">
            <strong class="block pt-4 text-xs/4 font-black whitespace-nowrap text-ink sm:pt-0 sm:pr-5 sm:text-sm sm:whitespace-normal">{{ option.label }}</strong>
            <span class="mt-2 hidden text-xs font-bold text-muted sm:block">{{ option.description }}</span>
            <span v-if="isQuestionTypeSelected(option.value)" class="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-brand text-xs font-black text-white" aria-hidden="true">✓</span>
          </button>
        </div>
        <p class="mt-2 text-[11px] font-bold text-muted">
          默认全选；训练时会在所选题型间均衡出题，至少保留一种。
        </p>
      </fieldset>

      <fieldset>
        <legend class="text-sm font-extrabold text-ink">
          题目数量
        </legend>
        <div class="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="题目数量">
          <button type="button" role="radio" class="relative min-h-20 rounded-[20px] border-2 p-3 text-left transition" :class="settings.mode === 'fixed' ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand/30'" :aria-checked="settings.mode === 'fixed'" @click="settings.mode = 'fixed'">
            <span class="flex items-center gap-2"><span class="hidden size-9 place-items-center rounded-xl bg-white text-sm font-black text-brand-dark sm:grid">10</span><strong class="text-sm font-black text-ink">10 题练习</strong></span>
            <span class="mt-2.5 block text-[11px] font-bold text-muted sm:text-xs">完成后查看正确率</span>
            <span v-if="settings.mode === 'fixed'" class="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-brand text-xs font-black text-white">✓</span>
          </button>
          <button type="button" role="radio" class="relative min-h-20 rounded-[20px] border-2 p-3 text-left transition" :class="settings.mode === 'infinite' ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand/30'" :aria-checked="settings.mode === 'infinite'" @click="settings.mode = 'infinite'">
            <span class="flex items-center gap-2"><span class="hidden size-9 place-items-center rounded-xl bg-white text-lg font-black text-brand-dark sm:grid">∞</span><strong class="text-sm font-black text-ink">无限练习</strong></span>
            <span class="mt-2.5 block text-[11px] font-bold text-muted sm:text-xs">随时结束查看报告</span>
            <span v-if="settings.mode === 'infinite'" class="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-brand text-xs font-black text-white">✓</span>
          </button>
        </div>
      </fieldset>

      <fieldset>
        <div class="flex items-center justify-between gap-3">
          <legend class="text-sm font-extrabold text-ink">
            序列长度
          </legend>
          <span class="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-extrabold text-brand-dark">当前：{{ settings.sequenceLength }} 项</span>
        </div>
        <div class="mt-2 rounded-[18px] border border-line bg-[#fbfcfa] p-4">
          <input v-model.number="settings.sequenceLength" type="range" min="1" max="12" step="1" class="h-6 w-full cursor-pointer accent-brand" aria-label="序列长度" :aria-valuetext="`${settings.sequenceLength} 项`">
          <div class="mt-1 flex justify-between text-[10px] font-extrabold text-muted">
            <span>1 · 单项</span><span>12 · 挑战</span>
          </div>
          <div class="mt-2 grid grid-cols-4 gap-2">
            <button v-for="(preset, index) in sequencePresets" :key="preset" type="button" class="min-h-9 rounded-xl border px-0 text-[10px] font-extrabold whitespace-nowrap transition sm:text-[11px]" :class="settings.sequenceLength === preset ? 'border-brand-dark bg-brand-dark text-white' : 'border-line bg-white text-muted hover:border-brand/30 hover:text-ink'" :aria-pressed="settings.sequenceLength === preset" @click="settings.sequenceLength = preset">
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
      <p v-if="setupReturn" class="text-xs/5 font-bold text-muted">
        开始训练会清空本轮结果；返回可继续当前练习。
      </p>
    </PracticeSetupDialog>
  </div>
</template>

<style scoped>
[data-mapping-practice] :deep([data-key-color='white'][data-state='active']) {
  background: var(--color-brand-soft);
}
@media (max-width: 639px) {
  [data-practice-content] { padding-top: 12px; padding-bottom: 12px; }
  [data-question-card] { padding-top: 16px; padding-bottom: 16px; }
  [data-question-title] { margin-top: 12px; }
  [data-question-description] { margin-top: 8px; }
  [data-number-answers] { margin-top: 16px; }
  [data-number-answers] button { min-height: 48px; }
}
@media (min-width: 640px) and (max-height: 800px) {
  [data-practice-content] { padding-top: 24px; padding-bottom: 24px; }
  [data-question-card] { padding-top: 20px; padding-bottom: 20px; }
  [data-question-title] { margin-top: 12px; font-size: 26px; }
  [data-question-sequence] { margin-top: 16px; margin-bottom: 16px; }
  [data-sequence='false'] [data-question-sequence] li { height: 96px; }
  [data-question-keyboard] :deep([role='group']) { height: 160px; }
}
</style>
