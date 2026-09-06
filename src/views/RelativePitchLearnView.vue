<script setup lang="ts">
import type { InstrumentTimelineStep } from '@/composables/useInstrumentPlayer'
import type { MajorScaleId } from '@/domain/majorScale'
import type { PianoKeyMark } from '@/domain/piano'
import { computed, onMounted, ref } from 'vue'
import PianoKeyboard from '@/components/PianoKeyboard.vue'
import { useInstrumentPlayer } from '@/composables/useInstrumentPlayer'
import { majorScaleIds, majorScales } from '@/domain/majorScale'
import {
  relativePitchLearningKeyboardFrom,
  relativePitchLearningKeyboardTo,
  scaleDegreeMidi,
  tonalContextSteps,
} from '@/domain/relativePitch'

const selectedScaleId = ref<MajorScaleId>('C')
const selectedScale = computed(() => majorScales[selectedScaleId.value])
const { activeNotes, error: audioError, isPlaying, playTimeline, prepare, status: audioStatus, stop } = useInstrumentPlayer('piano')
const keyboardMarks = computed<PianoKeyMark[]>(() => [
  { midi: selectedScale.value.lowTonicMidi, state: 'member', label: '1', detail: selectedScale.value.id },
  ...activeNotes.value.map(midi => ({ midi, state: 'active' as const })),
])

function playSteps(steps: readonly InstrumentTimelineStep[]) {
  void playTimeline(steps)
}

function playScaleRelationship(scaleId: MajorScaleId) {
  const scale = majorScales[scaleId]
  playSteps([
    { notes: [scale.lowTonicMidi], durationMilliseconds: 600, gapMilliseconds: 120 },
    { notes: [scaleDegreeMidi(scale, 3)], durationMilliseconds: 700, gapMilliseconds: 0 },
  ])
}

function playHome() {
  const scale = selectedScale.value
  playSteps([
    { notes: [scaleDegreeMidi(scale, 5)], durationMilliseconds: 600, gapMilliseconds: 120 },
    { notes: [scale.lowTonicMidi], durationMilliseconds: 800, gapMilliseconds: 0 },
  ])
}

function chooseScale(id: MajorScaleId) {
  stop()
  selectedScaleId.value = id
}

onMounted(() => void prepare())
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header class="border-b border-line bg-white">
      <div class="mx-auto grid min-h-20 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-8">
        <RouterLink :to="{ name: 'relative-pitch-home' }" class="flex min-h-11 items-center gap-2 justify-self-start rounded-xl px-2 text-sm font-bold text-muted hover:bg-brand-soft" @click="stop">
          <span aria-hidden="true">‹</span><span class="hidden sm:inline">返回模块</span><span class="sm:hidden">返回</span>
        </RouterLink>
        <div class="text-center">
          <p class="text-sm font-extrabold sm:text-base">
            相对音高 · 学习
          </p>
          <p class="mt-1 text-xs text-muted">
            找到主音 1
          </p>
        </div>
        <RouterLink :to="{ name: 'relative-pitch-practice', query: { mode: 'fixed' } }" class="flex min-h-11 items-center justify-self-end rounded-xl px-3 text-xs font-extrabold text-brand hover:bg-brand-soft sm:text-sm" @click="stop">
          去练习
        </RouterLink>
      </div>
    </header>

    <main class="mx-auto max-w-6xl space-y-6 px-3 py-8 sm:px-8 sm:py-12">
      <article class="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        <section class="grid gap-7 p-5 sm:p-9 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p class="text-xs font-extrabold tracking-widest text-brand">
              STEP 1 · 先分清两种能力
            </p>
            <h1 class="mt-3 text-3xl/tight font-black sm:text-4xl">
              相对音高听的是“关系”，不是固定音名
            </h1>
            <p class="mt-4 text-sm/7 text-muted">
              在 C 大调里，3 是 E；换到 G 大调，3 变成 B。实际音高改变了，但它们相对主音的位置和功能相同。
            </p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <button type="button" class="flex min-h-20 items-center justify-between rounded-2xl border border-line bg-canvas px-5 text-left hover:border-brand/30 hover:bg-brand-soft" @click="playScaleRelationship('C')">
              <span><strong class="block">C 大调</strong><span class="mt-1 block text-xs text-muted">C → E · 1 → 3</span></span><span class="text-brand" aria-hidden="true">▶</span>
            </button>
            <button type="button" class="flex min-h-20 items-center justify-between rounded-2xl border border-line bg-canvas px-5 text-left hover:border-brand/30 hover:bg-brand-soft" @click="playScaleRelationship('G')">
              <span><strong class="block">G 大调</strong><span class="mt-1 block text-xs text-muted">G → B · 1 → 3</span></span><span class="text-brand" aria-hidden="true">▶</span>
            </button>
          </div>
        </section>

        <section class="border-t border-line bg-brand-soft/55 p-5 sm:p-9">
          <p class="text-xs font-extrabold tracking-widest text-brand">
            STEP 2 · 找到“家”
          </p>
          <div class="mt-3 grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <h2 class="text-2xl font-black sm:text-3xl">
                在每个调里，1 都是参照点
              </h2>
              <p class="mt-4 text-sm/7 text-muted">
                其他音可能悬着、想继续向前；回到 1 时会产生稳定和结束的感觉。先记住这种感觉，再判断音名。
              </p>
              <div class="mt-5 grid grid-cols-2 gap-3">
                <button type="button" class="min-h-12 rounded-xl border border-line bg-white text-sm font-extrabold hover:bg-brand-soft" @click="playSteps(tonalContextSteps(selectedScale, 'scale'))">
                  ▶ 听完整音阶
                </button>
                <button type="button" class="min-h-12 rounded-xl bg-brand text-sm font-extrabold text-white hover:bg-brand-dark" @click="playHome">
                  ▶ 听 5 → 1
                </button>
              </div>
            </div>

            <div class="min-w-0 rounded-2xl border border-line bg-white p-4 sm:p-5">
              <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p class="text-xs font-bold text-muted">
                    当前调
                  </p>
                  <p class="mt-1 text-xl font-black">
                    {{ selectedScale.name }} · 1 = {{ selectedScale.id }}
                  </p>
                </div>
                <span class="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-extrabold text-brand-dark">十二调任选</span>
              </div>
              <div class="grid grid-cols-4 gap-2 sm:grid-cols-6" role="group" aria-label="选择学习调性">
                <button v-for="id in majorScaleIds" :key="id" type="button" class="min-h-11 rounded-xl border text-sm font-extrabold" :class="selectedScaleId === id ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line hover:border-brand/30'" :aria-pressed="selectedScaleId === id" @click="chooseScale(id)">
                  {{ id }}
                </button>
              </div>
              <div class="mt-5 overflow-x-auto rounded-xl bg-canvas p-3" tabindex="0" aria-label="从 C4 到 B5 的音阶演示钢琴">
                <PianoKeyboard compact :depressed-notes="activeNotes" :from="relativePitchLearningKeyboardFrom" :marks="keyboardMarks" :to="relativePitchLearningKeyboardTo" />
              </div>
            </div>
          </div>
        </section>
      </article>

      <section class="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-8">
        <p class="text-xs font-extrabold tracking-widest text-brand">
          STEP 3 · 准备练习
        </p>
        <div class="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-2xl font-black">
              接下来，在十二个调里寻找“1”
            </h2>
            <p class="mt-2 text-sm/6 text-muted">
              你可以手动选择完整音阶、主和弦分解、终止式或单独主音作为提示。
            </p>
          </div>
          <RouterLink :to="{ name: 'relative-pitch-tonic', query: { mode: 'fixed' } }" class="grid min-h-14 shrink-0 place-items-center rounded-2xl bg-brand px-7 text-sm font-extrabold text-white hover:bg-brand-dark" @click="stop">
            开始找主音 →
          </RouterLink>
        </div>
      </section>

      <p v-if="audioError" class="text-center text-xs text-muted" role="status">
        {{ audioError }}
      </p>
      <p v-else-if="audioStatus === 'loading' || isPlaying" class="text-center text-xs text-muted" role="status">
        {{ audioStatus === 'loading' ? '钢琴音色正在加载，暂用基础音色。' : '正在播放…' }}
      </p>
    </main>
  </div>
</template>
