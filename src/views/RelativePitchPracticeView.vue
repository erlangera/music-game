<script setup lang="ts">
import type { RelativePitchCategory, RelativePitchMode } from '@/domain/relativePitch'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { relativePitchCategories, relativePitchCategoryCopy } from '@/domain/relativePitch'

const route = useRoute()
const mode = computed<RelativePitchMode>(() => route.query.mode === 'infinite' ? 'infinite' : 'fixed')

const categoryIcons: Record<RelativePitchCategory, string> = {
  tonic: '⌂',
  degree: '1',
  relationship: '↗',
  dictation: '♫',
}

function isAvailable(category: RelativePitchCategory) {
  return category === 'tonic' || category === 'degree'
}

function practiceRoute(category: RelativePitchCategory) {
  return category === 'degree' ? 'relative-pitch-degree' : 'relative-pitch-tonic'
}
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header class="border-b border-line bg-white">
      <div class="mx-auto grid min-h-20 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-8">
        <RouterLink :to="{ name: 'relative-pitch-home' }" class="flex min-h-11 items-center gap-2 justify-self-start rounded-xl px-2 text-sm font-bold text-muted hover:bg-brand-soft">
          <span aria-hidden="true">‹</span><span class="hidden sm:inline">返回模块</span><span class="sm:hidden">返回</span>
        </RouterLink>
        <div class="text-center">
          <p class="text-sm font-extrabold sm:text-base">
            相对音高 · 练习
          </p>
          <p class="mt-1 text-xs text-muted">
            选择练习
          </p>
        </div>
        <span class="justify-self-end text-xs font-bold text-muted">{{ mode === 'fixed' ? '10 题' : '自由练习' }}</span>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-3 py-8 sm:px-8 sm:py-12">
      <section class="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-9">
        <div class="text-center">
          <p class="text-xs font-extrabold tracking-widest text-brand">
            练习类型
          </p>
          <h1 class="mt-3 text-3xl font-black sm:text-4xl">
            选择练习内容
          </h1>
          <p class="mx-auto mt-4 max-w-2xl text-sm/7 text-muted">
            主音感与核心音级听辨现已开放；先找到“1”，再辨认“1、3、5”。
          </p>
        </div>

        <div class="mt-8 grid gap-4 sm:grid-cols-2">
          <article v-for="category in relativePitchCategories" :key="category" class="rounded-2xl border-2 p-5" :class="isAvailable(category) ? 'border-brand bg-brand-soft' : 'border-line bg-canvas/60'">
            <div class="flex items-start gap-4">
              <span class="grid size-12 shrink-0 place-items-center rounded-2xl text-xl font-black" :class="isAvailable(category) ? 'bg-brand text-white' : 'bg-white text-muted'" aria-hidden="true">{{ categoryIcons[category] }}</span>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-lg font-extrabold">
                    {{ relativePitchCategoryCopy[category].title }}
                  </h2>
                  <span class="rounded-full px-2.5 py-1 text-[10px] font-extrabold" :class="isAvailable(category) ? 'bg-white text-brand-dark' : 'bg-line text-muted'">{{ isAvailable(category) ? '当前可用' : '后续开放' }}</span>
                </div>
                <p class="mt-2 text-sm/6 text-muted">
                  {{ relativePitchCategoryCopy[category].description }}
                </p>
              </div>
            </div>
            <RouterLink v-if="isAvailable(category)" :to="{ name: practiceRoute(category), query: { mode } }" class="mt-5 grid min-h-12 place-items-center rounded-xl bg-brand text-sm font-extrabold text-white hover:bg-brand-dark">
              {{ category === 'tonic' ? '开始找主音 →' : '开始辨音级 →' }}
            </RouterLink>
            <button v-else type="button" class="mt-5 min-h-12 w-full cursor-not-allowed rounded-xl border border-line bg-white text-sm font-extrabold text-muted" disabled>
              尚未开放
            </button>
          </article>
        </div>

        <div class="mt-7 flex flex-wrap items-center justify-center gap-3 border-t border-line pt-6 text-xs text-muted">
          <span>当前长度：{{ mode === 'fixed' ? '固定 10 题' : '自由练习' }}</span>
          <span aria-hidden="true">·</span>
          <RouterLink :to="{ name: 'relative-pitch-home' }" class="min-h-11 rounded-xl p-3 font-extrabold text-brand hover:bg-brand-soft">
            调整长度
          </RouterLink>
        </div>
      </section>
    </main>
  </div>
</template>
