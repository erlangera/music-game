<script setup lang="ts">
import type { RhythmLevel } from '@/domain/rhythm'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PracticePageHeader from '@/components/PracticePageHeader.vue'
import PracticeSetupDialog from '@/components/PracticeSetupDialog.vue'
import { useRhythmAudio } from '@/composables/useRhythmAudio'
import { createRhythmQueue, gradeRhythm, rhythmCells, rhythmCounts } from '@/domain/rhythm'

const router = useRouter()
const audio = useRhythmAudio()
const phase = ref<'setup' | 'playing' | 'result'>('setup')
const level = ref<RhythmLevel>('basic')
const bpm = ref(60)
const mode = ref('fixed')
const queue = ref(createRhythmQueue(10, 'basic'))
const index = ref(0)
const answered = ref(0)
const correct = ref(0)
const answer = ref<boolean[]>(Array<boolean>(8).fill(false))
const feedback = ref<ReturnType<typeof gradeRhythm> | null>(null)
const heard = ref(false)
const autoAdvance = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let playback = 0
const question = computed(() => queue.value[index.value % 10]!)
const expected = computed(() => rhythmCells(question.value))
const accuracy = computed(() => answered.value ? `${Math.round(correct.value / answered.value * 100)}%` : '—')
function cancelAdvance() {
  autoAdvance.value = false
  clearTimeout(timer)
}
function stop() {
  playback++
  audio.stop()
}
function start() {
  cancelAdvance()
  stop()
  queue.value = createRhythmQueue(10, level.value)
  index.value = 0
  answered.value = 0
  correct.value = 0
  reset()
  phase.value = 'playing'
}
function reset() {
  answer.value = Array<boolean>(8).fill(false)
  feedback.value = null
  heard.value = false
  audio.error.value = ''
}
async function listen() {
  cancelAdvance()
  const token = ++playback
  const completed = await audio.play(question.value, bpm.value)
  if (token === playback && completed) {
    heard.value = true
  }
}
function finish() {
  cancelAdvance()
  stop()
  phase.value = 'result'
}
function next() {
  cancelAdvance()
  stop()
  if (mode.value === 'fixed' && answered.value === 10) {
    finish()
    return
  }
  index.value++
  if (index.value % 10 === 0) {
    queue.value = createRhythmQueue(10, level.value)
  }
  reset()
}
function submit() {
  if (feedback.value || !heard.value || audio.playing.value) {
    return
  }
  feedback.value = gradeRhythm(expected.value, answer.value)
  answered.value++
  if (feedback.value.correct) {
    correct.value++
    autoAdvance.value = true
    timer = setTimeout(next, 1200)
  }
}
function hide() {
  if (document.hidden) {
    cancelAdvance()
    stop()
  }
}
onMounted(() => document.addEventListener('visibilitychange', hide))
onBeforeUnmount(() => {
  cancelAdvance()
  stop()
  document.removeEventListener('visibilitychange', hide)
})
</script>

<template>
  <div class="min-h-dvh bg-canvas">
    <PracticePageHeader>
      <div class="mx-auto flex max-w-4xl items-center justify-between gap-2 px-3 text-sm">
        <RouterLink to="/rhythm" class="rounded-xl p-2 font-bold text-muted">
          ‹ 学习
        </RouterLink>
        <span class="font-extrabold">节奏听写</span>
        <button v-if="phase === 'playing'" class="min-h-11 rounded-xl px-2 font-bold text-muted" @click="finish">
          结束本轮
        </button>
        <span v-else class="text-muted">{{ phase === 'setup' ? '设置' : '本轮结果' }}</span>
      </div>
    </PracticePageHeader>
    <main class="mx-auto max-w-3xl px-3 py-6 sm:px-6 sm:py-10">
      <section v-if="phase === 'playing'" class="space-y-5 rounded-3xl border border-line bg-white p-4 shadow-card sm:p-7">
        <div class="flex items-center justify-between text-xs font-bold text-muted">
          <span>4/4 · ♩ = {{ bpm }} BPM</span><span>第 {{ index + 1 }} 题 / {{ mode === 'fixed' ? '10' : '∞' }}</span>
        </div>
        <h1 class="text-2xl font-black">
          听一听，哪些位置发了音？
        </h1>
        <p class="text-sm/6 text-muted">
          先听四拍预备，再听四拍题目。高音是拍点，低音是题目。每格半拍，只选低音开始的位置。
        </p>
        <div class="flex flex-wrap gap-2">
          <button class="min-h-12 rounded-xl bg-brand px-5 font-bold text-white" @click="listen">
            {{ audio.playing.value ? '从头重听' : feedback ? '播放正确答案' : '播放 / 重听题目' }}
          </button>
          <button v-if="audio.playing.value" class="min-h-12 rounded-xl border border-line px-4 font-bold" @click="stop">
            停止
          </button>
        </div>
        <p role="status" class="text-sm text-muted">
          {{ audio.playing.value ? '播放中：四拍预备 + 一小节题目' : heard ? '已听完，可以填写并提交。' : '请完整听完一次，再提交答案。' }}
        </p>
        <p v-if="audio.error.value" role="alert" class="text-sm text-error">
          {{ audio.error.value }}
        </p>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="一小节四拍">
          <div v-for="beat in 4" :key="beat" class="min-w-0 rounded-xl border border-line p-1 sm:p-2">
            <p class="py-1 text-center text-xs text-muted">
              第 {{ beat }} 拍
            </p>
            <div class="grid grid-cols-2 gap-1">
              <button v-for="half in 2" :key="half" :disabled="!!feedback" :aria-label="`第 ${beat} 拍${half === 1 ? '拍点' : '后半拍'}发音`" :aria-pressed="answer[(beat - 1) * 2 + half - 1]" class="min-h-16 rounded-lg border text-sm font-bold disabled:opacity-100" :class="answer[(beat - 1) * 2 + half - 1] ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line bg-white text-muted'" @click="answer[(beat - 1) * 2 + half - 1] = !answer[(beat - 1) * 2 + half - 1]">
                <span class="block">{{ rhythmCounts[(beat - 1) * 2 + half - 1] }}</span><span>{{ answer[(beat - 1) * 2 + half - 1] ? '●' : '·' }}</span>
              </button>
            </div>
          </div>
        </div>
        <p class="text-xs/5 text-muted">
          ● 发音起点 · 不重新发音（可能延续，也可能休止）。不考察点击时机与持续时值。
        </p>
        <div v-if="!feedback" class="flex gap-2">
          <button class="min-h-12 rounded-xl border border-line px-4 text-sm font-bold" @click="answer.fill(false)">
            清空
          </button>
          <button :disabled="!heard || audio.playing.value" class="min-h-12 flex-1 rounded-xl bg-brand px-4 font-bold text-white disabled:opacity-40" @click="submit">
            提交答案
          </button>
        </div>
        <section v-else class="space-y-3 rounded-2xl p-4" :class="feedback.correct ? 'bg-brand-soft text-brand-dark' : 'bg-error-soft text-error'" aria-live="polite">
          <h2 class="font-black">
            {{ feedback.correct ? (autoAdvance ? '全部正确！即将进入下一题' : '全部正确！可手动继续') : '再对照一下发音位置' }}
          </h2>
          <p class="text-sm">
            正确起音：{{ expected.map((hit, i) => hit ? `${Math.floor(i / 2) + 1}${i % 2 ? '&' : ''}` : '').filter(Boolean).join('、') }}
          </p>
          <p v-for="(cell, i) in feedback.cells" v-show="cell !== 'correct'" :key="i" class="text-sm">
            第 {{ Math.floor(i / 2) + 1 }} 拍{{ i % 2 ? '后半拍' : '拍点' }}：{{ cell === 'missing' ? '漏选，应发音' : '多选，不重新发音' }}
          </p>
          <p class="text-xs/6">
            本题节奏型：{{ question.map(p => p.label).join(' / ') }}
          </p>
          <button class="min-h-12 w-full rounded-xl border border-current px-4 font-bold" @click="next">
            {{ mode === 'fixed' && answered === 10 ? '查看结果' : '下一题' }}
          </button>
        </section>
      </section>
      <section v-else-if="phase === 'result'" class="space-y-6 rounded-3xl border border-line bg-white p-6 text-center shadow-card">
        <h1 class="text-2xl font-black">
          本轮节奏听写完成
        </h1>
        <p class="text-sm text-muted">
          只统计已提交的题目 · 成绩仅保留在本次会话
        </p>
        <div class="grid grid-cols-3 gap-2">
          <p>正确<strong class="mt-2 block text-2xl text-brand">{{ correct }}</strong></p><p>错误<strong class="mt-2 block text-2xl text-error">{{ answered - correct }}</strong></p><p>正确率<strong class="mt-2 block text-2xl">{{ accuracy }}</strong></p>
        </div>
        <p v-if="!answered" class="text-sm text-muted">
          本轮尚未提交答案。
        </p>
        <button class="min-h-12 w-full rounded-xl bg-brand font-bold text-white" @click="start">
          相同设置再练一轮
        </button>
        <button class="min-h-12 w-full rounded-xl border border-line font-bold" @click="phase = 'setup'">
          调整设置
        </button>
        <RouterLink to="/rhythm" class="block p-2 font-bold text-brand">
          返回学习
        </RouterLink>
      </section>
    </main>
    <PracticeSetupDialog v-if="phase === 'setup'" title="节奏听写设置" description="听一小节，写出发音位置" cancel-label="返回学习" @start="start" @cancel="router.push('/rhythm')">
      <fieldset class="space-y-2">
        <legend class="mb-2 font-extrabold">
          节奏范围
        </legend>
        <label v-for="option in (['basic', 'rests'] as const)" :key="option" class="flex min-h-14 items-center gap-3 rounded-xl border-2 p-3 text-sm" :class="level === option ? 'border-brand bg-brand-soft' : 'border-line'">
          <input v-model="level" type="radio" name="level" :value="option" class="accent-brand"><span>{{ option === 'basic' ? '基础：四分音符 + 二八' : '进阶：再加入前 / 后半拍休止' }}</span>
        </label>
      </fieldset>
      <fieldset>
        <legend class="mb-2 font-extrabold">
          速度 · 四分音符每分钟拍数
        </legend>
        <div class="grid grid-cols-3 gap-2">
          <label v-for="speed in [60, 80, 100]" :key="speed" class="flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 text-sm" :class="bpm === speed ? 'border-brand bg-brand-soft' : 'border-line'"><input v-model="bpm" type="radio" name="bpm" :value="speed" class="accent-brand">{{ speed }}</label>
        </div>
      </fieldset>
      <fieldset>
        <legend class="mb-2 font-extrabold">
          题目数量
        </legend>
        <div class="grid grid-cols-2 gap-2">
          <label v-for="length in ['fixed', 'infinite']" :key="length" class="flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 text-sm" :class="mode === length ? 'border-brand bg-brand-soft' : 'border-line'"><input v-model="mode" type="radio" name="mode" :value="length" class="accent-brand">{{ length === 'fixed' ? '10 题' : '无限练习' }}</label>
        </div>
      </fieldset>
      <p class="rounded-xl bg-brand-soft p-3 text-xs/6 text-brand-dark">
        建议从 60 BPM 开始。每题可反复听；只判发音位置，不检测拍手或按键是否合拍。
      </p>
    </PracticeSetupDialog>
  </div>
</template>
