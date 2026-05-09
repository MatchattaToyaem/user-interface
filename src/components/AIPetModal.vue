<template>
  <div v-if="show" class="pet-overlay" @click.self="closeModal">
    <div class="pet-modal">
      <div class="pet-header">
        <div>
          <h2>AI Pixel Garden</h2>
          <p>Use arrow keys to walk around</p>
        </div>

        <button class="close-btn" @click="closeModal">×</button>
      </div>

      <div class="game-frame" :class="{ night: isNight }" tabindex="0">
        <div v-if="isRaining" class="rain-layer">
          <span v-for="drop in 18" :key="drop" class="rain-drop">💧</span>
        </div>

        <div v-if="isSparkling" class="sparkle-layer">
          <span v-for="spark in 14" :key="spark" class="sparkle">✨</span>
        </div>

        <div
          class="garden-grid"
          :style="{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`
          }"
        >
          <div
            v-for="tile in tiles"
            :key="`${tile.x}-${tile.y}`"
            class="tile"
            :class="tile.type"
          >
            <span v-if="hasTree(tile.x, tile.y)" class="object tree">🌳</span>
            <span v-else-if="hasFlower(tile.x, tile.y)" class="object flower">🌸</span>
            <span v-else-if="hasRabbit(tile.x, tile.y)" class="object rabbit">🐇</span>
            <span v-else-if="player.x === tile.x && player.y === tile.y" class="player">
              🧍
            </span>
            <span v-else class="grass-detail">.</span>
          </div>
        </div>
      </div>

      <div class="controls">
        <button @click="plantFlower">🌸 Plant</button>
        <button @click="startRain">🌧 Rain</button>
        <button @click="startSparkle">✨ Sparkle</button>
        <button @click="toggleNight">
          {{ isNight ? '☀️ Day' : '🌙 Night' }}
        </button>
      </div>

      <div class="mobile-controls">
        <button @click="move('up')">▲</button>
        <div>
          <button @click="move('left')">◀</button>
          <button @click="move('down')">▼</button>
          <button @click="move('right')">▶</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const rows = 8
const cols = 12

const player = ref({
  x: 5,
  y: 4
})

const flowers = ref([
  { x: 2, y: 2 },
  { x: 8, y: 3 },
  { x: 4, y: 6 }
])

const trees = ref([
  { x: 0, y: 0 },
  { x: 11, y: 0 },
  { x: 1, y: 6 },
  { x: 10, y: 6 }
])

const rabbits = ref([
  { x: 9, y: 5 },
  { x: 3, y: 4 }
])

const isRaining = ref(false)
const isSparkling = ref(false)
const isNight = ref(false)

const tiles = computed(() => {
  const result = []

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      result.push({
        x,
        y,
        type: (x + y) % 2 === 0 ? 'grass-a' : 'grass-b'
      })
    }
  }

  return result
})

const closeModal = () => {
  emit('close')
}

const hasFlower = (x: number, y: number) => {
  return flowers.value.some((flower) => flower.x === x && flower.y === y)
}

const hasTree = (x: number, y: number) => {
  return trees.value.some((tree) => tree.x === x && tree.y === y)
}

const hasRabbit = (x: number, y: number) => {
  return rabbits.value.some((rabbit) => rabbit.x === x && rabbit.y === y)
}

const canMoveTo = (x: number, y: number) => {
  if (x < 0 || x >= cols || y < 0 || y >= rows) return false
  if (hasTree(x, y)) return false
  return true
}

const move = (direction: 'up' | 'down' | 'left' | 'right') => {
  let newX = player.value.x
  let newY = player.value.y

  if (direction === 'up') newY--
  if (direction === 'down') newY++
  if (direction === 'left') newX--
  if (direction === 'right') newX++

  if (canMoveTo(newX, newY)) {
    player.value.x = newX
    player.value.y = newY
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!props.show) return

  if (
    event.key === 'ArrowUp' ||
    event.key === 'ArrowDown' ||
    event.key === 'ArrowLeft' ||
    event.key === 'ArrowRight'
  ) {
    event.preventDefault()
  }

  if (event.key === 'ArrowUp') move('up')
  if (event.key === 'ArrowDown') move('down')
  if (event.key === 'ArrowLeft') move('left')
  if (event.key === 'ArrowRight') move('right')
  if (event.key === 'Escape') closeModal()
}

const plantFlower = () => {
  const alreadyFlower = hasFlower(player.value.x, player.value.y)

  if (!alreadyFlower) {
    flowers.value.push({
      x: player.value.x,
      y: player.value.y
    })
  }
}

const startRain = () => {
  isRaining.value = true

  setTimeout(() => {
    isRaining.value = false
  }, 2200)
}

const startSparkle = () => {
  isSparkling.value = true

  setTimeout(() => {
    isSparkling.value = false
  }, 1800)
}

const toggleNight = () => {
  isNight.value = !isNight.value
}

watch(
  () => props.show,
  (value) => {
    if (value) {
      window.addEventListener('keydown', handleKeydown)
    } else {
      window.removeEventListener('keydown', handleKeydown)
    }
  }
)

onMounted(() => {
  if (props.show) {
    window.addEventListener('keydown', handleKeydown)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.pet-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(4, 8, 20, 0.62);
  backdrop-filter: blur(12px);
}

.pet-modal {
  width: 560px;
  max-width: 94vw;
  padding: 18px;
  border: 1px solid rgba(160, 190, 255, 0.28);
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(83, 140, 255, 0.22), transparent 32%),
    linear-gradient(145deg, rgba(12, 19, 38, 0.96), rgba(5, 9, 22, 0.98));
  box-shadow:
    0 28px 80px rgba(0, 0, 0, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  color: white;
}

.pet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.pet-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
}

.pet-header p {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(230, 236, 255, 0.68);
}

.close-btn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.09);
  color: white;
  font-size: 24px;
  cursor: pointer;
  transition: 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: scale(1.05);
}

.game-frame {
  position: relative;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 12 / 8;
  border: 4px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  background: #8bd86d;
  box-shadow:
    inset 0 0 0 3px rgba(0, 0, 0, 0.16),
    inset 0 -20px 38px rgba(0, 0, 0, 0.1);
}

.game-frame.night {
  background: #29446d;
}

.game-frame.night .garden-grid {
  filter: brightness(0.7) saturate(1.15);
}

.garden-grid {
  display: grid;
  width: 100%;
  height: 100%;
}

.tile {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(18px, 3.4vw, 30px);
  image-rendering: pixelated;
}

.grass-a {
  background: #88d96f;
}

.grass-b {
  background: #7fd063;
}

.tile::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px);
  background-size: 100% 100%;
  pointer-events: none;
}

.grass-detail {
  color: rgba(31, 118, 45, 0.55);
  font-size: 22px;
  transform: translateY(-4px);
}

.object,
.player {
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 4px 0 rgba(0, 0, 0, 0.18));
}

.player {
  animation: playerBounce 0.55s ease-in-out infinite alternate;
}

.tree {
  font-size: clamp(24px, 4vw, 36px);
}

.flower {
  animation: flowerWiggle 1.2s ease-in-out infinite alternate;
}

.rabbit {
  animation: rabbitHop 1s ease-in-out infinite;
}

.controls {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 14px;
}

.controls button,
.mobile-controls button {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  padding: 10px 8px;
  background: rgba(255, 255, 255, 0.09);
  color: white;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.18s ease;
}

.controls button:hover,
.mobile-controls button:hover {
  background: rgba(110, 160, 255, 0.26);
  transform: translateY(-2px);
}

.mobile-controls {
  display: none;
  margin-top: 12px;
  text-align: center;
}

.mobile-controls div {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 6px;
}

.mobile-controls button {
  width: 46px;
  height: 38px;
  padding: 0;
}

.rain-layer,
.sparkle-layer {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  overflow: hidden;
}

.rain-drop {
  position: absolute;
  top: -30px;
  animation: rainFall 1.1s linear infinite;
}

.rain-drop:nth-child(1) { left: 4%; animation-delay: 0s; }
.rain-drop:nth-child(2) { left: 9%; animation-delay: 0.2s; }
.rain-drop:nth-child(3) { left: 15%; animation-delay: 0.4s; }
.rain-drop:nth-child(4) { left: 22%; animation-delay: 0.1s; }
.rain-drop:nth-child(5) { left: 28%; animation-delay: 0.5s; }
.rain-drop:nth-child(6) { left: 34%; animation-delay: 0.3s; }
.rain-drop:nth-child(7) { left: 40%; animation-delay: 0.7s; }
.rain-drop:nth-child(8) { left: 47%; animation-delay: 0.2s; }
.rain-drop:nth-child(9) { left: 53%; animation-delay: 0.4s; }
.rain-drop:nth-child(10) { left: 59%; animation-delay: 0.6s; }
.rain-drop:nth-child(11) { left: 65%; animation-delay: 0.1s; }
.rain-drop:nth-child(12) { left: 71%; animation-delay: 0.8s; }
.rain-drop:nth-child(13) { left: 77%; animation-delay: 0.3s; }
.rain-drop:nth-child(14) { left: 83%; animation-delay: 0.5s; }
.rain-drop:nth-child(15) { left: 88%; animation-delay: 0.2s; }
.rain-drop:nth-child(16) { left: 92%; animation-delay: 0.6s; }
.rain-drop:nth-child(17) { left: 96%; animation-delay: 0.4s; }
.rain-drop:nth-child(18) { left: 50%; animation-delay: 0.9s; }

.sparkle {
  position: absolute;
  animation: sparklePop 1.3s ease-in-out infinite;
}

.sparkle:nth-child(1) { left: 8%; top: 18%; animation-delay: 0s; }
.sparkle:nth-child(2) { left: 20%; top: 45%; animation-delay: 0.2s; }
.sparkle:nth-child(3) { left: 34%; top: 22%; animation-delay: 0.4s; }
.sparkle:nth-child(4) { left: 48%; top: 70%; animation-delay: 0.1s; }
.sparkle:nth-child(5) { left: 60%; top: 34%; animation-delay: 0.3s; }
.sparkle:nth-child(6) { left: 74%; top: 55%; animation-delay: 0.5s; }
.sparkle:nth-child(7) { left: 86%; top: 24%; animation-delay: 0.7s; }
.sparkle:nth-child(8) { left: 12%; top: 74%; animation-delay: 0.8s; }
.sparkle:nth-child(9) { left: 42%; top: 42%; animation-delay: 0.25s; }
.sparkle:nth-child(10) { left: 92%; top: 76%; animation-delay: 0.45s; }
.sparkle:nth-child(11) { left: 28%; top: 82%; animation-delay: 0.65s; }
.sparkle:nth-child(12) { left: 68%; top: 12%; animation-delay: 0.15s; }
.sparkle:nth-child(13) { left: 55%; top: 88%; animation-delay: 0.35s; }
.sparkle:nth-child(14) { left: 78%; top: 82%; animation-delay: 0.55s; }

@keyframes playerBounce {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-4px);
  }
}

@keyframes flowerWiggle {
  from {
    transform: rotate(-4deg) scale(1);
  }
  to {
    transform: rotate(4deg) scale(1.08);
  }
}

@keyframes rabbitHop {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-7px);
  }
}

@keyframes rainFall {
  from {
    transform: translateY(-30px);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  to {
    transform: translateY(420px);
    opacity: 0;
  }
}

@keyframes sparklePop {
  0%, 100% {
    transform: scale(0.2) rotate(0deg);
    opacity: 0;
  }
  45% {
    transform: scale(1.2) rotate(15deg);
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .pet-modal {
    padding: 14px;
  }

  .pet-header h2 {
    font-size: 17px;
  }

  .pet-header p {
    font-size: 12px;
  }

  .controls {
    grid-template-columns: repeat(2, 1fr);
  }

  .mobile-controls {
    display: block;
  }
}
</style>