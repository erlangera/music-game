<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import PracticePageHeader from '@/components/PracticePageHeader.vue'
import { useRhythmAudio } from '@/composables/useRhythmAudio'
import { rhythmPatterns } from '@/domain/rhythm'

const { play, stop, playing, error } = useRhythmAudio()
function hide() {
  if (document.hidden) {
    stop()
  }
}
onMounted(() => document.addEventListener('visibilitychange', hide))
onBeforeUnmount(() => document.removeEventListener('visibilitychange', hide))
</script>

<template>
  <div class="min-h-dvh bg-canvas">
    <PracticePageHeader>
      <div class="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4">
        <RouterLink to="/" class="rounded-xl p-2 text-sm font-bold text-muted">
          ‹ 首页
        </RouterLink>
        <span class="font-extrabold">节奏入门</span>
        <RouterLink to="/rhythm/practice" class="rounded-xl p-2 text-sm font-bold text-brand">
          去练习 →
        </RouterLink>
      </div>
    </PracticePageHeader>
    <main class="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <section class="rounded-3xl border border-line bg-white p-6 shadow-card">
        <p class="text-sm font-bold text-brand">
          阶段 06 · 先数，再拍，再听写
        </p>
        <h1 class="mt-3 text-3xl font-black">
          让心里的拍点不停
        </h1>
        <p class="mt-4 text-sm/7 text-muted">
          先用脚均匀踩拍，再口数「1 & 2 & 3 & 4 &」。4/4 每小节四拍，以四分音符为一拍；每个 & 在两拍正中间。强—弱—次强—弱的感觉不改变速度。
        </p>
        <p class="mt-3 rounded-xl bg-brand-soft p-3 text-sm/6 text-brand-dark">
          二八是两个八分音符均分一拍，不是 2/8 拍。● 表示发音起点，· 表示不重新发音；没有起音不一定是休止。
        </p>
      </section>
      <div class="grid gap-4 sm:grid-cols-2">
        <section v-for="pattern in rhythmPatterns" :key="pattern.id" class="rounded-3xl border border-line bg-white p-5">
          <h2 class="text-lg font-black">
            {{ pattern.label }} <span class="ml-2 text-brand">{{ pattern.notation }}</span>
          </h2>
          <div class="my-4 grid grid-cols-2 gap-2 text-center" :aria-label="`${pattern.label}的一拍位置图`">
            <div v-for="(hit, index) in pattern.cells" :key="index" class="rounded-xl bg-canvas p-3">
              <span class="block text-xs text-muted">{{ index === 0 ? '数字 · 拍点' : '& · 后半拍' }}</span>
              <span class="text-2xl text-brand">{{ hit ? '●' : '·' }}</span>
            </div>
          </div>
          <p class="min-h-12 text-sm/6 text-muted">
            {{ pattern.detail }}
          </p>
          <button class="mt-4 min-h-12 w-full rounded-xl border border-brand text-sm font-bold text-brand" @click="play([pattern, pattern, pattern, pattern], 60)">
            试听 {{ pattern.label }} · 60 BPM
          </button>
        </section>
      </div>
      <section class="space-y-3 rounded-3xl border border-line bg-white p-5 text-sm/6">
        <h2 class="font-black">
          跟着声音练一遍
        </h2>
        <p>每次先听四拍预备，高音点击保持四分拍，低音示范节奏。先口数，再只在低音处拍手；遇到休止，继续在心里数拍。</p>
        <p class="text-muted">
          下一步：听一小节，在八分网格选出发音位置。本练习不检测真实拍手，也不评估按键时机或音的持续时间。
        </p>
        <p role="status">
          {{ playing ? '正在播放：四拍预备 + 四拍示范' : '点击上方试听开始' }}
        </p>
        <button v-if="playing" class="min-h-12 rounded-xl border border-line px-5 font-bold" @click="stop">
          停止播放
        </button>
        <p v-if="error" role="alert" class="text-error">
          {{ error }}
        </p>
        <RouterLink to="/rhythm/practice" class="block rounded-2xl bg-brand p-4 text-center font-extrabold text-white">
          开始节奏听写 →
        </RouterLink>
      </section>
    </main>
  </div>
</template>
