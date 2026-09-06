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
