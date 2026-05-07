<template>
  <footer class="chat-input-wrap">
    <div class="chat-input-shell">
      <div class="chat-input-bar">
        <input
          :value="inputValue"
          type="text"
          placeholder="Ask a question or describe an issue..."
          @input="onInput"
          @keyup.enter="handleEnter"
        />

        <button
          class="send-btn"
          :class="{ stopMode: isGenerating }"
          @click="handleButtonClick"
        >
          <span v-if="isGenerating" class="stop-icon"></span>
          <span v-else>➤</span>
        </button>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const props = defineProps<{
  inputValue: string
  isGenerating: boolean
}>()

const emit = defineEmits<{
  (e: 'update-input', value: string): void
  (e: 'send-message'): void
  (e: 'stop-message'): void
}>()

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update-input', target.value)
}

function handleButtonClick() {
  if (props.isGenerating) {
    emit('stop-message')
    return
  }

  emit('send-message')
}

function handleEnter() {
  if (!props.isGenerating) {
    emit('send-message')
  }
}
</script>

<style scoped>
.chat-input-wrap {
  padding: 0 0 22px;
}

.chat-input-shell {
  width: min(980px, calc(100% - 80px));
  margin: 0 auto;
}

.chat-input-bar {
  width: 100%;
  height: 58px;
  border-radius: 29px;
  background: rgba(10, 15, 28, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 0 40px rgba(0, 102, 255, 0.08),
    inset 0 0 24px rgba(255, 255, 255, 0.02);
  display: flex;
  align-items: center;
  padding: 0 10px 0 24px;
}

.chat-input-bar input[type='text'] {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #e7ebf5;
  font-size: 15px;
  padding: 0 14px 0 0;
}

.chat-input-bar input[type='text']::placeholder {
  color: #727b90;
}

.send-btn {
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(180deg, #2f8cff, #1771eb);
  color: white;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 0 18px rgba(47, 140, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    filter 0.22s ease,
    background 0.22s ease;
}

.send-btn:hover {
  transform: scale(1.12);
  box-shadow:
    0 0 18px rgba(47, 140, 255, 0.35),
    0 0 34px rgba(47, 140, 255, 0.38),
    0 0 52px rgba(47, 140, 255, 0.18);
  filter: brightness(1.05);
}

.send-btn.stopMode {
  background: linear-gradient(180deg, #ff5f5f, #d92f2f);
  box-shadow:
    0 0 18px rgba(255, 80, 80, 0.35),
    0 0 38px rgba(255, 80, 80, 0.18);
}

.send-btn.stopMode:hover {
  transform: scale(1.12);
  box-shadow:
    0 0 18px rgba(255, 80, 80, 0.45),
    0 0 36px rgba(255, 80, 80, 0.28),
    0 0 58px rgba(255, 80, 80, 0.16);
}

.stop-icon {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: #ffffff;
  display: inline-block;
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.35);
}

@media (max-width: 900px) {
  .chat-input-shell {
    width: calc(100% - 24px);
  }
}
</style>