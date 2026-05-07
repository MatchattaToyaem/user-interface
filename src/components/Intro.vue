<template>
  <div v-if="showIntro" class="intro-overlay">
    <div class="intro-flash"></div>
    <div class="glow-ripple"></div>

    <div class="particle particle-1"></div>
    <div class="particle particle-2"></div>
    <div class="particle particle-3"></div>
    <div class="particle particle-4"></div>
    <div class="particle particle-5"></div>
    <div class="particle particle-6"></div>

    <div class="intro-logo-wrap">
      <img :src="mainLogo" alt="O'Connors AI" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  showIntro: boolean
  mainLogo: string
}>()
</script>

<style scoped>
.intro-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background:
    radial-gradient(circle at center, rgba(47, 140, 255, 0.22), transparent 32%),
    #03050a;
  display: flex;
  align-items: center;
  justify-content: center;
  animation:
    cameraZoomIntro 3.2s ease forwards,
    introFadeOut 0.45s ease forwards;
  animation-delay: 0s, 2.95s;
  pointer-events: none;
}

.intro-flash {
  position: absolute;
  inset: 0;
  background: rgba(120, 185, 255, 0.28);
  opacity: 0;
  animation: screenFlash 0.42s ease-out forwards;
  animation-delay: 0.55s;
}

.glow-ripple {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px solid rgba(77, 163, 255, 0.75);
  box-shadow:
    0 0 30px rgba(77, 163, 255, 0.7),
    inset 0 0 18px rgba(77, 163, 255, 0.25);
  opacity: 0;
  animation: glowRipple 1.4s ease-out forwards;
  animation-delay: 0.55s;
}

.intro-logo-wrap {
  width: 110px;
  height: 110px;
  border-radius: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(47, 140, 255, 0.14);
  box-shadow:
    0 0 34px rgba(47, 140, 255, 0.55),
    0 0 90px rgba(47, 140, 255, 0.25);
  animation:
    logoFlyIn 1.8s cubic-bezier(0.18, 0.9, 0.25, 1.2) forwards,
    logoPulseBeforeFade 0.8s ease-in-out forwards,
    logoMergeToSidebar 0.75s cubic-bezier(0.18, 0.9, 0.25, 1.15) forwards;
  animation-delay: 0s, 1.9s, 2.55s;
}

.intro-logo-wrap img {
  width: 76px;
  height: 76px;
  object-fit: contain;
  filter: drop-shadow(0 0 22px rgba(255, 255, 255, 0.32));
  animation: introLogoSpin 1.8s cubic-bezier(0.18, 0.9, 0.25, 1.2) forwards;
}

.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4da3ff;
  box-shadow:
    0 0 12px rgba(77, 163, 255, 0.9),
    0 0 28px rgba(77, 163, 255, 0.45);
  opacity: 0;
  animation: particleBurst 1.35s ease-out forwards;
}

.particle-1 {
  top: 48%;
  left: 48%;
  animation-delay: 0.18s;
  --x: -160px;
  --y: -100px;
}

.particle-2 {
  top: 50%;
  left: 50%;
  animation-delay: 0.24s;
  --x: 170px;
  --y: -80px;
}

.particle-3 {
  top: 52%;
  left: 49%;
  animation-delay: 0.3s;
  --x: -140px;
  --y: 115px;
}

.particle-4 {
  top: 50%;
  left: 51%;
  animation-delay: 0.36s;
  --x: 150px;
  --y: 120px;
}

.particle-5 {
  top: 49%;
  left: 50%;
  animation-delay: 0.42s;
  --x: 0px;
  --y: -170px;
}

.particle-6 {
  top: 51%;
  left: 50%;
  animation-delay: 0.48s;
  --x: 0px;
  --y: 170px;
}

@keyframes screenFlash {
  0% { opacity: 0; }
  35% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes glowRipple {
  0% {
    transform: scale(0.25);
    opacity: 0;
  }

  20% {
    opacity: 1;
  }

  100% {
    transform: scale(6);
    opacity: 0;
  }
}

@keyframes logoFlyIn {
  0% {
    transform: translateY(90px) scale(0.3) rotate(-18deg);
    opacity: 0;
  }

  55% {
    transform: translateY(0) scale(1.15) rotate(4deg);
    opacity: 1;
  }

  100% {
    transform: translateY(0) scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes introLogoSpin {
  0% {
    transform: rotate(-220deg) scale(0.55);
  }

  60% {
    transform: rotate(20deg) scale(1.12);
  }

  100% {
    transform: rotate(0deg) scale(1);
  }
}

@keyframes logoPulseBeforeFade {
  0% {
    transform: scale(1);
    box-shadow:
      0 0 34px rgba(47, 140, 255, 0.55),
      0 0 90px rgba(47, 140, 255, 0.25);
  }

  45% {
    transform: scale(1.16);
    box-shadow:
      0 0 48px rgba(47, 140, 255, 0.85),
      0 0 120px rgba(47, 140, 255, 0.42);
  }

  100% {
    transform: scale(1);
    box-shadow:
      0 0 34px rgba(47, 140, 255, 0.55),
      0 0 90px rgba(47, 140, 255, 0.25);
  }
}

@keyframes logoMergeToSidebar {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }

  100% {
    transform: translate(calc(-50vw + 74px), calc(-50vh + 54px)) scale(0.38);
    opacity: 0.15;
  }
}

@keyframes particleBurst {
  0% {
    transform: translate(0, 0) scale(0.3);
    opacity: 0;
  }

  25% {
    opacity: 1;
  }

  100% {
    transform: translate(var(--x), var(--y)) scale(1.2);
    opacity: 0;
  }
}

@keyframes cameraZoomIntro {
  0% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

@keyframes introFadeOut {
  to {
    opacity: 0;
    visibility: hidden;
  }
}
</style>