<template>
  <Transition name="theme-effect">
    <div
      v-if="themeTransition"
      class="theme-transition-layer"
      :class="themeTransition"
    >
      <div class="theme-bubble">
        <span class="theme-face">
          {{ themeTransition === 'light-wipe' ? '☀' : '☾' }}
        </span>
      </div>

      <span v-for="item in 12" :key="item" class="pop-dot"></span>
    </div>
  </Transition>

  <Transition name="fireworks-fade">
    <div v-if="showFireworks" class="fireworks-overlay">
      <div
        v-for="particle in 80"
        :key="particle"
        class="firework-particle"
        :style="{
          '--x': `${Math.random() * 100}vw`,
          '--y': `${Math.random() * 100}vh`,
          '--dx': `${(Math.random() - 0.5) * 500}px`,
          '--dy': `${(Math.random() - 0.5) * 500}px`,
          '--delay': `${Math.random() * 0.4}s`
        }"
      ></div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  themeTransition: 'light-wipe' | 'dark-wipe' | null
  showFireworks: boolean
}>()
</script>

<style scoped>
.theme-transition-layer,
.fireworks-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 99998;
}

.fireworks-overlay {
  z-index: 99999;
}

.theme-bubble {
  position: absolute;
  right: 28px;
  top: 22px;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: cuteBubblePop 0.7s ease forwards;
}

.light-wipe .theme-bubble {
  background: radial-gradient(circle, #ffffff 0%, #dbeafe 62%, #93c5fd 100%);
  box-shadow:
    0 0 24px rgba(147, 197, 253, 0.8),
    0 0 60px rgba(96, 165, 250, 0.3);
}

.dark-wipe .theme-bubble {
  background: radial-gradient(circle, #1e3a8a 0%, #0f172a 64%, #020617 100%);
  box-shadow:
    0 0 24px rgba(96, 165, 250, 0.55),
    0 0 60px rgba(15, 23, 42, 0.5);
}

.theme-face {
  font-size: 34px;
  line-height: 1;
  animation: faceWiggle 0.7s ease forwards;
}

.light-wipe .theme-face {
  color: #ffd331;
  text-shadow:
    0 0 12px rgba(255, 211, 49, 0.95),
    0 0 24px rgba(255, 177, 0, 0.4);
}

.dark-wipe .theme-face {
  color: #ffffff;
  text-shadow:
    0 0 12px rgba(255, 255, 255, 0.9),
    0 0 24px rgba(147, 197, 253, 0.5);
}

.pop-dot {
  position: absolute;
  right: 62px;
  top: 56px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  animation: popDot 0.62s ease-out forwards;
}

.light-wipe .pop-dot {
  background: #60a5fa;
  box-shadow: 0 0 12px rgba(96, 165, 250, 0.7);
}

.dark-wipe .pop-dot {
  background: #93c5fd;
  box-shadow: 0 0 12px rgba(147, 197, 253, 0.65);
}

.pop-dot:nth-child(2) { --x: -52px; --y: -18px; animation-delay: 0.02s; }
.pop-dot:nth-child(3) { --x: -38px; --y: -48px; animation-delay: 0.04s; }
.pop-dot:nth-child(4) { --x: 0px; --y: -62px; animation-delay: 0.06s; }
.pop-dot:nth-child(5) { --x: 42px; --y: -46px; animation-delay: 0.08s; }
.pop-dot:nth-child(6) { --x: 58px; --y: -8px; animation-delay: 0.1s; }
.pop-dot:nth-child(7) { --x: 44px; --y: 34px; animation-delay: 0.12s; }
.pop-dot:nth-child(8) { --x: 6px; --y: 56px; animation-delay: 0.14s; }
.pop-dot:nth-child(9) { --x: -36px; --y: 42px; animation-delay: 0.16s; }
.pop-dot:nth-child(10) { --x: -62px; --y: 10px; animation-delay: 0.18s; }
.pop-dot:nth-child(11) { --x: 78px; --y: 18px; animation-delay: 0.08s; }
.pop-dot:nth-child(12) { --x: -78px; --y: -28px; animation-delay: 0.1s; }
.pop-dot:nth-child(13) { --x: 18px; --y: -82px; animation-delay: 0.12s; }

.firework-particle {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(circle, #ffffff 0%, #ffd84d 35%, #ff9f1a 100%);
  box-shadow:
    0 0 14px rgba(255, 216, 77, 0.9),
    0 0 34px rgba(255, 159, 26, 0.45);
  animation: fireworkExplosion 1.5s ease-out forwards;
  animation-delay: var(--delay);
}

.theme-effect-enter-active,
.theme-effect-leave-active,
.fireworks-fade-enter-active,
.fireworks-fade-leave-active {
  transition: opacity 0.18s ease;
}

.theme-effect-enter-from,
.theme-effect-leave-to,
.fireworks-fade-enter-from,
.fireworks-fade-leave-to {
  opacity: 0;
}

@keyframes cuteBubblePop {
  0% {
    transform: scale(0.2) rotate(-18deg);
    opacity: 0;
  }

  45% {
    transform: scale(1.18) rotate(8deg);
    opacity: 1;
  }

  72% {
    transform: scale(0.92) rotate(-4deg);
    opacity: 1;
  }

  100% {
    transform: scale(1) rotate(0deg);
    opacity: 0;
  }
}

@keyframes faceWiggle {
  0% {
    transform: scale(0.4) rotate(-20deg);
  }

  45% {
    transform: scale(1.18) rotate(12deg);
  }

  100% {
    transform: scale(1) rotate(0deg);
  }
}

@keyframes popDot {
  0% {
    transform: translate(0, 0) scale(0.2);
    opacity: 0;
  }

  25% {
    opacity: 1;
  }

  100% {
    transform: translate(var(--x), var(--y)) scale(1.1);
    opacity: 0;
  }
}

@keyframes fireworkExplosion {
  0% {
    transform: translate(0, 0) scale(0.2);
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  100% {
    transform: translate(var(--dx), var(--dy)) scale(1.8);
    opacity: 0;
  }
}
</style>