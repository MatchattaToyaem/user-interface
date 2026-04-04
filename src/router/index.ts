import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import ChatView from '@/views/Chat.vue'
import LoginView from '@/views/Login.vue' // You'll need a login page too!

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'chat',
      component: ChatView,
      meta: { requiresAuth: true } // Mark this as a protected page
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    }
  ]
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  console.log('Navigation attempt to:', to.fullPath, 'Authenticated:', userStore.isAuthenticated);
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

export default router
