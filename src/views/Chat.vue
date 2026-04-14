<template>
  <div class="chat-page">
    <div class="page-transition-overlay" :class="{ active: isLeavingPage }"></div>

    <aside class="sidebar" :class="{ collapsed: !isSidebarExpanded }">
      <div class="sidebar-top">
        <button
          class="brand-button"
          :class="{ collapsed: !isSidebarExpanded }"
          @click="handleBrandButtonClick"
          @mouseenter="isBrandHovered = true"
          @mouseleave="isBrandHovered = false"
        >
          <div v-if="isSidebarExpanded" class="brand">
            <div class="brand-logo-wrap">
              <div class="brand-pulse brand-pulse-1"></div>
              <div class="brand-pulse brand-pulse-2"></div>
              <div class="brand-logo">
                <img :src="mainLogo" alt="O'Connors AI" />
              </div>
            </div>

            <div class="brand-text">O'Connors AI</div>
          </div>

          <div v-else class="collapsed-brand">
            <img
              v-if="!isBrandHovered"
              :src="mainLogo"
              alt="O'Connors AI"
              class="collapsed-brand-logo"
            />
            <span v-else class="collapsed-sidebar-icon">☰</span>
          </div>
        </button>

        <button
          v-if="isSidebarExpanded"
          class="sidebar-toggle-icon-btn"
          @click="toggleSidebar"
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
        >
          <span>⟨</span>
        </button>
      </div>

      <template v-if="isSidebarExpanded">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search..."
            @keyup.enter="handleSearchEnter"
          />
        </div>

        <div class="nav-section">
          <button
            class="nav-item"
            :class="{ active: activeMode === 'chat' }"
            @click="activeMode = 'chat'"
          >
            <img :src="mainLogo" alt="Chatbot" class="nav-image-icon nav-chat-logo" />
            <span>Chatbot</span>
          </button>

          <button
            class="nav-item"
            :class="{ active: activeMode === 'doc' }"
            @click="activeMode = 'doc'"
          >
            <img :src="docLogo" alt="Document viewer" class="nav-image-icon" />
            <span>Chat + Doc Viewer</span>
          </button>
        </div>

        <div class="history-section">
          <p class="history-title">CHAT HISTORY</p>

          <TransitionGroup name="chat-delete" tag="div" class="history-list">
            <div
              v-for="chat in filteredChats"
              :key="chat.id"
              class="history-item"
              :class="{ selected: selectedChatId === chat.id }"
              @click="selectChatById(chat.id)"
            >
              <div class="history-left">
                <img :src="mainLogo" alt="Chat" class="history-img-icon" />
                <span class="history-text">{{ chat.name }}</span>
              </div>

              <div class="history-actions">
                <button class="history-menu" @click.stop="toggleMenu(chat.id)">•••</button>

                <div v-if="openMenuChatId === chat.id" class="history-dropdown">
                  <button @click.stop="renameChat(chat.id)">Rename</button>
                  <button class="delete-action" @click.stop="deleteChat(chat.id)">
                    Delete Chat
                  </button>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <div class="sidebar-bottom">
          <div class="profile-card">
            <div class="profile-avatar">
              <img v-if="userPhoto" :src="userPhoto" alt="Profile photo" class="profile-photo" />
              <span v-else>{{ userInitial }}</span>
            </div>
            <div class="profile-info">
              <div class="profile-name">{{ displayName }}</div>
              <div class="profile-role">{{ displayRole }}</div>
            </div>
          </div>

          <button class="logout-btn" @click="handleLogout">
            <span class="logout-icon">↩</span>
            <span>Logout</span>
          </button>
        </div>
      </template>

      <template v-else>
        <div class="collapsed-rail">
          <button
            class="collapsed-rail-item"
            :class="{ active: activeMode === 'chat' }"
            @click="activeMode = 'chat'"
            title="Chatbot"
            aria-label="Chatbot"
          >
            <img :src="mainLogo" alt="Chatbot" class="collapsed-rail-icon collapsed-chat-logo" />
            <span class="collapsed-tooltip">Chatbot</span>
          </button>

          <button
            class="collapsed-rail-item"
            :class="{ active: activeMode === 'doc' }"
            @click="activeMode = 'doc'"
            title="Chat + Doc Viewer"
            aria-label="Chat + Doc Viewer"
          >
            <img :src="docLogo" alt="Doc Viewer" class="collapsed-rail-icon" />
            <span class="collapsed-tooltip">Chat + Doc Viewer</span>
          </button>

          <button
            class="collapsed-rail-item"
            @click="expandAndFocusSearch"
            title="Search"
            aria-label="Search"
          >
            <span class="collapsed-search-icon">⌕</span>
            <span class="collapsed-tooltip">Search</span>
          </button>

          <button
            class="collapsed-rail-item"
            @click="startNewChat"
            title="New Chat"
            aria-label="New Chat"
          >
            <img :src="mainLogo" alt="New Chat" class="collapsed-rail-icon collapsed-chat-logo" />
            <span class="collapsed-tooltip">New Chat</span>
          </button>

          <div class="collapsed-rail-divider"></div>

          <button
            class="collapsed-rail-item selected-chat-item"
            @click="isSidebarExpanded = true"
            :title="selectedChatName"
            aria-label="Current selected chat"
          >
            <img :src="mainLogo" alt="Current Chat" class="collapsed-rail-icon collapsed-chat-logo" />
            <span class="collapsed-tooltip current-chat-tooltip">
              {{ selectedChatName }}
            </span>
          </button>
        </div>

        <div class="collapsed-bottom">
          <button class="collapsed-logout-btn" @click="handleLogout" title="Logout" aria-label="Logout">
            <span class="collapsed-logout-icon">↩</span>
            <span class="collapsed-tooltip">Logout</span>
          </button>

          <button
            class="collapsed-user-btn"
            @click="isSidebarExpanded = true"
            :title="displayName"
            aria-label="User profile"
          >
            <div class="collapsed-user-avatar">
              <img v-if="userPhoto" :src="userPhoto" alt="Profile photo" class="profile-photo" />
              <span v-else>{{ userInitial }}</span>
            </div>
            <span class="collapsed-tooltip">{{ displayName }}</span>
          </button>
        </div>
      </template>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <div class="topbar-left">
          <h1>Chatbot Assistant</h1>

          <transition name="fade-slide" mode="out-in">
            <span v-if="isConnected" key="ready" class="status-pill ready">
              <span class="status-dot ready-dot"></span>
              Ready
            </span>

            <span v-else key="connecting" class="status-pill connecting">
              <span class="status-dot connecting-dot"></span>
              Connecting...
            </span>
          </transition>
        </div>

        <button class="new-chat-btn" @click="startNewChat">
          ＋ New Chat
        </button>
      </header>

      <section class="chat-body" @click="openMenuChatId = null">
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
              v-if="message.role === 'assistant' || message.role === 'thinking'"
              class="assistant-icon"
            >
              <img :src="aiLogo" alt="AI" />
            </div>

            <div
              class="message-bubble"
              :class="{ thinkingBubble: message.role === 'thinking' }"
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

                <div v-if="message.text">{{ message.text }}</div>
              </template>
            </div>
          </div>
        </div>
      </section>

      <footer class="chat-input-wrap">
        <div class="chat-input-shell">
          <div v-if="attachedFiles.length" class="attached-files-row">
            <div
              v-for="file in attachedFiles"
              :key="file.name + file.lastModified + file.size"
              class="attached-file-chip"
            >
              <div class="attached-file-left">
                <div class="file-badge">{{ getFileBadge(file.name) }}</div>
                <span class="attached-file-name">{{ file.name }}</span>
              </div>

              <button
                class="remove-file-btn"
                @click="removeAttachedFile(file)"
                aria-label="Remove file"
              >
                ×
              </button>
            </div>
          </div>

          <div class="chat-input-bar">
            <input
              ref="fileInputRef"
              type="file"
              class="hidden-file-input"
              multiple
              @change="handleFileChange"
            />

            <button class="attach-btn" @click="openFilePicker">
              <img :src="attachLogo" alt="Attach file" class="attach-btn-icon" />
            </button>

            <input
              v-model="inputValue"
              type="text"
              :placeholder="
                attachedFiles.length
                  ? 'Ask about this document...'
                  : 'Ask a question or describe an issue...'
              "
              @keyup.enter="sendMessage"
            />

            <button class="send-btn" @click="sendMessage">➤</button>
          </div>
        </div>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { authService } from '@/services/authService'
import mainLogo from '@/assets/oconnors-logo.png'
import aiLogo from '@/assets/ai-logo.png'
import docLogo from '@/assets/doc-logo.png'
import attachLogo from '@/assets/attach-logo.png'

type MessageRole = 'user' | 'assistant' | 'thinking'

type Message = {
  id: number
  role: MessageRole
  text: string
  fileNames?: string[]
}

type ChatItem = {
  id: number
  name: string
  messages: Message[]
}

const router = useRouter()
const userStore = useUserStore()

const activeMode = ref<'chat' | 'doc'>('chat')
const isConnected = ref(false)
const isSidebarExpanded = ref(true)
const isBrandHovered = ref(false)
const isLeavingPage = ref(false)
const inputValue = ref('')
const searchQuery = ref('')
const openMenuChatId = ref<number | null>(null)
const animatedText = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const attachedFiles = ref<File[]>([])

const phrases = [
  'Ask about specific projects',
  'Upload a manual for reference',
  'Troubleshoot a problem'
]

let phraseIndex = 0
let charIndex = 0
let isDeleting = false
let typeTimeout: number | null = null

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

const userInitial = computed(() => displayName.value.charAt(0).toUpperCase())
const userPhoto = computed(() => (userStore as any).account?.idTokenClaims?.picture || '')

const chats = ref<ChatItem[]>([
  {
    id: 1,
    name: 'New Chat',
    messages: []
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
  if (!query) return chats.value
  return chats.value.filter(chat => chat.name.toLowerCase().includes(query))
})

const selectedChatName = computed(() => {
  const selected = chats.value.find(chat => chat.id === selectedChatId.value)
  return selected?.name || 'New Chat'
})

const showWelcome = computed(() => {
  return !!currentChat.value &&
    currentChat.value.messages.length === 0 &&
    inputValue.value.trim() === ''
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

function toggleSidebar() {
  isSidebarExpanded.value = !isSidebarExpanded.value
}

function handleBrandButtonClick() {
  if (!isSidebarExpanded.value) {
    isSidebarExpanded.value = true
  }
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
  openMenuChatId.value = openMenuChatId.value === chatId ? null : chatId
}

function selectChatById(chatId: number) {
  selectedChatId.value = chatId
  openMenuChatId.value = null
}

function renameChat(chatId: number) {
  const chat = chats.value.find(item => item.id === chatId)
  if (!chat) return

  const newName = window.prompt('Rename chat', chat.name)

  if (newName && newName.trim()) {
    chat.name = newName.trim()
  }

  openMenuChatId.value = null
}

function deleteChat(chatId: number) {
  if (chats.value.length === 1) {
    chats.value[0] = {
      id: chats.value[0].id,
      name: 'New Chat',
      messages: []
    }
    selectedChatId.value = chats.value[0].id
    openMenuChatId.value = null
    inputValue.value = ''
    attachedFiles.value = []
    return
  }

  const chatIndex = chats.value.findIndex(chat => chat.id === chatId)
  if (chatIndex === -1) return

  chats.value.splice(chatIndex, 1)

  if (selectedChatId.value === chatId) {
    selectedChatId.value = chats.value[0].id
    inputValue.value = ''
    attachedFiles.value = []
  }

  openMenuChatId.value = null
}

function startNewChat() {
  const newChat: ChatItem = {
    id: nextChatId++,
    name: 'New Chat',
    messages: []
  }

  chats.value.unshift(newChat)
  selectedChatId.value = newChat.id
  inputValue.value = ''
  searchQuery.value = ''
  attachedFiles.value = []
  openMenuChatId.value = null

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (!files || files.length === 0) return

  const newFiles = Array.from(files)

  for (const file of newFiles) {
    const exists = attachedFiles.value.some(
      existing =>
        existing.name === file.name &&
        existing.lastModified === file.lastModified &&
        existing.size === file.size
    )

    if (!exists) {
      attachedFiles.value.push(file)
    }
  }

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function removeAttachedFile(fileToRemove: File) {
  attachedFiles.value = attachedFiles.value.filter(
    file =>
      !(
        file.name === fileToRemove.name &&
        file.lastModified === fileToRemove.lastModified &&
        file.size === fileToRemove.size
      )
  )

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function getFileBadge(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() || ''

  if (extension === 'pdf') return 'PDF'
  if (['doc', 'docx'].includes(extension)) return 'DOC'
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'XLS'
  if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) return 'IMG'
  return 'FILE'
}

function sendMessage() {
  const text = inputValue.value.trim()

  if (!text && !attachedFiles.value.length) return
  if (!currentChat.value) return

  currentChat.value.messages.push({
    id: nextMessageId++,
    role: 'user',
    text,
    fileNames: attachedFiles.value.map(file => file.name)
  })

  inputValue.value = ''

  const thinkingMessageId = nextMessageId++

  currentChat.value.messages.push({
    id: thinkingMessageId,
    role: 'thinking',
    text: ''
  })

  attachedFiles.value = []
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }

  window.setTimeout(() => {
    const selectedChat = chats.value.find(chat => chat.id === selectedChatId.value)
    if (!selectedChat) return

    const thinkingIndex = selectedChat.messages.findIndex(
      msg => msg.id === thinkingMessageId
    )

    if (thinkingIndex !== -1) {
      selectedChat.messages.splice(thinkingIndex, 1, {
        id: nextMessageId++,
        role: 'assistant',
        text: 'I understand. This is a sample response area where the chatbot answer will appear.'
      })
    }
  }, 1200)
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
  }, 1800)

  window.addEventListener('click', closeMenuOutside)
  typeLoop()
})

onBeforeUnmount(() => {
  window.removeEventListener('click', closeMenuOutside)

  if (typeTimeout !== null) {
    clearTimeout(typeTimeout)
  }
})
</script>

<style scoped>
.chat-page {
  display: flex;
  height: 100vh;
  background:
    radial-gradient(circle at center, rgba(0, 102, 255, 0.05) 0%, transparent 35%),
    linear-gradient(180deg, #05070d 0%, #03050a 100%);
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

.sidebar {
  width: 308px;
  min-width: 308px;
  max-width: 308px;
  background: linear-gradient(180deg, rgba(10, 16, 32, 0.97), rgba(6, 10, 22, 0.99));
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  padding: 16px 16px 22px;
  overflow: hidden;
  transition:
    width 0.28s ease,
    min-width 0.28s ease,
    max-width 0.28s ease,
    padding 0.28s ease;
}

.sidebar.collapsed {
  width: 82px;
  min-width: 82px;
  max-width: 82px;
  padding: 16px 10px 18px;
}

.sidebar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.brand-button {
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  cursor: pointer;
  flex: 1;
  text-align: left;
}

.brand-button.collapsed {
  display: flex;
  justify-content: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 6px 8px 12px;
}

.brand-logo-wrap {
  position: relative;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-pulse {
  position: absolute;
  border-radius: 50%;
  background: rgba(43, 140, 255, 0.18);
  animation: heartbeatGlow 2.2s infinite ease-in-out;
}

.brand-pulse-1 {
  width: 46px;
  height: 46px;
}

.brand-pulse-2 {
  width: 58px;
  height: 58px;
  animation-delay: 0.35s;
}

.brand-logo {
  position: relative;
  z-index: 2;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(41, 121, 255, 0.5);
}

.brand-logo img,
.collapsed-brand-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: drop-shadow(0 0 16px rgba(37, 99, 235, 0.55));
}

.brand-text {
  font-size: 16px;
  font-weight: 700;
  color: #f4f7ff;
}

.collapsed-brand {
  width: 52px;
  height: 52px;
  margin: 2px auto 6px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, transform 0.2s ease;
}

.brand-button.collapsed:hover .collapsed-brand {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-1px);
}

.collapsed-brand-logo {
  width: 38px;
  height: 38px;
  border-radius: 50%;
}

.collapsed-sidebar-icon {
  font-size: 24px;
  color: #dce7ff;
  line-height: 1;
}

.sidebar-toggle-icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(90, 140, 255, 0.22);
  background: rgba(12, 18, 32, 0.72);
  color: #9ec3ff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.22s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar-toggle-icon-btn:hover {
  background: rgba(19, 33, 58, 0.88);
  border-color: rgba(90, 140, 255, 0.38);
  box-shadow: 0 0 18px rgba(37, 99, 235, 0.14);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 14px;
  border-radius: 14px;
  background: rgba(9, 14, 28, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 22px;
}

.search-icon {
  color: #77809a;
  font-size: 14px;
}

.search-box input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #d8def0;
  font-size: 14px;
}

.search-box input::placeholder {
  color: #6d7488;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.nav-item {
  height: 46px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  background: transparent;
  border: none;
  border-radius: 16px;
  color: #aeb8cf;
  font-size: 15px;
  cursor: pointer;
  text-align: left;
  transition: all 0.25s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.13);
  color: #ffffff;
  font-weight: 600;
}

.nav-image-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
}

.nav-chat-logo {
  border-radius: 50%;
}

.collapsed-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin-top: 8px;
  padding-top: 10px;
  position: relative;
}

.collapsed-rail-divider {
  width: 36px;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 4px 0 2px;
}

.collapsed-rail-item,
.collapsed-user-btn,
.collapsed-logout-btn {
  width: 52px;
  height: 52px;
  border: none;
  border-radius: 18px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition:
    background 0.22s ease,
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.collapsed-rail-item:hover,
.collapsed-user-btn:hover,
.collapsed-logout-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-1px);
}

.collapsed-rail-item.active,
.selected-chat-item {
  background: rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 0 0 1px rgba(17, 132, 255, 0.16),
    0 0 16px rgba(17, 132, 255, 0.08);
}

.collapsed-rail-icon {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.collapsed-chat-logo {
  border-radius: 50%;
}

.collapsed-search-icon,
.collapsed-logout-icon {
  font-size: 28px;
  line-height: 1;
  color: #dce7ff;
}

.collapsed-rail-item.active .collapsed-rail-icon,
.selected-chat-item .collapsed-rail-icon {
  filter: drop-shadow(0 0 6px rgba(17, 132, 255, 0.35));
}

.collapsed-tooltip {
  position: absolute;
  left: 62px;
  top: 50%;
  transform: translateY(-50%) translateX(-4px);
  background: rgba(14, 18, 28, 0.98);
  color: #f3f6ff;
  font-size: 12px;
  line-height: 1;
  padding: 9px 11px;
  border-radius: 10px;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease;
  z-index: 30;
}

.collapsed-rail-item:hover .collapsed-tooltip,
.collapsed-user-btn:hover .collapsed-tooltip,
.collapsed-logout-btn:hover .collapsed-tooltip {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

.current-chat-tooltip {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-section {
  flex: 1;
  padding-top: 22px;
  overflow-y: auto;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-title {
  font-size: 12px;
  letter-spacing: 1.6px;
  color: #6f7993;
  margin: 0 0 14px;
  font-weight: 700;
}

.history-item {
  min-height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  color: #a8b1c8;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.25s ease, box-shadow 0.28s ease, transform 0.2s ease;
  position: relative;
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.04);
  transform: translateY(-1px);
}

.history-item.selected {
  border: 1px solid #1184ff;
  color: #ffffff;
  background: linear-gradient(180deg, rgba(7, 15, 30, 0.95), rgba(6, 12, 24, 0.95));
  box-shadow:
    inset 0 0 0 1px rgba(17, 132, 255, 0.2),
    0 0 0 1px rgba(17, 132, 255, 0.08),
    0 0 18px rgba(17, 132, 255, 0.18),
    0 0 34px rgba(17, 132, 255, 0.08);
}

.history-item.selected .history-text {
  color: #ffffff;
  text-shadow: 0 0 10px rgba(17, 132, 255, 0.18);
}

.history-item.selected .history-img-icon {
  filter: drop-shadow(0 0 6px rgba(17, 132, 255, 0.45));
  opacity: 1;
}

.history-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.history-img-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  opacity: 0.9;
  flex-shrink: 0;
  border-radius: 50%;
}

.history-text {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-actions {
  position: relative;
  flex-shrink: 0;
}

.history-menu {
  background: transparent;
  border: none;
  color: #95a0ba;
  cursor: pointer;
  font-size: 12px;
}

.history-dropdown {
  position: absolute;
  top: 28px;
  right: 0;
  min-width: 122px;
  padding: 6px;
  border-radius: 10px;
  background: rgba(18, 22, 34, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  z-index: 20;
}

.history-dropdown button {
  width: 100%;
  background: transparent;
  border: none;
  color: #e7ebf5;
  font-size: 14px;
  text-align: left;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.history-dropdown button:hover {
  background: rgba(255, 255, 255, 0.06);
}

.delete-action {
  color: #ff7b7b !important;
}

.delete-action:hover {
  background: rgba(255, 80, 80, 0.08) !important;
}

.chat-delete-leave-active {
  transition: all 0.22s ease;
}

.chat-delete-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.chat-delete-move {
  transition: transform 0.22s ease;
}

.sidebar-bottom {
  margin-top: auto;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 10px 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.profile-avatar,
.collapsed-user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #f0f0f0;
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  overflow: hidden;
}

.profile-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-name {
  font-size: 15px;
  color: #ffffff;
}

.profile-role {
  font-size: 13px;
  color: #7f89a2;
}

.logout-btn {
  width: 100%;
  height: 42px;
  margin-top: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  color: #d8def0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.22s ease;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 18px rgba(255, 255, 255, 0.06);
}

.collapsed-bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

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
  line-height: 1;
  color: #f5f7fd;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
}

.connecting {
  color: #ff5b45;
  background: rgba(255, 91, 69, 0.08);
  border: 1px solid rgba(255, 91, 69, 0.22);
}

.ready {
  color: #34d399;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(52, 211, 153, 0.2);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.connecting-dot {
  background: #ff5b45;
  box-shadow: 0 0 10px rgba(255, 91, 69, 0.8);
  animation: blink 1s infinite;
}

.ready-dot {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.75);
}

.new-chat-btn {
  height: 42px;
  padding: 0 22px;
  border-radius: 15px;
  border: 1px solid #1387ff;
  background: transparent;
  color: #15a0ff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.new-chat-btn:hover {
  transform: scale(1.07);
  box-shadow: 0 0 22px rgba(19, 135, 255, 0.28);
  background: rgba(19, 135, 255, 0.06);
}

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
  max-width: 980px;
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
.message-row.thinking {
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
}

.assistant-icon img {
  width: 72%;
  height: 72%;
  object-fit: contain;
}

.message-bubble {
  max-width: 690px;
  padding: 16px 18px;
  border-radius: 20px;
  font-size: 15px;
  line-height: 1.65;
}

.message-row.user .message-bubble {
  background: linear-gradient(180deg, rgba(35, 42, 58, 0.95), rgba(25, 31, 45, 0.95));
  color: #f4f7ff;
  border-top-right-radius: 8px;
}

.message-row.assistant .message-bubble,
.message-row.thinking .message-bubble {
  background: linear-gradient(180deg, rgba(10, 17, 31, 0.98), rgba(8, 13, 24, 0.98));
  color: #dfe6f5;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  border-top-left-radius: 8px;
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

.chat-input-wrap {
  padding: 0 0 22px;
}

.chat-input-shell {
  width: min(980px, calc(100% - 80px));
  margin: 0 auto;
}

.hidden-file-input {
  display: none;
}

.attached-files-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.attached-file-chip {
  height: 42px;
  max-width: 280px;
  padding: 0 12px;
  border-radius: 14px;
  background: rgba(11, 17, 30, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.attached-file-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
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

.attached-file-name {
  color: #aeb8cf;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-file-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #aeb8cf;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.remove-file-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
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
  padding: 0 10px 0 14px;
}

.attach-btn {
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
}

.attach-btn:hover {
  transform: scale(1.06);
  background: rgba(19, 135, 255, 0.08);
  box-shadow: 0 0 18px rgba(19, 135, 255, 0.22);
}

.attach-btn-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  filter: drop-shadow(0 0 6px rgba(37, 99, 235, 0.22));
}

.chat-input-bar input[type='text'] {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #e7ebf5;
  font-size: 15px;
  padding: 0 14px;
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
  transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
}

.send-btn:hover {
  transform: scale(1.12);
  box-shadow:
    0 0 18px rgba(47, 140, 255, 0.35),
    0 0 34px rgba(47, 140, 255, 0.38),
    0 0 52px rgba(47, 140, 255, 0.18);
  filter: brightness(1.05);
}

.fade-up-enter-active,
.fade-up-leave-active,
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(18px);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes heartbeatGlow {
  0% {
    transform: scale(0.9);
    opacity: 0.25;
  }
  25% {
    transform: scale(1.02);
    opacity: 0.45;
  }
  40% {
    transform: scale(0.96);
    opacity: 0.3;
  }
  60% {
    transform: scale(1.08);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

@keyframes blinkCursor {
  0%, 50%, 100% {
    opacity: 1;
  }
  25%, 75% {
    opacity: 0;
  }
}

@keyframes thinkingBounce {
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.45;
  }
  40% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

@media (max-width: 900px) {
  .sidebar {
    width: 82px;
    min-width: 82px;
    max-width: 82px;
    padding: 14px 8px 18px;
  }

  .sidebar:not(.collapsed) {
    width: 260px;
    min-width: 260px;
    max-width: 260px;
  }

  .topbar {
    padding: 0 18px;
  }

  .topbar-left {
    gap: 10px;
  }

  .topbar h1 {
    font-size: 18px;
  }

  .chat-input-shell {
    width: calc(100% - 24px);
  }

  .welcome-card h2 {
    font-size: 22px;
  }

  .typing-text {
    font-size: 14px;
  }

  .message-bubble {
    max-width: 82%;
  }
}
</style>