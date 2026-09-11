import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: '音阶阶 · 乐理与音高训练' },
    },
    {
      path: '/solfege',
      name: 'solfege',
      component: () => import('@/views/SolfegePracticeView.vue'),
      meta: { title: '唱名记忆训练 · 音阶阶' },
    },
    {
      path: '/keyboard',
      name: 'keyboard',
      component: () => import('@/views/KeyboardPracticeView.vue'),
      meta: { title: '钢琴键位训练 · 音阶阶' },
    },
    {
      path: '/c-major',
      name: 'c-major',
      component: () => import('@/views/CmajorPracticeView.vue'),
      meta: { title: '简谱与琴键 · 音阶阶' },
    },
    {
      path: '/scales/learn',
      name: 'scale-learn',
      component: () => import('@/views/MajorScaleLearnView.vue'),
      meta: { title: '自然大调学习 · 音阶阶' },
    },
    {
      path: '/scales/practice',
      name: 'scale-practice',
      component: () => import('@/views/MajorScalePracticeView.vue'),
      meta: { title: '自然大调练习 · 音阶阶' },
    },
    {
      path: '/ear',
      name: 'relative-pitch-home',
      component: () => import('@/views/RelativePitchHomeView.vue'),
      meta: { title: '相对音高 · 音阶阶' },
    },
    {
      path: '/ear/learn',
      name: 'relative-pitch-learn',
      component: () => import('@/views/RelativePitchLearnView.vue'),
      meta: { title: '相对音高学习 · 音阶阶' },
    },
    {
      path: '/ear/practice',
      name: 'relative-pitch-practice',
      component: () => import('@/views/RelativePitchPracticeView.vue'),
      meta: { title: '相对音高练习 · 音阶阶' },
    },
    {
      path: '/ear/practice/tonic',
      name: 'relative-pitch-tonic',
      component: () => import('@/views/RelativePitchTonicPracticeView.vue'),
      meta: { title: '主音感训练 · 音阶阶' },
    },
    {
      path: '/ear/practice/degree',
      name: 'relative-pitch-degree',
      component: () => import('@/views/RelativePitchDegreePracticeView.vue'),
      meta: { title: '核心音级听辨 · 音阶阶' },
    },
    {
      path: '/tools/piano',
      name: 'tool-piano',
      component: () => import('@/views/tools/PianoToolView.vue'),
      meta: { title: '自由钢琴 · 音阶阶音乐工具' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  document.title = typeof to.meta.title === 'string' ? to.meta.title : '音阶阶'
})

export default router
