<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService, msalInstance } from '@/services/authService'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const userStore = useUserStore()

onMounted(async () => {
  try {
    const response = await authService.initialize()
    if (response?.account) {
      // User just returned from Microsoft redirect login
      userStore.setAccount(response.account)
      await authService.getToken()
      router.push('/')
      return
    }
    // Restore an existing session (e.g. after a page refresh)
    const accounts = msalInstance.getAllAccounts()
    if (accounts.length > 0 && accounts[0]) {
      userStore.setAccount(accounts[0])
      await authService.getToken()
    }
  } catch (error) {
    console.error('Auth initialization error:', error)
  }
})
</script>

<style>
/* Global styles like fonts */
body {
  margin: 0;
  font-family: sans-serif;
}
</style>