<template>
  <div class="login-page">
    <div class="login-card">
      <div class="logo-wrap">
        <div class="logo-glow logo-glow-1"></div>
        <div class="logo-glow logo-glow-2"></div>
        <img :src="logo" alt="O'Connors AI" class="logo" />
      </div>

      <h1 class="title">Sign in to O'connors AI</h1>
      <p class="subtitle">Access your intelligent document assistant</p>

      <button class="microsoft-btn" @click="handleMicrosoftLogin">
        <img :src="microsoftLogo" alt="Microsoft" class="ms-icon" />
        <span>Sign in with Microsoft</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'
import { useUserStore } from '@/stores/userStore'

import logo from '@/assets/logo.png'
import microsoftLogo from '@/assets/microsoft-logo.png'

const router = useRouter()
const userStore = useUserStore()

async function handleMicrosoftLogin() {
  await authService.login()
}

onMounted(() => {
  if (userStore.account) {
    router.push('/chat')
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: 'Inter', sans-serif;
  background:
    radial-gradient(circle at center, rgba(0, 102, 255, 0.07) 0%, transparent 38%),
    linear-gradient(180deg, #04060c 0%, #02040a 100%);
}

.login-card {
  width: 100%;
  max-width: 540px;
  padding: 44px 36px 28px;
  border-radius: 30px;
  text-align: center;
  background: linear-gradient(180deg, rgba(8, 14, 28, 0.96), rgba(5, 10, 22, 0.98));
  border: 1px solid rgba(73, 120, 255, 0.14);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.02) inset,
    0 0 45px rgba(24, 88, 255, 0.12),
    0 18px 60px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(10px);
}

.logo-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  margin: 0 auto 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-glow {
  position: absolute;
  border-radius: 50%;
  background: rgba(54, 116, 255, 0.14);
  animation: heartbeatGlow 2.2s infinite ease-in-out;
}

.logo-glow-1 {
  width: 78px;
  height: 78px;
}

.logo-glow-2 {
  width: 104px;
  height: 104px;
  animation-delay: 0.35s;
}

.logo {
  position: relative;
  z-index: 2;
  width: 66px;
  height: 66px;
  object-fit: contain;
  filter: drop-shadow(0 0 18px rgba(59, 130, 246, 0.38));
}

.title {
  margin: 0 0 10px;
  font-size: 31px;
  line-height: 1.15;
  font-weight: 700;
  color: #f8fbff;
}

.subtitle {
  margin: 0 0 34px;
  color: #95a1ba;
  font-size: 16px;
  line-height: 1.5;
}

.microsoft-btn {
  width: 100%;
  height: 72px;
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 22px;
  background: rgba(34, 37, 45, 0.92);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease;
  box-shadow:
    0 0 22px rgba(37, 99, 235, 0.14),
    inset 0 0 0 1px rgba(255, 255, 255, 0.015);
}

.microsoft-btn:hover {
  transform: translateY(-1px) scale(1.015);
  border-color: rgba(59, 130, 246, 0.6);
  background: rgba(38, 42, 52, 0.98);
  box-shadow:
    0 0 30px rgba(37, 99, 235, 0.22),
    inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.microsoft-btn:active {
  transform: scale(0.995);
}

.ms-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

@keyframes heartbeatGlow {
  0% {
    transform: scale(0.92);
    opacity: 0.22;
  }
  25% {
    transform: scale(1.02);
    opacity: 0.38;
  }
  45% {
    transform: scale(0.97);
    opacity: 0.26;
  }
  65% {
    transform: scale(1.08);
    opacity: 0.42;
  }
  100% {
    transform: scale(1.22);
    opacity: 0;
  }
}

@media (max-width: 640px) {
  .login-card {
    max-width: 100%;
    padding: 36px 22px 22px;
    border-radius: 24px;
  }

  .title {
    font-size: 24px;
  }

  .subtitle {
    font-size: 14px;
    margin-bottom: 26px;
  }

  .microsoft-btn {
    height: 62px;
    border-radius: 18px;
    font-size: 15px;
  }

  .logo-wrap {
    width: 84px;
    height: 84px;
  }

  .logo {
    width: 58px;
    height: 58px;
  }
}
</style>