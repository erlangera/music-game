<script setup lang="ts">
import type { RelativePitchMode } from '@/domain/relativePitch'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const selectedModule = ref<'learn' | 'practice'>('practice')
const practiceMode = ref<RelativePitchMode>('fixed')

function enterModule() {
  if (selectedModule.value === 'learn') {
    void router.push({ name: 'relative-pitch-learn' })
  }
  else {
    void router.push({ name: 'relative-pitch-practice', query: { mode: practiceMode.value } })
  }
}
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header class="border-b border-line bg-white">
      <div class="mx-auto grid min-h-20 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-8">
        <RouterLink :to="{ name: 'home' }" class="flex min-h-11 items-center gap-2 justify-self-start rounded-xl px-2 text-sm font-bold text-muted hover:bg-brand-soft">
          <span aria-hidden="true">‹</span><span class="hidden sm:inline">返回首页</span><span class="sm:hidden">返回</span>
        </RouterLink>
        <div class="text-center">
          <p class="text-sm font-extrabold sm:text-base">
            相对音高
          </p>
          <p class="mt-1 text-xs text-muted">
            学习 · 练习
          </p>
        </div>
        <span class="justify-self-end text-xs font-bold text-muted">模块入口</span>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-3 py-8 sm:px-8 sm:py-12">
      <section class="grid gap-8 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-9 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <div class="flex flex-col justify-between">
          <div>
            <p class="text-xs font-extrabold tracking-widest text-brand">
              相对音高
            </p>
            <h1 class="mt-3 text-3xl/tight font-black sm:text-5xl/tight">
              先找到“1”<br>再听懂旋律
            </h1>
            <p class="mt-5 max-w-xl text-sm/7 text-muted">
              从主音感开始，逐步建立「声音 ↔ 音级」映射，再进入两音关系、短音型与旋律听写。
            </p>
          </div>

          <div class="mt-8 rounded-2xl border border-brand/20 bg-brand-soft p-5">
            <p class="text-xs font-extrabold text-brand-dark">
              相对音高不是猜音名
            </p>
            <div class="mt-4 grid min-w-0 grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto] items-center text-center">
              <span class="grid size-10 place-items-center rounded-xl bg-white text-base font-black text-brand-dark sm:size-12 sm:text-lg">1</span>
              <span class="text-muted" aria-hidden="true">→</span>
              <span class="grid size-10 place-items-center rounded-xl bg-white text-base font-black text-brand-dark sm:size-12 sm:text-lg">3</span>
              <span class="text-muted" aria-hidden="true">→</span>
              <span class="grid size-10 place-items-center rounded-xl bg-white text-base font-black text-brand-dark sm:size-12 sm:text-lg">5</span>
              <span class="text-muted" aria-hidden="true">→</span>
              <span class="grid size-10 place-items-center rounded-xl bg-brand text-base font-black text-white sm:size-12 sm:text-lg">1</span>
            </div>
            <p class="mt-3 text-xs/5 text-muted">
              换一个调，实际琴键会改变；“回到 1”的感觉保持不变。
            </p>
          </div>
        </div>

        <form class="space-y-6" @submit.prevent="enterModule">
          <fieldset>
            <legend class="mb-3 text-sm font-bold text-muted">
              选择模块
            </legend>
            <div class="grid gap-3">
              <label class="flex min-h-20 cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 p-4 has-focus-visible:outline-2 has-focus-visible:outline-brand" :class="selectedModule === 'learn' ? 'border-brand bg-brand-soft' : 'border-line hover:border-brand/30'">
                <span>
                  <strong class="block text-base">学习</strong>
                  <span class="mt-1 block text-xs/5 text-muted">理解相对音高、主音和十二调中的“1”</span>
                </span>
                <input v-model="selectedModule" type="radio" name="module" value="learn" class="size-4 accent-brand">
              </label>
              <label class="flex min-h-20 cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 p-4 has-focus-visible:outline-2 has-focus-visible:outline-brand" :class="selectedModule === 'practice' ? 'border-brand bg-brand-soft' : 'border-line hover:border-brand/30'">
                <span>
                  <strong class="block text-base">练习</strong>
                  <span class="mt-1 block text-xs/5 text-muted">先从十二调的主音感训练开始</span>
                </span>
                <input v-model="selectedModule" type="radio" name="module" value="practice" class="size-4 accent-brand">
              </label>
            </div>
          </fieldset>

          <fieldset :disabled="selectedModule !== 'practice'" :class="selectedModule !== 'practice' ? 'opacity-45' : ''">
            <legend class="mb-3 text-sm font-bold text-muted">
              练习长度
            </legend>
            <div class="grid grid-cols-2 gap-3">
              <label v-for="mode in (['fixed', 'infinite'] as const)" :key="mode" class="flex min-h-16 cursor-pointer items-center justify-between gap-2 rounded-2xl border-2 p-4 text-sm font-extrabold has-focus-visible:outline-2 has-focus-visible:outline-brand" :class="practiceMode === mode ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line'">
                {{ mode === 'fixed' ? '10 题' : '自由练习 ∞' }}
                <input v-model="practiceMode" type="radio" name="mode" :value="mode" class="size-4 accent-brand">
              </label>
            </div>
          </fieldset>

          <button type="submit" class="min-h-14 w-full rounded-2xl bg-brand text-base font-extrabold text-white hover:bg-brand-dark">
            进入模块 →
          </button>
        </form>
      </section>
    </main>
  </div>
</template>
