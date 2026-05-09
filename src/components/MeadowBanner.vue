<template>
  <div class="meadow-banner">
    <div class="sky">
      <div class="sun">☀</div>

      <div class="cloud cloud-1"></div>
      <div class="cloud cloud-2"></div>
      <div class="cloud cloud-3"></div>

      <div class="hill hill-back"></div>
      <div class="hill hill-front"></div>

      <div class="rabbit rabbit-1">🐇</div>
      <div class="rabbit rabbit-2">🐇</div>
      <div class="rabbit rabbit-3">🐇</div>

      <div class="flower flower-1">✿</div>
      <div class="flower flower-2">✿</div>
      <div class="flower flower-3">✿</div>
      <div class="flower flower-4">✿</div>
    </div>
  </div>
</template>

<style scoped>
.meadow-banner {
  width: 100%;
  max-width: 730px;
  height: 86px;
  border-radius: 28px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(91, 149, 255, 0.55);
  box-shadow:
    0 0 18px rgba(91, 149, 255, 0.25),
    inset 0 0 18px rgba(255, 255, 255, 0.12);
  cursor: pointer;
}

.sky {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #83b9ff 0%, #9cccff 45%, #c7e7ff 100%);
  overflow: hidden;
}

.sun {
  position: absolute;
  left: 42px;
  top: 18px;
  font-size: 36px;
  color: #ffe45c;
  text-shadow: 0 0 12px rgba(255, 235, 92, 0.65);
  animation: sunPulse 3s infinite ease-in-out;
  z-index: 5;
}

.cloud {
  position: absolute;
  width: 58px;
  height: 22px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 999px;
  filter: blur(0.2px);
  z-index: 4;
  opacity: 0.9;
}

.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  background: inherit;
  border-radius: 50%;
}

.cloud::before {
  width: 28px;
  height: 28px;
  left: 10px;
  top: -12px;
}

.cloud::after {
  width: 34px;
  height: 34px;
  right: 8px;
  top: -16px;
}

.cloud-1 {
  top: 25px;
  left: 210px;
  animation: cloudMove1 12s linear infinite;
}

.cloud-2 {
  top: 22px;
  left: 390px;
  transform: scale(0.85);
  animation: cloudMove2 15s linear infinite;
}

.cloud-3 {
  top: 18px;
  right: 80px;
  transform: scale(0.7);
  animation: cloudMove3 18s linear infinite;
}

.hill {
  position: absolute;
  bottom: -18px;
  height: 70px;
  border-radius: 50% 50% 0 0;
  z-index: 2;
}

.hill-back {
  left: -30px;
  width: 58%;
  background: #79bd58;
}

.hill-front {
  right: -40px;
  width: 72%;
  background: #5ca249;
}

.rabbit {
  position: absolute;
  z-index: 6;
  font-size: 30px;
  bottom: 23px;
  filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.16));
  transform-origin: bottom center;
}

.rabbit-1 {
  left: 155px;
}

.rabbit-2 {
  left: 395px;
  transform: scaleX(-1);
}

.rabbit-3 {
  right: 105px;
  font-size: 28px;
}

.flower {
  position: absolute;
  z-index: 7;
  font-size: 24px;
  bottom: 27px;
  transform: scale(0.9);
  transition: transform 0.35s ease;
}

.flower-1 {
  left: 300px;
  color: #ff5bbb;
}

.flower-2 {
  right: 230px;
  color: #fff176;
}

.flower-3 {
  right: 38px;
  color: #ffa55c;
}

.flower-4 {
  left: 475px;
  color: #fff176;
}

.meadow-banner:hover .rabbit-1 {
  animation: rabbitHop 0.75s ease-in-out infinite;
}

.meadow-banner:hover .rabbit-2 {
  animation: rabbitHopFlip 0.8s ease-in-out infinite;
}

.meadow-banner:hover .rabbit-3 {
  animation: rabbitHop 0.9s ease-in-out infinite;
}

.meadow-banner:hover .flower {
  animation: flowerBloom 0.9s ease-in-out infinite alternate;
}

.meadow-banner:hover .cloud-1 {
  animation-duration: 7s;
}

.meadow-banner:hover .cloud-2 {
  animation-duration: 9s;
}

.meadow-banner:hover .cloud-3 {
  animation-duration: 10s;
}

@keyframes cloudMove1 {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(95px);
  }
}

@keyframes cloudMove2 {
  0% {
    transform: translateX(0) scale(0.85);
  }

  100% {
    transform: translateX(-100px) scale(0.85);
  }
}

@keyframes cloudMove3 {
  0% {
    transform: translateX(0) scale(0.7);
  }

  100% {
    transform: translateX(-130px) scale(0.7);
  }
}

@keyframes rabbitHop {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }

  45% {
    transform: translateY(-16px) rotate(-4deg);
  }
}

@keyframes rabbitHopFlip {
  0%, 100% {
    transform: scaleX(-1) translateY(0) rotate(0deg);
  }

  45% {
    transform: scaleX(-1) translateY(-16px) rotate(4deg);
  }
}

@keyframes flowerBloom {
  0% {
    transform: scale(0.85) rotate(0deg);
  }

  100% {
    transform: scale(1.2) rotate(8deg);
  }
}

@keyframes sunPulse {
  0%, 100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.08);
  }
}
</style>