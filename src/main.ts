import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import { authService, msalInstance } from './services/authService'
import { useUserStore } from './stores/userStore'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

async function startApp() {
  await authService.initialize()

  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)

  const userStore = useUserStore()
  const accounts = msalInstance.getAllAccounts()

  if (accounts.length > 0) {
    userStore.setAccount(accounts[0] ?? null)
  } else {
    userStore.setAccount(null)
  }

  app.mount('#app')
}

startApp()