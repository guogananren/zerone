import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/home/index.vue'),
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('@/pages/chat/index.vue'),
    },
  ],
})

export default router
