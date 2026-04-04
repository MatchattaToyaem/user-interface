<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const userStore = useUserStore()
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
    isLoading.value = true
    errorMessage.value = ''

    try {
        const account = await authService.login()
        // If already logged in (no redirect needed), navigate directly
        const token = await authService.getToken()
        if (account) {
            userStore.setAccount(account)
            router.push('/')
        }
        // Otherwise loginRedirect was called and the page is navigating away
    } catch (error: any) {
        errorMessage.value = 'Failed to sign in. Please try again.'
        console.error(error)
        isLoading.value = false
    }
}
</script>

<template>
    <div class="vh-100 d-flex align-items-center justify-content-center">
        <div class="card text-center p-4 shadow justify-content-center"
            style="width: 100%; max-width: 400px; border-radius: 15px;">
            <img src="/logo.png" alt="Microsoft Logo" class="mb-4 mx-auto d-block" style="width: 80px;">
            <h2 class="mb-4">Welcome to O'Connors AI Platform</h2>
            <p class="mb-4">Please sign in with your Microsoft account to continue.</p>
            <button class="btn btn-primary" @click="handleLogin" :disabled="isLoading">
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                <template v-if="isLoading">Signing in...</template>
                <template v-else><i class="bi bi-microsoft me-2"></i>Sign in with Microsoft</template>
            </button>
            <p v-if="errorMessage" class="text-danger mt-3">{{ errorMessage }}</p>
        </div>
    </div>
</template>