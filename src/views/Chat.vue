<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { authService } from '@/services/authService'

import LightTheme from '@/components/LightTheme.vue'
import Intro from '@/components/Intro.vue'
import ChatSidebar from '@/components/ChatSidebar.vue'
import ChatTopbar from '@/components/ChatTopbar.vue'
import ChatMessages from '@/components/ChatMessages.vue'
import ChatInput from '@/components/ChatInput.vue'
import ThemeEffects from '@/components/ThemeEffects.vue'
import AIPetModal from '@/components/AIPetModal.vue'

import mainLogo from '@/assets/oconnors-logo.png'
import logoPng from '@/assets/logo.png'
import chatLogo from '@/assets/chat-logo.png'

type MessageDocument = {
  id: string
  name: string
  file: File
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

const router = useRouter()
const userStore = useUserStore()

const showIntro = ref(true)
const isConnected = ref(false)
const aiStatus = ref('Connecting...')
const isSidebarExpanded = ref(true)
const isBrandHovered = ref(false)
const isLeavingPage = ref(false)
const showAIPetModal = ref(false)

const isLightTheme = ref(false)

const themeTransition = ref<'light-wipe' | 'dark-wipe' | null>(null)

const showFireworks = ref(false)

const inputValue = ref('')
const searchQuery = ref('')

const openMenuChatId = ref<number | null>(null)

const editingChatId = ref<number | null>(null)
const editingChatName = ref('')

const animatedText = ref('')

const isGenerating = ref(false)
const generatingMessageId = ref<number | null>(null)
const thinkingMessageId = ref<number | null>(null)

const isChatNearBottom = ref(true)

const typingSpeed = 18

let typingIntervalId: number | null = null
let responseTimeoutId: number | null = null

const phrases = [
  'Ask about specific projects',
  'Troubleshoot a problem',
  'Ask a question'
]

let phraseIndex = 0
let charIndex = 0
let isDeleting = false
let typeTimeout: number | null = null

const activeTypingIntervals = new Set<number>()

const displayName = computed(() => {
  const fullName = userStore.account?.name?.trim() || 'User'
  return fullName.split(' ')[0]
})

const displayRole = computed(() => {
  const email = userStore.account?.username?.toLowerCase() || ''

  if (email.includes('student')) return 'Student'
  if (email.includes('staff')) return 'Staff'
  if (email.includes('admin')) return 'Admin'

  return 'User'
})

const userInitial = computed(() => {
  return displayName.value.charAt(0).toUpperCase()
})

const userPhoto = computed(() => {
  return (userStore as any).account?.idTokenClaims?.picture || ''
})

const chats = ref<ChatItem[]>([
  {
    id: 1,
    name: 'New Chat',
    messages: [],
    selectedDocumentId: null
  }
])

const selectedChatId = ref(1)

let nextChatId = 2
let nextMessageId = 1

const currentChat = computed(() => {
  return chats.value.find(chat => chat.id === selectedChatId.value) || null
})

const filteredChats = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return chats.value
  }

  return chats.value.filter(chat =>
    chat.name.toLowerCase().includes(query)
  )
})

const selectedChatName = computed(() => {
  const selected = chats.value.find(chat => chat.id === selectedChatId.value)
  return selected?.name || 'New Chat'
})

const showWelcome = computed(() => {
  return !!currentChat.value && currentChat.value.messages.length === 0
})

function typeLoop() {
  const currentPhrase = phrases[phraseIndex]

  if (!isDeleting) {
    charIndex++
    animatedText.value = currentPhrase.substring(0, charIndex)
  } else {
    charIndex--
    animatedText.value = currentPhrase.substring(0, charIndex)
  }

  let speed = isDeleting ? 45 : 75

  if (!isDeleting && charIndex === currentPhrase.length) {
    speed = 1100
    isDeleting = true
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false
    phraseIndex = (phraseIndex + 1) % phrases.length
    speed = 350
  }

  typeTimeout = window.setTimeout(typeLoop, speed)
}

function typeAssistantMessage(
  fullText: string,
  done: (typed: string) => void,
  complete: () => void
) {
  let index = 0
  let typed = ''

  typingIntervalId = window.setInterval(() => {
    typed += fullText[index]

    done(typed)

    index++

    if (index >= fullText.length) {
      if (typingIntervalId !== null) {
        clearInterval(typingIntervalId)

        activeTypingIntervals.delete(typingIntervalId)

        typingIntervalId = null
      }

      complete()
    }
  }, typingSpeed)

  activeTypingIntervals.add(typingIntervalId)
}

function toggleSidebar() {
  isSidebarExpanded.value = !isSidebarExpanded.value
}

function handleBrandButtonClick() {
  if (!isSidebarExpanded.value) {
    isSidebarExpanded.value = true
    return
  }

  showAIPetModal.value = true
}

async function expandAndFocusSearch() {
  isSidebarExpanded.value = true

  await nextTick()
}

function closeMenuOutside() {
  openMenuChatId.value = null
}

function handleSearchEnter() {
  const firstMatch = filteredChats.value[0]

  if (firstMatch) {
    selectedChatId.value = firstMatch.id
  }
}

function toggleMenu(chatId: number) {
  openMenuChatId.value =
    openMenuChatId.value === chatId ? null : chatId
}

function selectChatById(chatId: number) {
  selectedChatId.value = chatId
  openMenuChatId.value = null
}

function renameChat(chatId: number) {
  const chat = chats.value.find(item => item.id === chatId)

  if (!chat) return

  editingChatId.value = chatId
  editingChatName.value = chat.name

  openMenuChatId.value = null
}

function saveInlineRename(chatId: number) {
  const chat = chats.value.find(item => item.id === chatId)

  if (!chat) return

  if (editingChatName.value.trim()) {
    chat.name = editingChatName.value.trim()
  }

  editingChatId.value = null
  editingChatName.value = ''
}

function updateAIStatus(status: string) {
  aiStatus.value = status
}

function cancelInlineRename() {
  editingChatId.value = null
  editingChatName.value = ''
} 
function deleteChat(chatId: number) {
  if (chats.value.length === 1) {
    chats.value[0] = {
      id: chats.value[0].id,
      name: 'New Chat',
      messages: [],
      selectedDocumentId: null
    }

    selectedChatId.value = chats.value[0].id
    openMenuChatId.value = null
    inputValue.value = ''

    return
  }

  const chatIndex = chats.value.findIndex(chat => chat.id === chatId)

  if (chatIndex === -1) return

  chats.value.splice(chatIndex, 1)

  if (selectedChatId.value === chatId) {
    selectedChatId.value = chats.value[0].id
    inputValue.value = ''
  }

  openMenuChatId.value = null
}

function startNewChat() {
  const newChat: ChatItem = {
    id: nextChatId++,
    name: 'New Chat',
    messages: [],
    selectedDocumentId: null
  }

  chats.value.unshift(newChat)

  selectedChatId.value = newChat.id

  inputValue.value = ''
  searchQuery.value = ''

  openMenuChatId.value = null
}

function getFileBadge(fileName: string) {
  const extension =
    fileName.split('.').pop()?.toLowerCase() || ''

  if (extension === 'pdf') return 'PDF'

  if (['doc', 'docx'].includes(extension)) return 'DOC'

  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'XLS'

  if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) return 'IMG'

  return 'FILE'
}

function isDocumentSelected() {
  return false
}

function openDocumentFromMessage() {
  return
}

function handleChatScrollState(isNearBottom: boolean) {
  isChatNearBottom.value = isNearBottom
}

function stopGeneration() {
  if (!currentChat.value || !isGenerating.value) return

  if (responseTimeoutId !== null) {
    clearTimeout(responseTimeoutId)
    responseTimeoutId = null
  }

  if (typingIntervalId !== null) {
    clearInterval(typingIntervalId)

    activeTypingIntervals.delete(typingIntervalId)

    typingIntervalId = null
  }

  const selectedChat = currentChat.value

  const thinkingIndex = selectedChat.messages.findIndex(
    msg => msg.id === thinkingMessageId.value
  )

  if (thinkingIndex !== -1) {
    selectedChat.messages.splice(thinkingIndex, 1, {
      id: nextMessageId++,
      role: 'assistant',
      text: 'Response generation was interrupted by the user.'
    })
  } else if (generatingMessageId.value !== null) {
    const message = selectedChat.messages.find(
      msg => msg.id === generatingMessageId.value
    )

    if (message) {
      message.text = message.text.trim()
        ? `${message.text}\n\nResponse generation was interrupted by the user.`
        : 'Response generation was interrupted by the user.'
    }
  }

  isGenerating.value = false
  generatingMessageId.value = null
  thinkingMessageId.value = null
  updateAIStatus('Ready')
}

function sendMessage() {
  const text = inputValue.value.trim()

  if (!text || !currentChat.value || isGenerating.value) return

  currentChat.value.messages.push({
    id: nextMessageId++,
    role: 'user',
    text
  })

  if (currentChat.value.name === 'New Chat') {
    currentChat.value.name =
      text.length > 28
        ? text.slice(0, 28) + '...'
        : text
  }

  inputValue.value = ''

  isGenerating.value = true
  isChatNearBottom.value = true
  updateAIStatus('Thinking...')

  const newThinkingMessageId = nextMessageId++

  thinkingMessageId.value = newThinkingMessageId

  currentChat.value.messages.push({
    id: newThinkingMessageId,
    role: 'thinking',
    text: ''
  })

  responseTimeoutId = window.setTimeout(() => {
    updateAIStatus('Searching documents...')
    const selectedChat = chats.value.find(
      chat => chat.id === selectedChatId.value
    )

    if (!selectedChat) return

    const thinkingIndex = selectedChat.messages.findIndex(
      msg => msg.id === newThinkingMessageId
    )

    if (thinkingIndex !== -1) {
      const assistantMessage: Message = {
        id: nextMessageId++,
        role: 'assistant',
        text: ''
      }

      generatingMessageId.value = assistantMessage.id

      selectedChat.messages.splice(
        thinkingIndex,
        1,
        assistantMessage
      )

      updateAIStatus('Generating response...')

      typeAssistantMessage(
        'I understand. This is a sample response area where the chatbot answer will appear.',
        typed => {
          const liveChat = chats.value.find(
            chat => chat.id === selectedChatId.value
          )

          if (!liveChat) return

          const liveMessage = liveChat.messages.find(
            msg => msg.id === assistantMessage.id
          )

          if (!liveMessage) return

          liveMessage.text = typed
        },
        () => {
          updateAIStatus('Memory updated')

          window.setTimeout(() => {
            updateAIStatus('Ready')
          }, 1800)
          isGenerating.value = false
          generatingMessageId.value = null
          thinkingMessageId.value = null
          responseTimeoutId = null
        }
      )
    }
  }, 1800)
}

function toggleTheme() {
  themeTransition.value =
    isLightTheme.value
      ? 'dark-wipe'
      : 'light-wipe'

  window.setTimeout(() => {
    isLightTheme.value = !isLightTheme.value
  }, 280)

  window.setTimeout(() => {
    themeTransition.value = null
  }, 850)
}

function triggerFireworks() {
  showFireworks.value = true

  window.setTimeout(() => {
    showFireworks.value = false
  }, 1500)
}

async function handleLogout() {
  isLeavingPage.value = true

  await new Promise(resolve => setTimeout(resolve, 260))

  await authService.logout()

  router.push('/login')
}

onMounted(() => {
  window.setTimeout(() => {
    isConnected.value = true
    updateAIStatus('Ready to chat!')
  }, 1800)

  window.setTimeout(() => {
    showIntro.value = false
  }, 3200)

  window.setTimeout(() => {
    const nav =
      navigator as Navigator & {
        vibrate?: (
          pattern: number | number[]
        ) => boolean
      }

    nav.vibrate?.([30, 40, 30])
  }, 550)

  window.addEventListener('click', closeMenuOutside)

  typeLoop()
})

onBeforeUnmount(() => {
  window.removeEventListener(
    'click',
    closeMenuOutside
  )

  if (typeTimeout !== null) {
    clearTimeout(typeTimeout)
  }

  if (responseTimeoutId !== null) {
    clearTimeout(responseTimeoutId)
  }

  if (typingIntervalId !== null) {
    clearInterval(typingIntervalId)
  }

  activeTypingIntervals.forEach(interval =>
    clearInterval(interval)
  )

  activeTypingIntervals.clear()
})
</script>

<template>
  <LightTheme :is-light-theme="isLightTheme">
    <div class="chat-page">
      <Intro
        :show-intro="showIntro"
        :main-logo="mainLogo"
        :sidebar-expanded="isSidebarExpanded"
      />

      <ThemeEffects
        :theme-transition="themeTransition"
        :show-fireworks="showFireworks"
      />

      <AIPetModal
        :show="showAIPetModal"
        @close="showAIPetModal = false"
      />

      <div
        class="page-transition-overlay"
        :class="{ active: isLeavingPage }"
      ></div>

      <ChatSidebar
        :show-intro="showIntro"
        :is-sidebar-expanded="isSidebarExpanded"
        :is-brand-hovered="isBrandHovered"
        :main-logo="isLightTheme ? logoPng : mainLogo"
        :chat-logo="chatLogo"
        :search-query="searchQuery"
        :filtered-chats="filteredChats"
        :selected-chat-id="selectedChatId"
        :selected-chat-name="selectedChatName"
        :open-menu-chat-id="openMenuChatId"
        :editing-chat-id="editingChatId"
        :editing-chat-name="editingChatName"
        :display-name="displayName"
        :display-role="displayRole"
        :user-initial="userInitial"
        :user-photo="userPhoto"
        @toggle-sidebar="toggleSidebar"
        @brand-click="handleBrandButtonClick"
        @brand-hover="isBrandHovered = $event"
        @update-search="searchQuery = $event"
        @search-enter="handleSearchEnter"
        @select-chat="selectChatById"
        @toggle-menu="toggleMenu"
        @rename-chat="renameChat"
        @delete-chat="deleteChat"
        @update-editing-name="editingChatName = $event"
        @save-rename="saveInlineRename"
        @cancel-rename="cancelInlineRename"
        @new-chat="startNewChat"
        @logout="handleLogout"
        @expand-sidebar="isSidebarExpanded = true"
        @expand-search="expandAndFocusSearch"
      />

      <main class="main-content">
        <div class="chat-panel">
          <ChatTopbar
            :show-intro="showIntro"
            :is-connected="isConnected"
            :is-light-theme="isLightTheme"
            :ai-status="aiStatus"
            @new-chat="startNewChat"
            @toggle-theme="toggleTheme"
          />

                    <ChatMessages
            :class="{ introMessages: showIntro }"
            :current-chat="currentChat"
            :show-welcome="showWelcome"
            :display-name="displayName"
            :animated-text="animatedText"
            :main-logo="mainLogo"
            :ai-logo="mainLogo"
            :is-document-selected="isDocumentSelected"
            :get-file-badge="getFileBadge"
            :generating-message-id="generatingMessageId"
            @close-menu="openMenuChatId = null"
            @open-document="openDocumentFromMessage"
            @scroll-state="handleChatScrollState"
            @three-perfect-ratings="triggerFireworks"
          />

          <div :class="{ introInput: showIntro }">
            <Transition name="reply-indicator">
              <div
                v-if="
                  isGenerating &&
                  !isChatNearBottom
                "
                class="floating-reply-indicator"
              >
                <span></span>
                <span></span>
                <span></span>
              </div>
            </Transition>

            <ChatInput
              :input-value="inputValue"
              :is-generating="isGenerating"
              @update-input="inputValue = $event"
              @send-message="sendMessage"
              @stop-message="stopGeneration"
            />
          </div>
        </div>
      </main>
    </div>
  </LightTheme>
</template>

<style scoped>
.chat-page {
  display: flex;
  height: 100vh;

  background:
    radial-gradient(
      circle at center,
      rgba(0, 102, 255, 0.05) 0%,
      transparent 35%
    ),
    linear-gradient(
      180deg,
      #05070d 0%,
      #03050a 100%
    );

  color: #ffffff;

  font-family: 'Inter', sans-serif;

  overflow: hidden;
  position: relative;
}

.page-transition-overlay {
  position: absolute;
  inset: 0;

  background: rgba(2, 4, 10, 0.95);

  opacity: 0;

  pointer-events: none;

  transition: opacity 0.26s ease;

  z-index: 100;
}

.page-transition-overlay.active {
  opacity: 1;
}

.main-content {
  flex: 1;

  display: flex;

  min-width: 0;

  position: relative;

  overflow: hidden;
}

.chat-panel {
  flex: 1;

  display: flex;
  flex-direction: column;

  min-width: 0;

  transition: width 0.34s ease;
}

.floating-reply-indicator {
  width: 78px;
  height: 48px;

  margin: 0 auto 10px;

  border-radius: 28px;

  border: 1px solid rgba(255, 255, 255, 0.15);

  background: rgba(16, 20, 32, 0.88);

  box-shadow:
    0 0 22px rgba(47, 140, 255, 0.14),
    inset 0 0 18px rgba(255, 255, 255, 0.03);

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 7px;
}

.floating-reply-indicator span {
  width: 7px;
  height: 7px;

  border-radius: 50%;

  background: #dfe6f5;

  animation:
    floatingDotBounce 1.1s infinite ease-in-out;
}

.floating-reply-indicator span:nth-child(2) {
  animation-delay: 0.15s;
}

.floating-reply-indicator span:nth-child(3) {
  animation-delay: 0.3s;
}

.reply-indicator-enter-active,
.reply-indicator-leave-active {
  transition:
    all 0.24s
    cubic-bezier(0.18, 0.9, 0.25, 1.2);
}

.reply-indicator-enter-from,
.reply-indicator-leave-to {
  opacity: 0;

  transform:
    translateY(16px)
    scale(0.72);
}

.introMessages {
  animation:
    messagesIntro 0.8s ease both;

  animation-delay: 2.7s;
}

.introInput {
  animation:
    inputIntro 0.8s ease both;

  animation-delay: 2.9s;
}

@keyframes floatingDotBounce {
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.45;
  }

  40% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

@keyframes messagesIntro {
  from {
    transform:
      translateY(36px)
      scale(0.98);

    opacity: 0;
  }

  to {
    transform:
      translateY(0)
      scale(1);

    opacity: 1;
  }
}

@keyframes inputIntro {
  from {
    transform: translateY(70px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>