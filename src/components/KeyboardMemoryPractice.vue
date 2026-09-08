<script setup lang="ts">
import type { KeyboardDirectionSetting, KeyboardQuestion, KeyboardSettings, NamedPitch } from '@/domain/keyboardPractice'
import type { PianoKeyMark } from '@/domain/piano'
import type { MidiNote } from '@/domain/pitch'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import PianoKeyboard from '@/components/PianoKeyboard.vue'
import PracticeSetupDialog from '@/components/PracticeSetupDialog.vue'
import { useInstrumentPlayer } from '@/composables/useInstrumentPlayer'
import { createHighlightPlayer, createKeyboardGenerator, isCorrectKey, namedPitch, pianoKeys, pianoKeyShortcuts } from '@/domain/keyboardPractice'
import { pitchClassOf } from '@/domain/pitch'

const emit = defineEmits<{ exit: [] }>()
const sequencePresets = [1, 4, 8, 12] as const
const directions: { value: KeyboardDirectionSetting, label: string }[] = [
  { value: 'name-to-key', label: '音名 → 琴键' },
  { value: 'key-to-name', label: '琴键 → 音名' },
  { value: 'mixed', label: '双向混合' },
]
const phase = ref<'setup' | 'playing' | 'result'>('setup')
const settings = ref<KeyboardSettings>({ direction: 'mixed', mode: 'fixed', sequenceLength: 1 })
const active = ref<KeyboardSettings>({ ...settings.value })
const question = ref<KeyboardQuestion>()
const selected = ref<NamedPitch>()
const answerIndex = ref(0)
const displayIndex = ref<number | null>(null)
const answerState = ref<'answering' | 'correct' | 'wrong'>('answering')
const displayRun = ref(0)
const player = createHighlightPlayer((index) => {
  displayIndex.value = index
  displayRun.value++
})
const correctCount = ref(0)
const wrongCount = ref(0)
const questionNumber = ref(0)
const heading = ref<HTMLElement>()
const nextButton = ref<HTMLButtonElement>()
const { activeNotes, error: audioError, playNote, prepare: prepareAudio, status: audioStatus, stop, unlock: unlockAudio } = useInstrumentPlayer('piano')
let generate = createKeyboardGenerator(active.value)
let advanceTimer: ReturnType<typeof setTimeout> | undefined
const heldKeys = new Set<string>()

const answered = computed(() => correctCount.value + wrongCount.value)
const accuracy = computed(() => answered.value ? `${Math.round(correctCount.value / answered.value * 100)}%` : '—')
const locked = computed(() => answerState.value !== 'answering')
const wasCorrect = computed(() => answerState.value === 'correct')
const currentItem = computed(() => question.value?.sequence[Math.min(answerIndex.value, (question.value?.sequence.length ?? 1) - 1)])
const isSequence = computed(() => (question.value?.sequence.length ?? 1) > 1)
const nameToKey = computed(() => question.value?.direction === 'name-to-key')
const directionLabel = computed(() => directions.find(item => item.value === question.value?.direction)?.label)
const lastQuestion = computed(() => active.value.mode === 'fixed' && questionNumber.value === 10)
const setupAudioMessage = computed(() => {
  switch (audioStatus.value) {
    case 'ready': return '钢琴音色已就绪。'
    case 'fallback': return '钢琴采样未加载成功，本次将使用基础音色。'
    case 'unavailable': return '声音暂不可用，仍可进行视觉训练。'
    default: return '正在准备钢琴音色；未完成时会自动使用基础音色。'
  }
})
const playingAudioMessage = computed(() => {
  if (audioError.value) {
    return audioError.value
  }
  switch (audioStatus.value) {
    case 'loading': return '钢琴音色正在加载，暂用基础音色。'
    case 'fallback': return '钢琴采样暂不可用，已切换为基础音色。'
    case 'unavailable': return '声音暂不可用，你仍可继续答题。'
    default: return ''
  }
})
const keyboardMarks = computed<PianoKeyMark[]>(() => {
  const marks: PianoKeyMark[] = activeNotes.value.map(midi => ({ midi, state: 'active' }))
  if (!nameToKey.value && !locked.value && displayIndex.value !== null) {
    const item = question.value?.sequence[displayIndex.value]
    if (item) {
      marks.push({ midi: pianoKeys[item.pitch]!.midi, state: 'active' })
    }
  }
  if (locked.value && currentItem.value) {
    marks.push({ midi: pianoKeys[currentItem.value.pitch]!.midi, state: 'correct', label: currentItem.value.label })
  }
  if (locked.value && !wasCorrect.value && nameToKey.value && selected.value) {
    marks.push({ midi: pianoKeys[selected.value.pitch]!.midi, state: 'wrong', label: selected.value.label })
  }
  return marks
})

function clearTransition() {
  player.stop()
  clearTimeout(advanceTimer)
  advanceTimer = undefined
  stop()
}

function focusHeading() {
  void nextTick(() => heading.value?.focus())
}

function finish() {
  clearTransition()
  phase.value = 'result'
  focusHeading()
}

function advance() {
  clearTransition()
  if (lastQuestion.value) {
    finish()
    return
  }
  question.value = generate()
  questionNumber.value++
  selected.value = undefined
  answerIndex.value = 0
  answerState.value = 'answering'
  if (question.value.direction === 'key-to-name') {
    player.start(question.value.sequence.length)
  }
  focusHeading()
}

function begin(usePrevious = false) {
  clearTransition()
  if (!usePrevious) {
    active.value = { ...settings.value }
  }
  generate = createKeyboardGenerator(active.value)
  correctCount.value = 0
  wrongCount.value = 0
  questionNumber.value = 0
  audioError.value = ''
  void unlockAudio()
  phase.value = 'playing'
  advance()
}

function setup() {
  clearTransition()
  settings.value = { ...active.value }
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

function replay() {
  if (question.value && !locked.value) {
    player.start(question.value.sequence.length, answerIndex.value)
  }
}

function choose(note: NamedPitch) {
  if (phase.value !== 'playing' || locked.value || !question.value || !currentItem.value) {
    return
  }
  selected.value = note
  if (nameToKey.value) {
    void playNote(pianoKeys[note.pitch]!.midi)
  }
  if (isCorrectKey(currentItem.value, note)) {
    answerIndex.value++
    if (answerIndex.value === question.value.sequence.length) {
      answerState.value = 'correct'
      player.stop()
      correctCount.value++
      advanceTimer = setTimeout(advance, 900)
    }
    else {
      player.answered(answerIndex.value)
    }
  }
  else {
    answerState.value = 'wrong'
    player.stop()
    wrongCount.value++
    void nextTick(() => nextButton.value?.focus())
  }
}
function chooseKey(midi: MidiNote) {
  choose(namedPitch(pitchClassOf(midi)))
}

function onKeyDown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) {
    return
  }
  const key = event.key.toLowerCase()
  if (event.repeat || heldKeys.has(key)) {
    return
  }
  heldKeys.add(key)
  if (phase.value !== 'playing' || locked.value) {
    return
  }
  if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) {
    return
  }
  const note = nameToKey.value
    ? pianoKeys.find(item => item.shortcut === key)
    : undefined
  if (note) {
    event.preventDefault()
    chooseKey(note.midi)
  }
}
function onKeyUp(event: KeyboardEvent) {
  heldKeys.delete(event.key.toLowerCase())
}
function onBlur() {
  heldKeys.clear()
  stop()
}

onMounted(() => {
  void prepareAudio()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)
})
onBeforeUnmount(() => {
  clearTransition()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('blur', onBlur)
})
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header class="border-b border-line bg-white">
      <div class="mx-auto grid min-h-20 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-8">
        <button type="button" class="flex min-h-11 items-center gap-2 justify-self-start rounded-xl px-2 text-sm font-bold text-muted hover:bg-brand-soft" @click="leave">
          <span aria-hidden="true">‹</span>
          <span class="hidden sm:inline">{{ phase === 'playing' ? active.mode === 'infinite' ? '结束训练' : '退出训练' : '返回首页' }}</span>
          <span class="whitespace-nowrap sm:hidden">{{ phase === 'playing' ? active.mode === 'infinite' ? '结束' : '退出' : '返回' }}</span>
        </button>
        <div class="text-center">
          <p class="text-sm font-extrabold sm:text-base">
            钢琴键位训练
          </p>
          <p class="mt-1 text-xs text-muted">
            {{ phase === 'playing' ? directionLabel : phase === 'setup' ? '一个八度 · 十二音' : '本轮训练完成' }}
          </p>
        </div>
        <span v-if="phase === 'playing'" class="justify-self-end text-xs font-bold text-muted sm:text-sm">{{ active.mode === 'fixed' ? `${questionNumber} / 10` : `已答 ${answered} 题` }}</span>
      </div>
      <div v-if="phase === 'playing' && active.mode === 'fixed'" class="h-1 bg-line" role="progressbar" aria-label="已完成题数" :aria-valuenow="answered" :aria-valuemin="0" :aria-valuemax="10">
        <div class="h-full bg-brand transition-all motion-reduce:transition-none" :style="{ width: `${answered * 10}%` }" />
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-3 py-8 sm:px-8 sm:py-14">
      <section v-if="phase === 'setup'" class="rounded-3xl border border-line bg-white p-5 opacity-60 shadow-card sm:p-6">
        <div>
          <p class="text-xs font-extrabold tracking-widest text-brand">
            钢琴键位记忆
          </p>
          <h1 class="mt-2 text-xl/tight font-black outline-none sm:text-2xl">
            把十二音真正记到手上
          </h1>
          <p class="mt-3 text-sm/6 text-muted">
            看音名找到琴键，或看琴键选择音名。通过完整的黑白键布局，练习黑白键与十二音的空间位置。
          </p>
          <div class="mt-4 hidden md:block" aria-hidden="true">
            <PianoKeyboard compact />
          </div>
        </div>
      </section>

      <section v-else-if="phase === 'playing' && question" class="rounded-3xl border border-line bg-white px-3 py-7 shadow-card sm:px-10 sm:py-9">
        <div class="text-center">
          <p class="text-xs font-extrabold text-brand">
            {{ nameToKey ? '找到琴键' : '识别琴键' }}
          </p>
          <h1 ref="heading" tabindex="-1" class="mt-2 text-xl font-black outline-none sm:text-3xl">
            {{ nameToKey ? isSequence ? '按顺序弹出这些音' : '找到这个音' : isSequence ? '按顺序识别琴键' : '这个琴键是什么音？' }}
          </h1>
          <p class="mt-3 text-xs text-muted sm:text-sm">
            {{ nameToKey ? '依次点击对应琴键' : isSequence ? '按题目顺序选择音名，高亮每秒自动前进' : '选择高亮琴键对应的音名' }}
          </p>
        </div>
        <ol class="my-6 grid gap-2" :class="isSequence ? 'grid-cols-4 sm:grid-cols-6' : 'mx-auto max-w-40 grid-cols-1'" aria-label="题目序列">
          <li v-for="(item, index) in question.sequence" :key="index" class="flex min-h-16 flex-col items-center justify-center rounded-xl border-2 px-1 text-lg font-extrabold" :class="index < answerIndex ? 'border-brand/30 bg-brand-soft text-brand-dark' : locked && index === answerIndex ? 'border-error bg-error-soft text-error' : index === answerIndex ? 'border-brand text-ink' : 'border-line text-muted'" :aria-current="index === answerIndex ? 'step' : undefined">
            <span class="text-[10px] font-medium">{{ index + 1 }}{{ !nameToKey && displayIndex === index ? ' · 展示中' : index === answerIndex && !locked ? ' · 待答' : '' }}</span>
            <span>{{ nameToKey || index < answerIndex || locked ? item.label : '?' }}<span v-if="index < answerIndex" aria-hidden="true"> ✓</span></span>
          </li>
        </ol>
        <div class="mb-3 flex min-h-11 flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>{{ locked ? wasCorrect ? '全部完成' : `第 ${answerIndex + 1} 项出错` : `正在回答 ${answerIndex + 1} / ${question.sequence.length}` }}</span>
          <span v-if="!nameToKey">{{ displayIndex === null ? '演示已结束' : `正在展示 ${displayIndex + 1} / ${question.sequence.length}` }}</span>
          <button v-if="!nameToKey && !locked" type="button" class="min-h-11 rounded-lg px-3 font-bold text-brand hover:bg-brand-soft" @click="replay">
            重新演示未答部分
          </button>
        </div>
        <PianoKeyboard
          :key="`${questionNumber}-${displayRun}`" :interactive="nameToKey && !locked"
          :marks="keyboardMarks" :shortcuts="pianoKeyShortcuts"
          @select="chooseKey"
        />
        <div class="my-5 min-h-36 sm:min-h-24">
          <div v-if="!nameToKey" class="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3" role="group" aria-label="选择音名">
            <button v-for="note in question.options" :key="note.pitch" type="button" class="min-h-14 rounded-xl border-2 text-lg font-black transition-colors" :class="locked && note.pitch === currentItem?.pitch ? 'border-brand bg-brand-soft text-brand-dark' : locked && !wasCorrect && note.pitch === selected?.pitch ? 'border-error bg-error-soft text-error' : 'border-line hover:border-brand hover:bg-brand-soft'" :disabled="locked" :aria-label="`选择音名 ${note.label}`" @click="choose(note)">
              <span v-if="locked && (note.pitch === currentItem?.pitch || (!wasCorrect && note.pitch === selected?.pitch))" class="mr-1" aria-hidden="true">{{ note.pitch === currentItem?.pitch ? '✓' : '×' }}</span>{{ note.label }}
            </button>
          </div>
          <p class="mt-3 hidden text-center text-xs text-muted sm:block">
            {{ nameToKey ? '白键 A S D F G H J · 黑键 W E T Y U（从左到右）' : '用 Tab 选择音名按钮，Enter 或空格提交' }}
          </p>
        </div>
        <div class="min-h-24" aria-live="polite" aria-atomic="true">
          <div v-if="locked" class="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4" :class="wasCorrect ? 'border-brand/20 bg-brand-soft' : 'border-error/20 bg-error-soft'">
            <div>
              <p class="text-sm font-extrabold" :class="wasCorrect ? 'text-brand-dark' : 'text-error'">
                {{ wasCorrect ? `✓ ${isSequence ? '序列全部正确！' : `答对了！这是 ${currentItem?.label}`}` : `× 第 ${answerIndex + 1} 项：你选择了 ${selected?.label}，正确答案：${currentItem?.label}` }}
              </p>
              <p class="mt-1 text-xs text-muted">
                {{ wasCorrect ? lastQuestion ? '即将查看本轮结果' : '即将进入下一题' : '记住正确琴键的位置，再继续练习。' }}
              </p>
            </div>
            <button v-if="!wasCorrect" ref="nextButton" type="button" class="min-h-11 w-full rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark sm:w-auto" @click="advance">
              {{ lastQuestion ? '查看结果 →' : '下一题 →' }}
            </button>
          </div>
        </div>
        <p v-if="playingAudioMessage" class="mt-3 text-xs/5 text-muted" role="status">
          {{ playingAudioMessage }}
        </p>
      </section>

      <section v-else class="mx-auto max-w-2xl rounded-3xl border border-line bg-white p-6 text-center shadow-card sm:p-10">
        <span class="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-soft text-3xl text-brand" aria-hidden="true">✓</span>
        <h1 ref="heading" tabindex="-1" class="mt-5 text-3xl font-black outline-none">
          {{ answered ? '训练完成' : '尚未作答' }}
        </h1>
        <p class="mt-3 text-sm/6 text-muted">
          {{ answered ? '继续练习，让音名和琴键位置形成稳定映射。' : '准备好后，再开始一次键位练习。' }}
        </p>
        <p class="mt-2 text-xs text-muted">
          {{ directions.find(item => item.value === active.direction)?.label }} · 共 {{ answered }} 题 · 每题 {{ active.sequenceLength }} 项
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
          </button>
          <button type="button" class="min-h-14 rounded-xl bg-brand font-bold text-white hover:bg-brand-dark" @click="begin(true)">
            再练一次 →
          </button>
        </div>
        <button type="button" class="mt-3 min-h-11 rounded-xl px-5 text-sm font-bold text-muted hover:bg-brand-soft" @click="leave">
          返回首页
        </button>
      </section>
    </main>

    <PracticeSetupDialog v-if="phase === 'setup'" title="开始钢琴键位训练" description="选择训练方向、题目数量和序列长度" cancel-label="返回首页" @start="begin()" @cancel="leave">
      <fieldset>
        <legend class="mb-2 text-sm font-bold text-muted">
          训练方向
        </legend>
        <div class="grid grid-cols-3 gap-2">
          <label v-for="direction in directions" :key="direction.value" class="flex min-h-12 min-w-0 cursor-pointer items-center justify-center rounded-xl border-2 px-1 text-center text-[11px] font-bold whitespace-nowrap has-focus-visible:outline-2 has-focus-visible:outline-brand sm:text-sm" :class="settings.direction === direction.value ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line'">
            {{ direction.label }}
            <input v-model="settings.direction" type="radio" name="direction" :value="direction.value" class="sr-only">
          </label>
        </div>
      </fieldset>
      <fieldset>
        <legend class="mb-2 text-sm font-bold text-muted">
          训练长度
        </legend>
        <div class="grid grid-cols-2 gap-3">
          <label v-for="mode in (['fixed', 'infinite'] as const)" :key="mode" class="flex min-h-12 cursor-pointer items-center justify-between gap-2 rounded-2xl border-2 p-3 text-sm font-bold has-focus-visible:outline-2 has-focus-visible:outline-brand" :class="settings.mode === mode ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line'">
            {{ mode === 'fixed' ? '10 题' : '无限训练 ∞' }}
            <input v-model="settings.mode" type="radio" name="mode" :value="mode" class="size-4 accent-brand">
          </label>
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
            <button v-for="(preset, index) in sequencePresets" :key="preset" type="button" class="min-h-9 rounded-xl border text-[11px] font-extrabold transition" :class="settings.sequenceLength === preset ? 'border-brand-dark bg-brand-dark text-white' : 'border-line bg-white text-muted hover:border-brand/30 hover:text-ink'" @click="settings.sequenceLength = preset">
              {{ preset }} · {{ ['入门', '进阶', '熟练', '挑战'][index] }}
            </button>
          </div>
        </div>
      </fieldset>
      <p class="text-xs/6 text-muted">
        出题范围包含全部黑白键，升降音名随机展示，等价音均算正确。序列中任意一项答错即结束本题。
      </p>
      <p class="text-center text-xs/5 text-muted" role="status">
        {{ setupAudioMessage }}
      </p>
      <p class="text-center text-[10px]/4 text-muted">
        钢琴采样：<a class="underline hover:text-ink" href="https://github.com/sfzinstruments/SalamanderGrandPiano" target="_blank" rel="noreferrer">Salamander Grand Piano</a> · Alexander Holm · <a class="underline hover:text-ink" href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>
      </p>
    </PracticeSetupDialog>
  </div>
</template>
