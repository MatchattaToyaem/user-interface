<template>
  <section
    ref="chatBodyRef"
    class="chat-body"
    @click="$emit('close-menu')"
    @scroll="handleScroll"
  >
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
          :class="{
            thinkingIcon:
              message.role === 'thinking' ||
              isTypingMessage(message)
          }"
        >
          <div
            v-if="message.role === 'thinking' || isTypingMessage(message)"
            class="thinking-ring ring-1"
          ></div>

          <div
            v-if="message.role === 'thinking' || isTypingMessage(message)"
            class="thinking-ring ring-2"
          ></div>

          <img :src="mainLogo" alt="AI" />
        </div>

        <div class="assistant-message-stack">
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

              <button
                v-if="isTypingMessage(message)"
                class="skip-animation-btn"
                @click.stop="$emit('skip-animation')"
                type="button"
              >
                ⏩ Skip
              </button>

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
                  {{ document.name }}
                </button>
              </div>
            </template>
          </div>

          <div
            v-if="
              (message.role === 'assistant' ||
                message.role === 'comparison_result') &&
              !isInterruptedMessage(message)
            "
            class="response-actions"
          >
            <button
              class="response-action-btn"
              @click="copyResponseText(message.id)"
              type="button"
              title="Copy response"
            >
              ⧉
              <span>{{ copiedMessageId === message.id ? 'Copied' : 'Copy' }}</span>
            </button>

            <button
              class="response-action-btn"
              :class="{ speaking: speakingMessageId === message.id }"
              @click="readResponseAloud(message)"
              type="button"
              title="Read aloud"
            >
              {{ speakingMessageId === message.id ? '⏹' : '🔊' }}
              <span>{{ speakingMessageId === message.id ? 'Stop' : 'Read Aloud' }}</span>
            </button>
          </div>

          <div
            v-if="
              (message.role === 'assistant' ||
                message.role === 'comparison_result') &&
              isInterruptedMessage(message)
            "
            class="response-actions"
          >
            <button
              class="response-action-btn"
              :class="{ speaking: speakingMessageId === message.id }"
              @click="readResponseAloud(message)"
              type="button"
              title="Read aloud"
            >
              {{ speakingMessageId === message.id ? '⏹' : '🔊' }}
              <span>{{ speakingMessageId === message.id ? 'Stop' : 'Read Aloud' }}</span>
            </button>
          </div>

          <div
            v-if="
              (message.role === 'assistant' ||
                message.role === 'comparison_result') &&
              !isInterruptedMessage(message)
            "
            class="response-rating-card"
            :class="{
              happyRating: ratingMood(message.id) === 'happy',
              sadRating: ratingMood(message.id) === 'sad'
            }"
          >
            <span class="rating-label">Rate this response</span>

            <div class="star-rating">
              <button
                v-for="star in 5"
                :key="star"
                class="star-btn"
                :class="{
                  active: star <= displayRating(message.id),
                  locked: star <= selectedRating(message.id)
                }"
                @mouseenter="setHoverRating(message.id, star)"
                @mouseleave="clearHoverRating(message.id)"
                @click="selectRating(message.id, star)"
                type="button"
              >
                ★
              </button>
            </div>

            <span v-if="selectedRating(message.id)" class="rating-reaction">
              {{ selectedRating(message.id) >= 4 ? 'AI is happy ✨' : 'AI will improve 💙' }}
            </span>

            <div
              v-if="activeParticleMessageId === message.id"
              class="rating-particles"
              :class="{ sadParticles: selectedRating(message.id) <= 3 }"
            >
              <span v-for="particle in 14" :key="particle"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ breaks: true })

function renderMarkdown(text: string): string {
  const raw = marked.parse(text) as string
  return DOMPurify.sanitize(raw)
}

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

const props = defineProps<{
  currentChat: ChatItem | null
  showWelcome: boolean
  displayName: string
  animatedText: string
  mainLogo: string
  aiLogo: string
  isDocumentSelected: (documentId: string) => boolean
  getFileBadge: (fileName: string) => string
  generatingMessageId: number | null
}>()

const emit = defineEmits<{
  (e: 'close-menu'): void
  (e: 'open-document', document: MessageDocument): void
  (e: 'scroll-state', isNearBottom: boolean): void
  (e: 'three-perfect-ratings'): void
  (e: 'skip-animation'): void
}>()

const chatBodyRef = ref<HTMLElement | null>(null)
const ratings = ref<Record<number, number>>({})
const hoverRatings = ref<Record<number, number>>({})
const activeParticleMessageId = ref<number | null>(null)
const copiedMessageId = ref<number | null>(null)
const speakingMessageId = ref<number | null>(null)

const consecutiveFiveStarCount = computed(() => {
  const assistantMessages = props.currentChat?.messages.filter(
    message =>
      (message.role === 'assistant' || message.role === 'comparison_result') &&
      !isInterruptedMessage(message)
  ) || []

  let count = 0

  for (let i = assistantMessages.length - 1; i >= 0; i--) {
    const rating = ratings.value[assistantMessages[i].id]

    if (rating === 5) {
      count++
    } else {
      break
    }
  }

  return count
})

function formatBulletPoints(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(point => point.trim())
    .filter(point => point.length > 0)
}

function isTypingMessage(message: Message) {
  return message.role === 'assistant' && props.generatingMessageId === message.id
}

function isInterruptedMessage(message: Message) {
  return message.text.includes('Response generation was interrupted by the user.')
}

function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight
  emit('scroll-state', distanceFromBottom < 120)
}

function scrollToBottom() {
  nextTick(() => {
    if (!chatBodyRef.value) return

    chatBodyRef.value.scrollTo({
      top: chatBodyRef.value.scrollHeight,
      behavior: 'smooth'
    })
  })
}

watch(
  () => props.currentChat?.messages.map(message => message.text).join(''),
  () => {
    scrollToBottom()
  }
)

watch(
  () => props.currentChat?.messages.length,
  () => {
    scrollToBottom()
  }
)

function setHoverRating(messageId: number, rating: number) {
  hoverRatings.value[messageId] = rating
}

function clearHoverRating(messageId: number) {
  delete hoverRatings.value[messageId]
}

function selectedRating(messageId: number) {
  return ratings.value[messageId] || 0
}

function displayRating(messageId: number) {
  return hoverRatings.value[messageId] || ratings.value[messageId] || 0
}

function ratingMood(messageId: number) {
  const rating = selectedRating(messageId)

  if (!rating) return ''
  return rating >= 4 ? 'happy' : 'sad'
}

function selectRating(messageId: number, rating: number) {
  ratings.value[messageId] = rating
  activeParticleMessageId.value = messageId

  window.setTimeout(() => {
    if (activeParticleMessageId.value === messageId) {
      activeParticleMessageId.value = null
    }
  }, 900)

  if (consecutiveFiveStarCount.value >= 3) {
    emit('three-perfect-ratings')
  }
}

function copyResponseText(messageId: number) {
  const message = props.currentChat?.messages.find(msg => msg.id === messageId)

  if (!message || !message.text) return

  navigator.clipboard.writeText(message.text)

  copiedMessageId.value = messageId

  window.setTimeout(() => {
    copiedMessageId.value = null
  }, 1200)
}

function readResponseAloud(message: Message) {
  if (speakingMessageId.value === message.id) {
    window.speechSynthesis.cancel()
    speakingMessageId.value = null
    return
  }

  if (!message.text) return

  window.speechSynthesis.cancel()

  const speech = new SpeechSynthesisUtterance(message.text)
  speech.rate = 0.95
  speech.pitch = 1
  speech.volume = 1

  speakingMessageId.value = message.id

  speech.onend = () => {
    speakingMessageId.value = null
  }

  speech.onerror = () => {
    speakingMessageId.value = null
  }

  window.speechSynthesis.speak(speech)
}
</script>

<style scoped>
.chat-body {
  flex: 1;
  position: relative;
  overflow-y: auto;
  padding: 28px 28px 16px;
  scrollbar-width: thin;
  scrollbar-color: rgba(47, 140, 255, 0.45) rgba(5, 7, 13, 0.65);
}

.chat-body::-webkit-scrollbar {
  width: 10px;
}

.chat-body::-webkit-scrollbar-track {
  background: rgba(5, 7, 13, 0.65);
  border-radius: 999px;
}

.chat-body::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(47, 140, 255, 0.45), rgba(23, 113, 235, 0.25));
  border-radius: 999px;
  border: 2px solid rgba(5, 7, 13, 0.95);
}

.chat-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(77, 163, 255, 0.7), rgba(23, 113, 235, 0.45));
  box-shadow: 0 0 12px rgba(47, 140, 255, 0.35);
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

.assistant-message-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.message-row.user .assistant-message-stack {
  align-items: flex-end;
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

.markdown-body {
  line-height: 1.7;
  color: #dfe6f5;
  word-break: break-word;
}

.markdown-body :deep(p) {
  margin: 0 0 10px;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin: 16px 0 8px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.3;
}

.markdown-body :deep(h1) { font-size: 1.4em; }
.markdown-body :deep(h2) { font-size: 1.25em; }
.markdown-body :deep(h3) { font-size: 1.1em; }

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 6px 0 10px;
  padding-left: 22px;
}

.markdown-body :deep(li) {
  margin-bottom: 4px;
  line-height: 1.7;
}

.markdown-body :deep(li:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(code) {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: #93c5fd;
}

.markdown-body :deep(pre) {
  margin: 10px 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(5, 8, 18, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.07);
  overflow-x: auto;
}

.markdown-body :deep(pre code) {
  padding: 0;
  background: transparent;
  color: #c9d1e0;
  font-size: 13px;
}

.markdown-body :deep(blockquote) {
  margin: 10px 0;
  padding: 8px 14px;
  border-left: 3px solid rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.06);
  border-radius: 0 8px 8px 0;
  color: #9eb4d4;
}

.markdown-body :deep(blockquote p) {
  margin: 0;
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
  font-size: 14px;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
}

.markdown-body :deep(th) {
  background: rgba(255, 255, 255, 0.05);
  color: #c8d6f0;
  font-weight: 600;
}

.markdown-body :deep(a) {
  color: #60a5fa;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.markdown-body :deep(a:hover) {
  color: #93c5fd;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin: 14px 0;
}

.markdown-body :deep(strong) {
  color: #f0f4ff;
  font-weight: 700;
}

.markdown-body :deep(em) {
  color: #c8d6f0;
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

.skip-animation-btn {
  margin-top: 10px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #8792aa;
  font-size: 11px;
  cursor: pointer;
  transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.skip-animation-btn:hover {
  color: #ffffff;
  border-color: rgba(77, 163, 255, 0.35);
  background: rgba(19, 135, 255, 0.08);
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

.response-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 2px;
  animation: ratingFadeIn 0.34s ease;
}

.response-action-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(10, 16, 30, 0.72);
  color: #aeb8cf;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.response-action-btn:hover {
  transform: translateY(-1px);
  color: #ffffff;
  border-color: rgba(77, 163, 255, 0.35);
  background: rgba(19, 135, 255, 0.08);
  box-shadow: 0 0 18px rgba(19, 135, 255, 0.13);
}

.response-action-btn.speaking {
  color: #ffd84d;
  border-color: rgba(255, 216, 77, 0.28);
  box-shadow: 0 0 22px rgba(255, 216, 77, 0.12);
  animation: speakingPulse 1.2s infinite ease-in-out;
}

.response-rating-card {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  padding: 7px 12px;
  margin-left: 2px;
  border-radius: 999px;
  background: rgba(10, 16, 30, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.055);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
  animation: ratingFadeIn 0.34s ease;
  overflow: visible;
}

.rating-label {
  font-size: 12px;
  color: #8792aa;
  white-space: nowrap;
}

.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.star-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.23);
  font-size: 21px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  transform-origin: center;
  transition:
    color 0.18s ease,
    transform 0.18s ease,
    text-shadow 0.18s ease,
    filter 0.18s ease;
}

.star-btn:hover {
  transform: translateY(-2px) scale(1.18) rotate(-4deg);
}

.star-btn.active {
  color: #ffd84d;
  text-shadow:
    0 0 8px rgba(255, 216, 77, 0.65),
    0 0 18px rgba(255, 191, 0, 0.35),
    0 0 28px rgba(255, 183, 0, 0.18);
  filter: drop-shadow(0 0 8px rgba(255, 210, 48, 0.35));
}

.star-btn.locked {
  animation: starPop 0.3s ease;
}

.rating-reaction {
  font-size: 12px;
  color: #aeb8cf;
  white-space: nowrap;
  animation: reactionPop 0.32s ease;
}

.response-rating-card.happyRating {
  border-color: rgba(255, 216, 77, 0.24);
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.18),
    0 0 24px rgba(255, 216, 77, 0.08);
}

.response-rating-card.sadRating {
  border-color: rgba(91, 149, 255, 0.18);
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.18),
    0 0 22px rgba(91, 149, 255, 0.07);
}

.rating-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}

.rating-particles span {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ffd84d;
  box-shadow:
    0 0 10px rgba(255, 216, 77, 0.9),
    0 0 22px rgba(255, 195, 0, 0.45);
  animation: happyParticleBurst 0.82s ease-out forwards;
}

.rating-particles.sadParticles span {
  background: #5da7ff;
  box-shadow:
    0 0 10px rgba(93, 167, 255, 0.75),
    0 0 22px rgba(93, 167, 255, 0.32);
  animation: sadParticleFall 0.82s ease-out forwards;
}

.rating-particles span:nth-child(1) { --x: -70px; --y: -32px; animation-delay: 0s; }
.rating-particles span:nth-child(2) { --x: -52px; --y: -54px; animation-delay: 0.03s; }
.rating-particles span:nth-child(3) { --x: -30px; --y: -70px; animation-delay: 0.06s; }
.rating-particles span:nth-child(4) { --x: 0px; --y: -78px; animation-delay: 0.02s; }
.rating-particles span:nth-child(5) { --x: 32px; --y: -68px; animation-delay: 0.05s; }
.rating-particles span:nth-child(6) { --x: 58px; --y: -46px; animation-delay: 0.07s; }
.rating-particles span:nth-child(7) { --x: 74px; --y: -20px; animation-delay: 0.01s; }
.rating-particles span:nth-child(8) { --x: 62px; --y: 28px; animation-delay: 0.04s; }
.rating-particles span:nth-child(9) { --x: 34px; --y: 48px; animation-delay: 0.08s; }
.rating-particles span:nth-child(10) { --x: 4px; --y: 58px; animation-delay: 0.02s; }
.rating-particles span:nth-child(11) { --x: -32px; --y: 46px; animation-delay: 0.05s; }
.rating-particles span:nth-child(12) { --x: -60px; --y: 24px; animation-delay: 0.07s; }
.rating-particles span:nth-child(13) { --x: -76px; --y: 4px; animation-delay: 0.04s; }
.rating-particles span:nth-child(14) { --x: 82px; --y: 4px; animation-delay: 0.06s; }

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

@keyframes ratingFadeIn {
  0% {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes starPop {
  0% {
    transform: scale(0.75);
  }

  55% {
    transform: scale(1.25) rotate(-8deg);
  }

  100% {
    transform: scale(1);
  }
}

@keyframes reactionPop {
  0% {
    opacity: 0;
    transform: translateX(-4px) scale(0.94);
  }

  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes happyParticleBurst {
  0% {
    transform: translate(-50%, -50%) scale(0.4);
    opacity: 0;
  }

  20% {
    opacity: 1;
  }

  100% {
    transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1.15);
    opacity: 0;
  }
}

@keyframes sadParticleFall {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0;
  }

  18% {
    opacity: 1;
  }

  100% {
    transform: translate(calc(-50% + (var(--x) * 0.35)), calc(-50% + 62px)) scale(0.85);
    opacity: 0;
  }
}

@keyframes speakingPulse {
  0%, 100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.04);
  }
}

@media (max-width: 760px) {
  .response-rating-card {
    flex-wrap: wrap;
    border-radius: 18px;
  }

  .rating-label,
  .rating-reaction {
    width: 100%;
  }

  .response-actions {
    flex-wrap: wrap;
  }
}
</style>