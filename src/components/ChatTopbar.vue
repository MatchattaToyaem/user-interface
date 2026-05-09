<template>
  <header class="topbar" :class="{ introTopbar: showIntro }">
    <div class="topbar-left">
      <h1>Chatbot Assistant</h1>

      <transition name="fade-slide" mode="out-in">
        <span
          :key="aiStatus"
          class="status-pill"
          :class="statusClass"
        >
          <span class="status-dot"></span>
          {{ aiStatus }}
        </span>
      </transition>
    </div>

    <div class="topbar-actions">
      <button class="new-chat-btn" @click="$emit('new-chat')">
        ＋ New Chat
      </button>

      <button
        class="theme-toggle-btn"
        :class="{ lightActive: isLightTheme }"
        @click="$emit('toggle-theme')"
      >
        <div class="theme-scene">
          <div v-if="!isLightTheme" class="day-scene">
            <span class="sun-core">☀</span>

            <div class="cloud cloud-1"></div>
            <div class="cloud cloud-2"></div>
            <div class="cloud cloud-3"></div>
            <div class="cloud cloud-4"></div>

            <div class="hill hill-1"></div>
            <div class="hill hill-2"></div>

            <span class="rabbit rabbit-1">🐇</span>
            <span class="rabbit rabbit-2">🐇</span>
            <span class="rabbit rabbit-3">🐇</span>

            <span class="flower flower-1">✿</span>
            <span class="flower flower-2">✿</span>
            <span class="flower flower-3">✿</span>
            <span class="flower flower-4">✿</span>
          </div>

          <div v-else class="night-scene">
            <span class="moon-core">☾</span>

            <span class="star star-1">✦</span>
            <span class="star star-2">✦</span>
            <span class="star star-3">✦</span>
            <span class="star star-4">✦</span>

            <div class="night-cloud night-cloud-1"></div>
            <div class="night-cloud night-cloud-2"></div>
          </div>
        </div>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  showIntro: boolean
  isConnected: boolean
  isLightTheme: boolean
  aiStatus: string
}>()

defineEmits<{
  (e: 'new-chat'): void
  (e: 'toggle-theme'): void
}>()

const statusClass = computed(() => {
  const status = props.aiStatus.toLowerCase()

  if (!props.isConnected) return 'connecting'
  if (status.includes('thinking')) return 'thinking'
  if (status.includes('searching')) return 'searching'
  if (status.includes('generating')) return 'generating'
  if (status.includes('memory')) return 'memory'

  return 'ready'
})
</script>

<style scoped>
.topbar {
  height: 86px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  background: linear-gradient(90deg, rgba(11, 16, 30, 0.96), rgba(8, 12, 22, 0.78));
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.topbar h1 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: #f5f7fd;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 15px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  transition:
    color 0.28s ease,
    background 0.28s ease,
    border-color 0.28s ease,
    box-shadow 0.28s ease;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: statusPulse 1.45s infinite ease-in-out;
}

.status-pill.ready {
  color: #34d399;
  background: rgba(16, 185, 129, 0.11);
  border: 1px solid rgba(52, 211, 153, 0.26);
  box-shadow: 0 0 18px rgba(16, 185, 129, 0.08);
}

.status-pill.ready .status-dot {
  background: #10b981;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.9);
}

.status-pill.connecting {
  color: #ff5b45;
  background: rgba(255, 91, 69, 0.08);
  border: 1px solid rgba(255, 91, 69, 0.22);
}

.status-pill.connecting .status-dot {
  background: #ff5b45;
  box-shadow: 0 0 10px rgba(255, 91, 69, 0.9);
}

.status-pill.thinking {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.09);
  border: 1px solid rgba(96, 165, 250, 0.25);
  box-shadow: 0 0 18px rgba(96, 165, 250, 0.1);
}

.status-pill.thinking .status-dot {
  background: #60a5fa;
  box-shadow: 0 0 12px rgba(96, 165, 250, 0.9);
}

.status-pill.searching {
  color: #c084fc;
  background: rgba(168, 85, 247, 0.09);
  border: 1px solid rgba(168, 85, 247, 0.25);
  box-shadow: 0 0 18px rgba(168, 85, 247, 0.1);
}

.status-pill.searching .status-dot {
  background: #a855f7;
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.9);
}

.status-pill.generating {
  color: #facc15;
  background: rgba(250, 204, 21, 0.09);
  border: 1px solid rgba(250, 204, 21, 0.25);
  box-shadow: 0 0 18px rgba(250, 204, 21, 0.1);
}

.status-pill.generating .status-dot {
  background: #facc15;
  box-shadow: 0 0 12px rgba(250, 204, 21, 0.9);
}

.status-pill.memory {
  color: #2dd4bf;
  background: rgba(45, 212, 191, 0.09);
  border: 1px solid rgba(45, 212, 191, 0.25);
  box-shadow: 0 0 18px rgba(45, 212, 191, 0.1);
}

.status-pill.memory .status-dot {
  background: #2dd4bf;
  box-shadow: 0 0 12px rgba(45, 212, 191, 0.9);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.new-chat-btn {
  height: 42px;
  padding: 0 22px;
  border-radius: 15px;
  border: 1px solid #2f8cff;
  background: rgba(8, 14, 28, 0.35);
  color: #5da7ff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.22s ease;
}

.new-chat-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 22px rgba(47, 140, 255, 0.22);
  background: rgba(47, 140, 255, 0.08);
}

.theme-toggle-btn {
  position: relative;
  width: 50px;
  height: 46px;
  border-radius: 17px;
  border: 1px solid rgba(47, 140, 255, 0.75);
  background: #07111f;
  cursor: pointer;
  overflow: hidden;
  box-shadow:
    inset 0 0 18px rgba(255, 255, 255, 0.04),
    0 0 18px rgba(47, 140, 255, 0.16);
  transition:
    width 0.38s ease,
    transform 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease;
}

.theme-toggle-btn.lightActive {
  background:
    radial-gradient(circle at center, rgba(96, 165, 250, 0.18), transparent 68%),
    linear-gradient(180deg, #ffffff, #eef4ff);
  border-color: rgba(47, 140, 255, 0.72);
  box-shadow:
    0 0 18px rgba(47, 140, 255, 0.18),
    inset 0 0 14px rgba(47, 140, 255, 0.08);
}

.theme-toggle-btn:hover {
  width: 285px;
  transform: scale(1.02);
  box-shadow:
    0 0 28px rgba(47, 140, 255, 0.28),
    inset 0 0 18px rgba(255, 255, 255, 0.05);
}

.theme-scene,
.day-scene,
.night-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 16px;
}

.sun-core,
.moon-core {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 10;
  transform: translate(-50%, -50%);
  line-height: 1;
}

.sun-core {
  color: #ffd331;
  font-size: 26px;
  text-shadow:
    0 0 12px rgba(255, 211, 49, 0.9),
    0 0 28px rgba(255, 174, 0, 0.38);
}

.moon-core {
  color: #ffffff;
  font-size: 30px;
  font-weight: 700;
  text-shadow:
    0 0 10px rgba(255, 255, 255, 0.95),
    0 0 22px rgba(147, 197, 253, 0.75),
    0 0 42px rgba(96, 165, 250, 0.45);
  filter:
    drop-shadow(0 0 10px rgba(255, 255, 255, 0.9))
    drop-shadow(0 0 24px rgba(96, 165, 250, 0.5));
}

.theme-toggle-btn:hover .sun-core {
  left: 27px;
}

.theme-toggle-btn:hover .moon-core {
  left: 32px;
  transform: translate(-50%, -50%) scale(1.08);
}

.theme-toggle-btn:hover .day-scene {
  background:
    linear-gradient(180deg, #72b2ff 0%, #a9d4ff 44%, #7ac85c 45%, #4ca144 100%);
}

.theme-toggle-btn:hover .night-scene {
  background:
    radial-gradient(circle at 78% 18%, rgba(255, 255, 255, 0.22), transparent 11%),
    linear-gradient(180deg, #07123a 0%, #0a1d55 58%, #07111f 100%);
}

.cloud,
.night-cloud {
  position: absolute;
  opacity: 0;
  border-radius: 999px;
}

.theme-toggle-btn:hover .cloud {
  opacity: 1;
  background: rgba(255, 255, 255, 0.95);
  box-shadow:
    14px 4px 0 rgba(255, 255, 255, 0.9),
    28px -1px 0 rgba(255, 255, 255, 0.78);
  animation: cloudPass 5s linear infinite;
}

.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: inherit;
}

.cloud::before {
  width: 16px;
  height: 16px;
  left: 7px;
  top: -7px;
}

.cloud::after {
  width: 19px;
  height: 19px;
  right: 5px;
  top: -9px;
}

.cloud-1 {
  width: 34px;
  height: 13px;
  top: 10px;
  left: 75px;
}

.cloud-2 {
  width: 40px;
  height: 14px;
  top: 15px;
  left: 150px;
  animation-delay: 1s !important;
}

.cloud-3 {
  width: 36px;
  height: 13px;
  top: 9px;
  left: 215px;
  animation-delay: 1.8s !important;
}

.cloud-4 {
  width: 30px;
  height: 11px;
  top: 18px;
  left: 245px;
  animation-delay: 2.5s !important;
}

.hill {
  position: absolute;
  bottom: -22px;
  opacity: 0;
  border-radius: 50%;
}

.theme-toggle-btn:hover .hill {
  opacity: 1;
}

.hill-1 {
  width: 170px;
  height: 52px;
  left: 24px;
  background: #6fba55;
}

.hill-2 {
  width: 210px;
  height: 58px;
  left: 116px;
  bottom: -26px;
  background: #4f9d45;
}

.rabbit {
  position: absolute;
  opacity: 0;
  z-index: 9;
  font-size: 20px;
  bottom: 13px;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.16));
  transform-origin: bottom center;
}

.theme-toggle-btn:hover .rabbit {
  opacity: 1;
}

.rabbit-1 {
  left: 88px;
  animation: rabbitHop 0.8s ease-in-out infinite;
}

.rabbit-2 {
  left: 175px;
  animation: rabbitHopFlip 0.85s ease-in-out infinite;
  animation-delay: 0.15s;
}

.rabbit-3 {
  left: 232px;
  font-size: 18px;
  animation: rabbitHop 0.95s ease-in-out infinite;
  animation-delay: 0.3s;
}

.flower {
  position: absolute;
  opacity: 0;
  z-index: 8;
  font-size: 15px;
  transform: scale(0.3);
}

.theme-toggle-btn:hover .flower {
  opacity: 1;
  animation: flowerBloom 1.2s ease-in-out infinite alternate;
}

.flower-1 {
  left: 126px;
  bottom: 6px;
  color: #ff5faa;
}

.flower-2 {
  left: 205px;
  bottom: 8px;
  color: #fff176;
  animation-delay: 0.18s !important;
}

.flower-3 {
  left: 260px;
  bottom: 6px;
  color: #ff9f43;
  animation-delay: 0.3s !important;
}

.flower-4 {
  left: 155px;
  bottom: 5px;
  color: #fff176;
  animation-delay: 0.45s !important;
}

.theme-toggle-btn:hover .night-cloud {
  opacity: 1;
  background: rgba(129, 140, 248, 0.24);
  box-shadow:
    28px 5px 0 rgba(129, 140, 248, 0.18),
    56px -2px 0 rgba(129, 140, 248, 0.14);
  animation: nightCloudDrift 5s linear infinite;
}

.night-cloud-1 {
  width: 50px;
  height: 16px;
  bottom: 8px;
  left: 105px;
}

.night-cloud-2 {
  width: 64px;
  height: 18px;
  bottom: 14px;
  left: 205px;
}

.star {
  position: absolute;
  opacity: 0;
  color: #ffffff;
  z-index: 7;
  text-shadow:
    0 0 8px rgba(255, 255, 255, 0.95),
    0 0 18px rgba(147, 197, 253, 0.55);
}

.theme-toggle-btn:hover .star {
  opacity: 1;
  animation: starShimmer 1.35s ease-in-out infinite;
}

.star-1 {
  left: 92px;
  top: 8px;
  font-size: 12px;
}

.star-2 {
  left: 150px;
  top: 22px;
  font-size: 9px;
  animation-delay: 0.3s !important;
}

.star-3 {
  left: 205px;
  top: 9px;
  font-size: 14px;
  animation-delay: 0.6s !important;
}

.star-4 {
  left: 250px;
  top: 24px;
  font-size: 10px;
  animation-delay: 0.9s !important;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.introTopbar {
  animation: topbarIntro 0.75s ease both;
  animation-delay: 2.5s;
}

@keyframes statusPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.7;
  }

  50% {
    transform: scale(1.35);
    opacity: 1;
  }
}

@keyframes cloudPass {
  from {
    transform: translateX(-45px);
  }

  to {
    transform: translateX(75px);
  }
}

@keyframes nightCloudDrift {
  from {
    transform: translateX(80px);
  }

  to {
    transform: translateX(-130px);
  }
}

@keyframes rabbitHop {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }

  45% {
    transform: translateY(-9px) rotate(-4deg);
  }
}

@keyframes rabbitHopFlip {
  0%, 100% {
    transform: scaleX(-1) translateY(0) rotate(0deg);
  }

  45% {
    transform: scaleX(-1) translateY(-9px) rotate(4deg);
  }
}

@keyframes flowerBloom {
  0% {
    transform: scale(0.45) rotate(-4deg);
  }

  100% {
    transform: scale(1.1) rotate(6deg);
  }
}

@keyframes starShimmer {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.42;
  }

  50% {
    transform: scale(1.3);
    opacity: 1;
  }
}

@keyframes topbarIntro {
  from {
    transform: translateY(-80px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 900px) {
  .topbar {
    padding: 0 18px;
  }

  .topbar-left {
    gap: 10px;
  }

  .topbar h1 {
    font-size: 18px;
  }

  .theme-toggle-btn:hover {
    width: 210px;
  }

  .rabbit-3,
  .flower-3,
  .flower-4,
  .cloud-4 {
    display: none;
  }
}
</style>