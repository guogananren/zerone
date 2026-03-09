import { createRouter, createWebHistory } from 'vue-router'
import { userInfoStore } from '@/stores/user'

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
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/login/index.vue'),
    },
  ],
})

router.beforeEach((to, from, next) => {
  const store = userInfoStore()
  if (store.getToken || to.path === '/login') {
    next()
  } else {
    next({ path: '/login' })
  }
})

export default router
