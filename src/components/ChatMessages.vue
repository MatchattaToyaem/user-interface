<template>
  <section class="chat-body" @click="$emit('close-menu')">
    <transition name="fade-up">
      <div v-if="showWelcome" class="welcome-card">
        <div class="welcome-logo-wrap">
          <div class="pulse-ring pulse-ring-1"></div>
          <div class="pulse-ring pulse-ring-2"></div>
          <div class="welcome-logo">
            <img :src="mainLogo" alt="O'Connors AI" />
          </div>
        </div>

        <h2>How can I help you today, {{ displayName }} ?</h2>

        <p class="typing-text">
          {{ animatedText }}<span class="cursor">|</span>
        </p>
      </div>
    </transition>

    <div v-if="currentChat && currentChat.messages.length > 0" class="messages">
      <div
        v-for="message in currentChat.messages"
        :key="message.id"
        class="message-row"
        :class="message.role"
      >
        <div
          v-if="
            message.role === 'assistant' ||
            message.role === 'thinking' ||
            message.role === 'comparison_result'
          "
          class="assistant-icon"
          :class="{ thinkingIcon: message.role === 'thinking' }"
        >
          <div v-if="message.role === 'thinking'" class="thinking-ring ring-1"></div>
          <div v-if="message.role === 'thinking'" class="thinking-ring ring-2"></div>
          <img :src="mainLogo" alt="AI" />
        </div>

        <div
          class="message-bubble"
          :class="{
            thinkingBubble: message.role === 'thinking',
            comparisonResultBubble: message.role === 'comparison_result'
          }"
        >
          <template v-if="message.role === 'thinking'">
            <div class="thinking-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </template>

          <template v-else>
            <div
              v-if="message.fileNames && message.fileNames.length"
              class="message-file-chip-row"
            >
              <div
                v-for="fileName in message.fileNames"
                :key="fileName"
                class="message-file-chip"
                :class="{ userFileChip: message.role === 'user' }"
              >
                <div class="file-badge">{{ getFileBadge(fileName) }}</div>
                <span class="message-file-name">{{ fileName }}</span>
              </div>
            </div>

            <div v-if="message.text" class="formatted-answer">
              <template
                v-if="
                  message.role === 'assistant' ||
                  message.role === 'comparison_result'
                "
              >
                <ul>
                  <li
                    v-for="point in formatBulletPoints(message.text)"
                    :key="point"
                  >
                    {{ point }}
                  </li>
                </ul>
              </template>

              <template v-else>
                {{ message.text }}
              </template>
            </div>

            <div
              v-if="
                message.documents &&
                message.documents.length &&
                (message.role === 'assistant' ||
                  message.role === 'comparison_result')
              "
              class="assistant-document-links"
            >
              <button
                v-for="document in message.documents"
                :key="document.id"
                class="doc-reference-chip"
                :class="{ selected: isDocumentSelected(document.id) }"
                @click="$emit('open-document', document)"
              >
                Pg 1: {{ document.name }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
type MessageDocument = {
  id: string
  name: string
  documentPath?: string
  file?: File
}

type MessageRole = 'user' | 'assistant' | 'thinking' | 'comparison_result'

type Message = {
  id: number
  role: MessageRole
  text: string
  fileNames?: string[]
  docReference?: string
  documents?: MessageDocument[]
}

type ChatItem = {
  id: number
  name: string
  messages: Message[]
  selectedDocumentId?: string | null
}

function formatBulletPoints(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(point => point.trim())
    .filter(point => point.length > 0)
}

defineProps<{
  currentChat: ChatItem | null
  showWelcome: boolean
  displayName: string
  animatedText: string
  mainLogo: string
  aiLogo: string
  isDocumentSelected: (documentId: string) => boolean
  getFileBadge: (fileName: string) => string
}>()

defineEmits<{
  (e: 'close-menu'): void
  (e: 'open-document', document: MessageDocument): void
}>()
</script>

<style scoped>
.chat-body {
  flex: 1;
  position: relative;
  overflow-y: auto;
  padding: 28px 28px 16px;
}

.welcome-card {
  position: absolute;
  inset: 0;
  margin: auto;
  width: fit-content;
  height: fit-content;
  text-align: center;
  max-width: 640px;
}

.welcome-logo-wrap {
  position: relative;
  width: 88px;
  height: 88px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-ring {
  position: absolute;
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.12);
  animation: heartbeatGlow 2s infinite ease-in-out;
}

.pulse-ring-1 {
  width: 88px;
  height: 88px;
}

.pulse-ring-2 {
  width: 112px;
  height: 112px;
  animation-delay: 0.35s;
}

.welcome-logo {
  position: relative;
  z-index: 2;
  width: 62px;
  height: 62px;
  border-radius: 18px;
  background: linear-gradient(180deg, #2b8cff, #176be8);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 28px rgba(37, 99, 235, 0.45);
  overflow: hidden;
}

.welcome-logo img {
  width: 72%;
  height: 72%;
  object-fit: contain;
  filter: drop-shadow(0 0 16px rgba(37, 99, 235, 0.55));
}

.welcome-card h2 {
  margin: 0 0 16px;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
}

.typing-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: #9098ad;
  min-height: 28px;
}

.cursor {
  display: inline-block;
  margin-left: 4px;
  color: #4da3ff;
  animation: blinkCursor 1s infinite;
}

.messages {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-bottom: 24px;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
}

.message-row.user {
  justify-content: flex-end;
}

.message-row.assistant,
.message-row.thinking,
.message-row.comparison_result {
  justify-content: flex-start;
}

.assistant-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(180deg, #2b8cff, #176be8);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 18px rgba(37, 99, 235, 0.24);
  flex-shrink: 0;
  margin-top: 2px;
  position: relative;
  animation: iconFloatIn 0.35s ease;
}

.assistant-icon img {
  width: 72%;
  height: 72%;
  object-fit: contain;
  z-index: 2;
}

.thinkingIcon img {
  animation: thinkingLogoSpin 1.6s linear infinite;
  transform-origin: center;
}

.thinking-ring {
  position: absolute;
  border-radius: 50%;
  background: rgba(56, 130, 246, 0.16);
  z-index: 1;
}

.ring-1 {
  width: 44px;
  height: 44px;
  animation: thinkingPulse 1.4s infinite ease-in-out;
}

.ring-2 {
  width: 58px;
  height: 58px;
  animation: thinkingPulse 1.4s infinite ease-in-out;
  animation-delay: 0.25s;
}

.message-bubble {
  max-width: 860px;
  padding: 16px 18px;
  border-radius: 20px;
  font-size: 15px;
  line-height: 1.65;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease,
    border-color 0.22s ease;
}

.message-bubble:hover {
  box-shadow:
    0 14px 42px rgba(0, 0, 0, 0.24),
    0 0 18px rgba(17, 132, 255, 0.05);
}

.message-row.user .message-bubble {
  background: linear-gradient(180deg, rgba(35, 42, 58, 0.95), rgba(25, 31, 45, 0.95));
  color: #f4f7ff;
  border-top-right-radius: 8px;
  animation: userBubbleIn 0.3s ease;
  max-width: 420px;
}

.message-row.assistant .message-bubble,
.message-row.thinking .message-bubble,
.message-row.comparison_result .message-bubble {
  background: linear-gradient(180deg, rgba(10, 17, 31, 0.98), rgba(8, 13, 24, 0.98));
  color: #dfe6f5;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  border-top-left-radius: 8px;
  animation: assistantBubbleIn 0.34s ease;
}

.formatted-answer ul {
  margin: 0;
  padding-left: 20px;
}

.formatted-answer li {
  margin-bottom: 8px;
  line-height: 1.7;
}

.formatted-answer li:last-child {
  margin-bottom: 0;
}

.comparisonResultBubble {
  width: 100%;
  max-width: 860px;
}

.message-file-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.message-file-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  max-width: 260px;
  padding: 6px 10px;
  border-radius: 12px;
  background: rgba(18, 24, 38, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.userFileChip {
  background: rgba(28, 35, 52, 0.96);
}

.message-file-name {
  color: #cdd6ea;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-badge {
  min-width: 34px;
  height: 24px;
  padding: 0 8px;
  border-radius: 7px;
  background: rgba(255, 119, 119, 0.16);
  color: #ff8b8b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.assistant-document-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.doc-reference-chip {
  position: relative;
  overflow: hidden;
  min-height: 30px;
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid rgba(19, 135, 255, 0.45);
  background: rgba(19, 135, 255, 0.08);
  color: #5db6ff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.22s ease;
  animation: chipAppearUp 0.28s ease;
}

.doc-reference-chip:hover {
  background: rgba(19, 135, 255, 0.14);
  box-shadow: 0 0 18px rgba(19, 135, 255, 0.18);
}

.doc-reference-chip.selected {
  background: linear-gradient(180deg, rgba(43, 140, 255, 0.2), rgba(23, 113, 235, 0.14));
  border-color: rgba(43, 140, 255, 0.46);
  color: #dff1ff;
  box-shadow:
    0 0 18px rgba(43, 140, 255, 0.16),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.thinkingBubble {
  min-width: 84px;
  min-height: 56px;
  display: flex;
  align-items: center;
}

.thinking-dots {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.thinking-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #8fb9ff;
  animation: thinkingBounce 1.2s infinite ease-in-out;
}

.thinking-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.thinking-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.3s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes heartbeatGlow {
  0% { transform: scale(0.9); opacity: 0.25; }
  25% { transform: scale(1.02); opacity: 0.45; }
  40% { transform: scale(0.96); opacity: 0.3; }
  60% { transform: scale(1.08); opacity: 0.5; }
  100% { transform: scale(1.2); opacity: 0; }
}

@keyframes blinkCursor {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0; }
}

@keyframes thinkingBounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.45; }
  40% { transform: translateY(-5px); opacity: 1; }
}

@keyframes assistantBubbleIn {
  0% { opacity: 0; transform: translateY(12px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes userBubbleIn {
  0% { opacity: 0; transform: translateY(10px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes chipAppearUp {
  0% { opacity: 0; transform: translateY(8px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes iconFloatIn {
  0% { opacity: 0; transform: translateY(10px) scale(0.92); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes thinkingLogoSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes thinkingPulse {
  0% {
    transform: scale(0.9);
    opacity: 0.2;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.38;
  }
  100% {
    transform: scale(1.22);
    opacity: 0;
  }
}
</style>