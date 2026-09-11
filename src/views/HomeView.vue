<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { pianoTool } from '@/tools/catalog'

interface Stage {
  step: string
  title: string
  description: string
  progress: number
  lessons: string
  tone: 'green' | 'yellow' | 'blue' | 'purple'
  status: 'continue' | 'ready' | 'locked'
}

const notice = ref('')
const router = useRouter()

const navItems = [
  { id: 'path', label: '学习路径' },
  { id: 'practice', label: '专项训练' },
  { id: 'tools', label: '音乐工具' },
  { id: 'records', label: '学习记录' },
  { id: 'settings', label: '设置' },
] as const

function handleNavigation(item: typeof navItems[number]) {
  if (item.id === 'tools') {
    void router.push({ name: pianoTool.routeName })
    return
  }
  if (item.id !== 'path') {
    showNotice(`${item.label}模块将在后续版本开放`)
  }
}

const stages: Stage[] = [
  {
    step: '01',
    title: '唱名与简谱',
    description: '建立 1–7 与 do–si 的快速映射',
    progress: 80,
    lessons: '4 / 5 课',
    tone: 'green',
    status: 'continue',
  },
  {
    step: '02',
    title: '认识钢琴键位',
    description: '认识黑白键与十二音，练习音名序列',
    progress: 35,
    lessons: '2 / 6 课',
    tone: 'yellow',
    status: 'continue',
  },
  {
    step: '03',
    title: 'C 大调综合映射',
    description: '固定 C 大调，连接 1–7 与七个白键',
    progress: 0,
    lessons: '双向练习 · 单音 / 序列',
    tone: 'blue',
    status: 'ready',
  },
  {
    step: '04',
    title: '自然大调',
    description: '理解音阶公式，并迁移到十二个主音',
    progress: 0,
    lessons: '共 13 课',
    tone: 'purple',
    status: 'ready',
  },
  {
    step: '05',
    title: '相对音高',
    description: '先找到主音 1，再逐步听懂旋律',
    progress: 0,
    lessons: '学习 + 练习',
    tone: 'blue',
    status: 'ready',
  },
]

const toneClasses = {
  green: {
    bubble: 'bg-[#dff1e6] text-brand',
    bar: 'bg-brand',
    icon: 'bg-[#edf7f1] text-brand',
  },
  yellow: {
    bubble: 'bg-[#fff0bd] text-[#9a6500]',
    bar: 'bg-[#eba922]',
    icon: 'bg-[#fff8df] text-[#b47700]',
  },
  blue: {
    bubble: 'bg-[#dfeef6] text-[#32718f]',
    bar: 'bg-[#4e91ae]',
    icon: 'bg-[#edf6fa] text-[#32718f]',
  },
  purple: {
    bubble: 'bg-[#ece6f5] text-[#756294]',
    bar: 'bg-[#8c77aa]',
    icon: 'bg-[#f4f0f9] text-[#756294]',
  },
}

function showNotice(message: string) {
  notice.value = message
  window.setTimeout(() => {
    notice.value = ''
  }, 2600)
}

function startSolfegePractice() {
  void router.push({ name: 'solfege' })
}

function handleStageAction(stage: Stage) {
  if (stage.step === '03') {
    void router.push({ name: 'c-major' })
    return
  }

  if (stage.step === '05') {
    void router.push({ name: 'relative-pitch-home' })
    return
  }

  if (stage.step === '04') {
    void router.push({ name: 'scale-learn' })
    return
  }

  if (stage.step === '02') {
    void router.push({ name: 'keyboard' })
    return
  }

  if (stage.step === '01') {
    startSolfegePractice()
    return
  }

  showNotice(stage.status === 'ready' ? `即将开始：${stage.title}` : `继续学习：${stage.title}`)
}
</script>

<template>
  <div class="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
    <aside class="hidden border-r border-line bg-white lg:flex lg:min-h-screen lg:flex-col lg:px-5 lg:py-7">
      <RouterLink :to="{ name: 'home' }" class="flex items-center gap-3 px-3" aria-label="音阶阶首页">
        <span class="grid size-10 place-items-center rounded-[14px] bg-brand text-white shadow-sm">
          <svg viewBox="0 0 24 24" class="size-6" aria-hidden="true">
            <path d="M7 18.2V6.7l10-2.2v11.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="5" cy="18" r="2.5" fill="currentColor" />
            <circle cx="15" cy="16" r="2.5" fill="currentColor" />
          </svg>
        </span>
        <span>
          <strong class="block text-[19px] font-extrabold tracking-tight">音阶阶</strong>
          <span class="block text-[10px] font-bold tracking-[0.16em] text-muted">EAR TRAINING</span>
        </span>
      </RouterLink>

      <nav class="mt-11 space-y-2" aria-label="主导航">
        <button
          v-for="(item, index) in navItems"
          :key="item.id"
          type="button"
          class="flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-left text-[14px] font-bold transition-colors"
          :class="index === 0 ? 'bg-brand-soft text-brand-dark' : 'text-muted hover:bg-canvas hover:text-ink'"
          :aria-current="index === 0 ? 'page' : undefined"
          @click="handleNavigation(item)"
        >
          <svg v-if="index === 0" viewBox="0 0 24 24" class="size-5" aria-hidden="true"><path d="M4 5.5h6.5v13H4zM13.5 5.5H20v13h-6.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" /><path d="M7.2 9h.1M16.7 9h.1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg>
          <svg v-else-if="index === 1" viewBox="0 0 24 24" class="size-5" aria-hidden="true"><path d="M5 4v16M5 8h5v12M10 5h5v15M15 10h4v10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" /></svg>
          <svg v-else-if="item.id === 'tools'" viewBox="0 0 24 24" class="size-5" aria-hidden="true"><path d="M3 7h18v11H3zM6 7v7m4-7v7m4-7v7m4-7v7M5 14V7h2v7m2 0V7h2v7m2 0V7h2v7m2 0V7h2v7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /></svg>
          <svg v-else-if="item.id === 'records'" viewBox="0 0 24 24" class="size-5" aria-hidden="true"><path d="M5 19V9m7 10V5m7 14v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
          <svg v-else viewBox="0 0 24 24" class="size-5" aria-hidden="true"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4L17 7m-10 10-1.4 1.4m12.8 0L17 17M7 7 5.6 5.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
          {{ item.label }}
        </button>
      </nav>

      <div class="mt-auto rounded-3xl bg-[#f1f5e6] p-5">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-xs font-extrabold text-brand-dark">本周目标</span>
          <span class="text-xs font-bold text-brand">3 / 5 天</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-white">
          <div class="h-full w-3/5 rounded-full bg-lime" />
        </div>
        <p class="mt-3 text-xs/5 text-muted">
          再练习 2 天，保持你的学习节奏
        </p>
      </div>
    </aside>

    <div class="min-w-0">
      <header class="sticky top-0 z-30 border-b border-line/80 bg-white/90 backdrop-blur-lg lg:bg-canvas/90">
        <div class="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 sm:px-6 lg:h-[72px] lg:px-10 xl:px-12">
          <RouterLink :to="{ name: 'home' }" class="flex items-center gap-2.5 lg:hidden" aria-label="音阶阶首页">
            <span class="grid size-9 place-items-center rounded-xl bg-brand text-white">
              <svg viewBox="0 0 24 24" class="size-5" aria-hidden="true"><path d="M7 18.2V6.7l10-2.2v11.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /><circle cx="5" cy="18" r="2.5" fill="currentColor" /><circle cx="15" cy="16" r="2.5" fill="currentColor" /></svg>
            </span>
            <strong class="text-[18px] font-extrabold tracking-tight">音阶阶</strong>
          </RouterLink>
          <div class="hidden lg:block">
            <p class="text-xs font-bold text-muted">
              2026 年 9 月 3 日 · 星期四
            </p>
          </div>
          <div class="flex items-center gap-2 sm:gap-3">
            <button type="button" class="grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-white hover:text-ink" aria-label="通知" @click="showNotice('今天没有新的通知')">
              <svg viewBox="0 0 24 24" class="size-5" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" /><path d="M10 21h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
            </button>
            <button type="button" class="flex min-h-11 items-center gap-2 rounded-full border border-line bg-white p-1.5 pr-2 sm:pr-3" @click="showNotice('个人中心将在后续版本开放')">
              <span class="grid size-8 place-items-center rounded-full bg-[#f4d6a7] text-sm font-extrabold text-[#67492b]">乐</span>
              <span class="hidden text-sm font-bold sm:inline">学习者</span>
              <svg viewBox="0 0 16 16" class="hidden size-3.5 text-muted sm:block" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" class="mx-auto max-w-[1240px] px-4 pt-7 pb-28 sm:px-6 sm:pt-9 lg:px-10 lg:pt-10 lg:pb-12 xl:px-12">
        <section class="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="mb-2 text-sm font-extrabold text-brand">
              早上好，继续前进吧
            </p>
            <h1 class="text-[28px] leading-tight font-extrabold tracking-[-0.035em] sm:text-4xl">
              今天想练点什么？
            </h1>
            <p class="mt-2 max-w-xl text-sm/6 text-muted sm:text-[15px]">
              每天 5 分钟，让唱名、键位和声音慢慢连成一张地图。
            </p>
          </div>
          <div class="flex items-center gap-2 text-sm font-bold text-muted">
            <span class="grid size-8 place-items-center rounded-full bg-[#fff4d2] text-[#b87900]">🔥</span>
            已连续学习 <strong class="text-ink">6 天</strong>
          </div>
        </section>

        <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div class="min-w-0 space-y-7">
            <section class="relative isolate overflow-hidden rounded-[28px] bg-brand p-5 text-white shadow-card sm:p-7 md:p-8" aria-labelledby="recommended-title">
              <div class="pointer-events-none absolute -top-20 -right-12 -z-10 size-64 rounded-full border-42 border-white/6" />
              <div class="pointer-events-none absolute right-24 -bottom-24 -z-10 size-48 rounded-full bg-[#3e916f]/50 blur-2xl" />
              <div class="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
                <div class="max-w-lg">
                  <div class="mb-5 flex items-center gap-2">
                    <span class="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-extrabold tracking-wide">今日推荐 · 约 5 分钟</span>
                  </div>
                  <p class="mb-2 text-sm font-bold text-white/70">
                    阶段 1 · 第 5 课
                  </p>
                  <h2 id="recommended-title" class="text-2xl font-extrabold tracking-tight sm:text-[30px]">
                    唱名记忆训练
                  </h2>
                  <p class="mt-3 text-sm/6 text-white/75">
                    从单项到 12 项序列，双向练习唱名与简谱转换。完成本课即可开启阶段检测。
                  </p>
                  <button type="button" class="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-lime px-6 text-sm font-extrabold text-[#24310d] shadow-[0_6px_18px_rgb(15_42_28/0.18)] transition hover:-translate-y-0.5 hover:bg-[#e1f176] sm:w-auto" @click="startSolfegePractice">
                    开始训练
                    <svg viewBox="0 0 20 20" class="size-4" aria-hidden="true"><path d="m7 4 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  </button>
                </div>

                <div class="mx-auto w-full max-w-[250px] md:mx-0 md:w-[230px]">
                  <div class="relative aspect-[1.45] rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                    <div class="flex h-full gap-1.5 rounded-xl bg-[#f7f8f4] p-2 pb-3">
                      <div v-for="key in 7" :key="key" class="relative flex-1 rounded-b-md bg-white shadow-[0_3px_0_#d6ddd8]">
                        <span v-if="[1, 2, 4, 5, 6].includes(key)" class="absolute top-0 right-[-36%] z-10 h-[58%] w-[62%] rounded-b-md bg-[#203128] shadow-sm" />
                        <span v-if="key === 1" class="absolute inset-x-0 bottom-1 text-center text-[10px] font-extrabold text-brand">do</span>
                        <span v-if="key === 3" class="absolute inset-x-0 bottom-1 text-center text-[10px] font-extrabold text-brand">mi</span>
                        <span v-if="key === 5" class="absolute inset-x-0 bottom-1 text-center text-[10px] font-extrabold text-brand">sol</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section aria-labelledby="path-title">
              <div class="mb-4 flex items-center justify-between">
                <div>
                  <h2 id="path-title" class="text-xl font-extrabold tracking-tight sm:text-2xl">
                    你的学习路径
                  </h2>
                  <p class="mt-1 text-sm text-muted">
                    按顺序建立稳固的音高认知
                  </p>
                </div>
                <button type="button" class="hidden min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-extrabold text-brand hover:bg-brand-soft sm:flex" @click="showNotice('共 9 个学习阶段')">
                  查看全部
                  <svg viewBox="0 0 16 16" class="size-4" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </button>
              </div>

              <div class="grid gap-3 md:grid-cols-2">
                <article v-for="stage in stages" :key="stage.step" class="group rounded-[22px] border border-line bg-white p-4 shadow-[0_1px_2px_rgb(23_34_29/0.03)] transition sm:p-5" :class="stage.status === 'locked' ? 'opacity-70' : 'hover:-translate-y-0.5 hover:shadow-card'">
                  <div class="flex items-start gap-3.5">
                    <div class="grid size-12 shrink-0 place-items-center rounded-2xl font-extrabold" :class="toneClasses[stage.tone].icon">
                      <svg v-if="stage.step === '01'" viewBox="0 0 24 24" class="size-6" aria-hidden="true"><path d="M8 17V6l9-2v11" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" /><circle cx="6" cy="17" r="2.3" fill="currentColor" /><circle cx="15" cy="15" r="2.3" fill="currentColor" /></svg>
                      <svg v-else-if="stage.step === '02'" viewBox="0 0 24 24" class="size-6" aria-hidden="true"><path d="M3 6h18v13H3z" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="M7 6v8m5-8v8m5-8v8M5.5 14V6h3v8m2 0V6h3v8m2 0V6h3v8" fill="none" stroke="currentColor" stroke-width="1.5" /></svg>
                      <svg v-else-if="stage.step === '03'" viewBox="0 0 24 24" class="size-6" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
                      <svg v-else-if="stage.step === '04'" viewBox="0 0 24 24" class="size-6" aria-hidden="true"><path d="M4 18 9 9l3 5 3-8 5 12H4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" /></svg>
                      <svg v-else viewBox="0 0 24 24" class="size-6" aria-hidden="true"><path d="M4 12h2m2.5-4v8m3.5-11v14m3.5-11v8m2.5-4h2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" /></svg>
                    </div>

                    <div class="min-w-0 flex-1">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-[11px] font-extrabold tracking-[0.12em] text-muted">阶段 {{ stage.step }}</span>
                        <span v-if="stage.status === 'ready'" class="rounded-full px-2.5 py-1 text-[10px] font-extrabold" :class="toneClasses[stage.tone].bubble">待开始</span>
                        <svg v-if="stage.status === 'locked'" viewBox="0 0 20 20" class="size-4 text-muted" aria-label="未解锁"><rect x="5" y="9" width="10" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" /><path d="M7.5 9V7a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" stroke-width="1.6" /></svg>
                      </div>
                      <h3 class="mt-1 text-[16px] font-extrabold">
                        {{ stage.title }}
                      </h3>
                      <p class="mt-1 text-xs/5 text-muted">
                        {{ stage.description }}
                      </p>

                      <div class="mt-4 flex items-center gap-3">
                        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eef0ed]">
                          <div class="h-full rounded-full" :class="toneClasses[stage.tone].bar" :style="{ width: `${stage.progress}%` }" />
                        </div>
                        <span class="shrink-0 text-[11px] font-bold text-muted">{{ stage.lessons }}</span>
                      </div>
                    </div>
                  </div>

                  <div v-if="stage.step === '04' || stage.step === '05'" class="mt-4 grid grid-cols-2 gap-2">
                    <RouterLink :to="{ name: stage.step === '04' ? 'scale-learn' : 'relative-pitch-learn' }" class="grid min-h-11 place-items-center rounded-xl border border-line text-xs font-extrabold transition-colors hover:border-brand/30 hover:bg-brand-soft hover:text-brand-dark">
                      开始学习
                    </RouterLink>
                    <RouterLink :to="{ name: stage.step === '04' ? 'scale-practice' : 'relative-pitch-practice', query: stage.step === '05' ? { mode: 'fixed' } : {} }" class="grid min-h-11 place-items-center rounded-xl bg-brand text-xs font-extrabold text-white transition-colors hover:bg-brand-dark">
                      开始练习
                    </RouterLink>
                  </div>
                  <button v-else-if="stage.status !== 'locked'" type="button" class="mt-4 min-h-11 w-full rounded-xl border border-line text-xs font-extrabold transition-colors hover:border-brand/30 hover:bg-brand-soft hover:text-brand-dark" @click="handleStageAction(stage)">
                    {{ stage.step === '03' ? '开始练习' : stage.status === 'ready' ? '开始学习' : '继续学习' }}
                  </button>
                </article>
              </div>
            </section>
          </div>

          <aside class="space-y-5" aria-label="学习概览">
            <section class="rounded-[24px] border border-line bg-white p-5 shadow-[0_1px_2px_rgb(23_34_29/0.03)]">
              <div class="flex items-center justify-between">
                <h2 class="text-base font-extrabold">
                  本周学习
                </h2>
                <span class="text-xs font-bold text-muted">9月 1–7日</span>
              </div>
              <div class="mt-5 flex items-end justify-between gap-2" aria-label="本周学习天数图表">
                <div v-for="(day, index) in ['一', '二', '三', '四', '五', '六', '日']" :key="day" class="flex flex-1 flex-col items-center gap-2">
                  <div class="flex h-20 w-full max-w-6 items-end rounded-full bg-[#eff1ee] p-[3px]">
                    <div class="w-full rounded-full" :class="index < 3 ? 'bg-brand' : index === 3 ? 'bg-lime' : 'bg-transparent'" :style="{ height: index < 3 ? `${[45, 72, 55][index]}%` : index === 3 ? '32%' : '0%' }" />
                  </div>
                  <span class="text-[10px] font-bold" :class="index === 3 ? 'text-ink' : 'text-muted'">{{ day }}</span>
                </div>
              </div>
              <div class="mt-5 grid grid-cols-2 divide-x divide-line rounded-2xl bg-canvas py-3">
                <div class="text-center">
                  <strong class="block text-lg font-extrabold">42</strong>
                  <span class="text-[11px] font-bold text-muted">本周答题</span>
                </div>
                <div class="text-center">
                  <strong class="block text-lg font-extrabold">86%</strong>
                  <span class="text-[11px] font-bold text-muted">正确率</span>
                </div>
              </div>
            </section>

            <section class="rounded-[24px] bg-[#fff6da] p-5">
              <div class="flex gap-3.5">
                <span class="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/80 text-lg">💡</span>
                <div>
                  <h2 class="text-sm font-extrabold">
                    今日小贴士
                  </h2>
                  <p class="mt-1.5 text-xs/5 text-[#756b50]">
                    练习时先唱出答案再点击，能帮助耳朵更快记住音级关系。
                  </p>
                </div>
              </div>
            </section>

            <section class="rounded-[24px] border border-line bg-white p-5">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-bold text-muted">
                    当前掌握度
                  </p>
                  <p class="mt-1 text-2xl font-extrabold">
                    12%
                  </p>
                </div>
                <div class="relative grid size-16 place-items-center rounded-full" style="background: conic-gradient(#1f7a55 0 12%, #edf0ed 12% 100%)">
                  <div class="grid size-12 place-items-center rounded-full bg-white text-xs font-extrabold text-brand">
                    1 / 9
                  </div>
                </div>
              </div>
              <p class="mt-3 border-t border-line pt-3 text-xs/5 text-muted">
                已掌握唱名基础，下一目标是完成阶段检测。
              </p>
            </section>
          </aside>
        </div>
      </main>

      <nav class="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white/95 px-1 pt-2 backdrop-blur-lg lg:hidden" aria-label="移动端导航">
        <button v-for="(item, index) in navItems" :key="item.id" type="button" class="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-extrabold" :class="index === 0 ? 'text-brand' : 'text-muted'" :aria-current="index === 0 ? 'page' : undefined" @click="handleNavigation(item)">
          <svg v-if="index === 0" viewBox="0 0 24 24" class="size-5" aria-hidden="true"><path d="M4 5.5h6.5v13H4zM13.5 5.5H20v13h-6.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" /></svg>
          <svg v-else-if="index === 1" viewBox="0 0 24 24" class="size-5" aria-hidden="true"><path d="M5 4v16M5 8h5v12M10 5h5v15M15 10h4v10" fill="none" stroke="currentColor" stroke-width="1.8" /></svg>
          <svg v-else-if="item.id === 'tools'" viewBox="0 0 24 24" class="size-5" aria-hidden="true"><path d="M3 7h18v11H3zM6 7v7m4-7v7m4-7v7m4-7v7" fill="none" stroke="currentColor" stroke-width="1.7" /></svg>
          <svg v-else-if="item.id === 'records'" viewBox="0 0 24 24" class="size-5" aria-hidden="true"><path d="M5 19V9m7 10V5m7 14v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
          <svg v-else viewBox="0 0 24 24" class="size-5" aria-hidden="true"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="M12 3v2m0 14v2m9-9h-2M5 12H3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
          {{ item.label }}
        </button>
      </nav>

      <Transition enter-active-class="transition duration-200" enter-from-class="translate-y-2 opacity-0" leave-active-class="transition duration-150" leave-to-class="translate-y-2 opacity-0">
        <div v-if="notice" class="fixed bottom-24 left-1/2 z-50 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full bg-ink px-4 py-2.5 text-center text-xs font-bold text-white shadow-xl lg:bottom-8" role="status">
          {{ notice }}
        </div>
      </Transition>
    </div>
  </div>
</template>
