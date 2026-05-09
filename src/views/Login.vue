<template>
  <div class="login-page">
    <div class="login-container">
      <!-- LEFT PANEL -->
      <div class="left-panel">
        <div>
          <div class="brand">
            <div class="brand-logo-box small static-logo">
              <img :src="mainLogo" alt="O'Connors AI" />
            </div>

            <span class="brand-name">O'Connors AI</span>
          </div>

          <div class="hero-content">
            <h1>
              Your Intelligent
              <br />
              AI Assistant
            </h1>

            <p>
              Access intelligent automation tools, document intelligence,
              real-time assistance, and enterprise-grade AI workflows.
            </p>
          </div>
        </div>

        <div class="feature-list">
          <div class="feature-item">
            <div class="feature-icon">
              <i class="bi bi-file-earmark-text"></i>
            </div>

            <div>
              <h3>Document Intelligence</h3>
              <p>Query thousands of documents instantly</p>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon">
              <i class="bi bi-chat-dots"></i>
            </div>

            <div>
              <h3>Real-Time Assistance</h3>
              <p>Get answers while you work</p>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon">
              <i class="bi bi-shield-check"></i>
            </div>

            <div>
              <h3>Secure & Private</h3>
              <p>Enterprise-grade security</p>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT PANEL -->
      <div class="right-panel">
        <div class="signin-box">
          <div class="brand-logo-wrap large animated-logo">
            <div class="brand-logo-pulse"></div>

            <div class="brand-logo-box large">
              <img :src="mainLogo" alt="O'Connors AI" />
            </div>
          </div>

          <h2>Sign in to O'Connors AI</h2>

          <p class="signin-subtitle">
            Access your intelligent enterprise assistant
          </p>

          <button class="microsoft-btn" @click="handleMicrosoftLogin">
            <img :src="microsoftLogo" alt="Microsoft" class="microsoft-icon" />
            <span>Sign in with Microsoft</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { authService } from '@/services/authService'
import { useUserStore } from '@/stores/userStore'

import mainLogo from '@/assets/oconnors-logo.png'
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
  padding: 22px;
  overflow: hidden;
  position: relative;
  font-family: 'Inter', sans-serif;

  background:
    radial-gradient(circle at center, rgba(11, 90, 156, 0.055) 0%, transparent 35%),
    linear-gradient(180deg, #05070d 0%, #03050a 100%);
}

.login-container {
  position: relative;
  z-index: 2;

  width: 100%;
  max-width: 1160px;

  height: 80vh;
  min-height: 620px;
  max-height: 720px;

  border-radius: 24px;
  overflow: hidden;

  display: grid;
  grid-template-columns: 1fr 0.92fr;

  background: #070a12;

  border: 1px solid rgba(11, 90, 156, 0.14);

  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 70px rgba(11, 90, 156, 0.08);
}

/* LEFT */

.left-panel {
  padding: 38px 42px 34px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  background:
    radial-gradient(circle at 30% 20%, rgba(11, 90, 156, 0.14), transparent 42%),
    linear-gradient(180deg, #10172b 0%, #080d1b 100%);

  border-right: 1px solid rgba(11, 90, 156, 0.12);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo-wrap {
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-logo-wrap.large {
  width: 74px;
  height: 74px;

  margin: 0 auto 24px;
}

.brand-logo-pulse {
  position: absolute;
  inset: -22px;

  border-radius: 50%;

  pointer-events: none;
}

.animated-logo .brand-logo-pulse::before,
.animated-logo .brand-logo-pulse::after {
  content: '';

  position: absolute;
  inset: 0;

  border-radius: 50%;

  border: 1px solid rgba(11, 90, 156, 0.34);
  background: rgba(11, 90, 156, 0.06);

  animation: heartbeatRipple 2.6s ease-out infinite;
}

.animated-logo .brand-logo-pulse::after {
  animation-delay: 0.55s;
}

.brand-logo-box {
  position: relative;
  z-index: 2;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgb(11, 90, 156);

  box-shadow:
    0 0 18px rgba(11, 90, 156, 0.34),
    0 0 42px rgba(11, 90, 156, 0.14),
    inset 0 1px 2px rgba(255, 255, 255, 0.16);
}

.brand-logo-box.small {
  width: 44px;
  height: 44px;

  border-radius: 14px;
}

.brand-logo-box.large {
  width: 68px;
  height: 68px;

  border-radius: 22px;
}

.static-logo {
  box-shadow:
    0 0 12px rgba(11, 90, 156, 0.18),
    0 0 26px rgba(11, 90, 156, 0.06),
    inset 0 1px 2px rgba(255, 255, 255, 0.14);
}

.brand-logo-box img {
  object-fit: contain;
}

.brand-logo-box.small img {
  width: 28px;
  height: 28px;
}

.brand-logo-box.large img {
  width: 42px;
  height: 42px;
}

.brand-name {
  color: white;

  font-size: 15px;
  font-weight: 700;

  letter-spacing: -0.2px;
}

/* HERO */

.hero-content {
  margin-top: 54px;
}

.hero-content h1 {
  margin: 0;

  max-width: 560px;

  font-size: 50px;
  line-height: 1.02;

  font-weight: 800;

  letter-spacing: -2.2px;

  background:
    linear-gradient(
      115deg,
      #ffffff 0%,
      #eef3ff 20%,
      #ffffff 40%,
      #c8d7ff 50%,
      #ffffff 60%,
      #eef3ff 80%,
      #ffffff 100%
    );

  background-size: 240% 240%;

  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  animation:
    flowingText 8s ease-in-out infinite,
    shimmerPass 5.5s linear infinite;
}

.hero-content p {
  margin-top: 24px;

  max-width: 500px;

  font-size: 15px;
  line-height: 1.8;

  font-weight: 400;

  letter-spacing: 0.1px;

  color: rgba(255, 255, 255, 0.64);
}

/* FEATURES */

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.feature-icon {
  min-width: 44px;
  width: 44px;
  height: 44px;

  border-radius: 14px;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 17px;

  color: #dce5ff;

  background: rgba(11, 90, 156, 0.08);

  border: 1px solid rgba(11, 90, 156, 0.16);

  box-shadow: 0 0 14px rgba(11, 90, 156, 0.08);
}

.feature-item h3 {
  margin: 0 0 5px;

  color: white;

  font-size: 15px;
  line-height: 1.2;

  font-weight: 700;

  letter-spacing: -0.2px;
}

.feature-item p {
  margin: 0;

  color: rgba(255, 255, 255, 0.58);

  font-size: 13px;
  line-height: 1.5;

  letter-spacing: 0.1px;
}

/* RIGHT */

.right-panel {
  display: flex;
  align-items: center;
  justify-content: center;

  background:
    radial-gradient(circle at center, rgba(11, 90, 156, 0.08), transparent 36%),
    linear-gradient(180deg, #070a12 0%, #03050a 100%);
}

.signin-box {
  width: 100%;
  max-width: 400px;

  text-align: center;

  padding: 20px;
}

.signin-box h2 {
  margin: 0;

  color: white;

  font-size: 30px;
  line-height: 1.18;

  font-weight: 800;

  letter-spacing: -1.2px;
}

.signin-subtitle {
  margin-top: 14px;

  color: rgba(255, 255, 255, 0.5);

  font-size: 14px;
  line-height: 1.7;

  letter-spacing: 0.1px;
}

/* BUTTON */

.microsoft-btn {
  width: 100%;
  height: 60px;

  margin-top: 34px;

  border-radius: 18px;

  border: 1px solid rgba(11, 90, 156, 0.22);

  background: #111827;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  color: white;

  font-size: 16px;
  font-weight: 700;

  letter-spacing: -0.2px;

  cursor: pointer;

  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease;

  box-shadow:
    0 0 18px rgba(11, 90, 156, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.microsoft-btn:hover {
  transform: translateY(-2px);

  background: #151c2f;

  border-color: rgba(11, 90, 156, 0.55);

  box-shadow:
    0 0 34px rgba(11, 90, 156, 0.28),
    inset 0 0 0 1px rgba(255, 255, 255, 0.03);
}

.microsoft-btn:active {
  transform: scale(0.99);
}

.microsoft-icon {
  width: 22px;
  height: 22px;
}

/* ANIMATIONS */

@keyframes heartbeatRipple {
  0% {
    transform: scale(0.72);
    opacity: 0;
  }

  12% {
    opacity: 0.62;
  }

  28% {
    transform: scale(1);
    opacity: 0.38;
  }

  45% {
    transform: scale(1.18);
    opacity: 0.16;
  }

  70% {
    transform: scale(1.38);
    opacity: 0;
  }

  100% {
    transform: scale(1.38);
    opacity: 0;
  }
}

@keyframes flowingText {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

@keyframes shimmerPass {
  0% {
    filter: drop-shadow(0 0 0 rgba(11, 90, 156, 0));
  }

  20% {
    filter: drop-shadow(0 0 8px rgba(11, 90, 156, 0.12));
  }

  40% {
    filter: drop-shadow(0 0 0 rgba(11, 90, 156, 0));
  }

  100% {
    filter: drop-shadow(0 0 0 rgba(11, 90, 156, 0));
  }
}

/* MOBILE */

@media (max-width: 980px) {
  .login-container {
    grid-template-columns: 1fr;

    height: auto;
    min-height: auto;
  }

  .left-panel {
    display: none;
  }

  .right-panel {
    min-height: 100vh;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 14px;
  }

  .signin-box {
    padding: 22px;
  }

  .signin-box h2 {
    font-size: 30px;
  }

  .signin-subtitle {
    font-size: 15px;
  }

  .microsoft-btn {
    height: 62px;

    border-radius: 18px;

    font-size: 16px;
  }
}
</style>