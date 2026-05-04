<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { authService } from '@/services/authService'
import { chatSessionService, type ChatHistoryEntry } from '@/services/chatSessionService'
import { useChatService } from '@/services/websocketService'
import type { MessageResponse } from '@/models/messageResponse'
import ChatMessages from '@/components/ChatMessages.vue'
import ChatInput from '@/components/ChatInput.vue'
import DocViewer from '@/components/DocViewer.vue'
import mainLogo from '@/assets/oconnors-logo.png'
import aiLogo from '@/assets/ai-logo.png'
import chatLogo from '@/assets/chat-logo.png'
import docLogo from '@/assets/doc-logo.png'

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
  compared?: boolean
  comparisonOptions?: { left: string; right: string }
  chosenOption?: 'left' | 'right' | null
}

type ChatItem = {
  id: number
  sessionId: string
  name: string
  messages: Message[]
  selectedDocumentId?: string | null
}

const router = useRouter()
const userStore = useUserStore()

const pendingThinkingId = ref<number | null>(null)
const pendingFileNames = ref<string[]>([])
const pendingDocuments = ref<MessageDocument[]>([])
const pendingFirstFile = ref<File | null>(null)

function handleBackendResponse(response: MessageResponse) {
  const selectedChat = chats.value.find(chat => chat.id === selectedChatId.value)
  if (!selectedChat || pendingThinkingId.value === null) return

  const thinkingIndex = selectedChat.messages.findIndex(
    msg => msg.id === pendingThinkingId.value
  )

  if (thinkingIndex !== -1) {
    const sourceDocuments: MessageDocument[] = (response.sources || []).map((s, index) => ({
      id: `source-${s.chunk_id || index}-${Date.now()}`,
      name: s.file,
      documentPath: s.document_path
    }))

    const assistantMessage: Message = {
      id: nextMessageId++,
      role: 'assistant',
      text: '',
      fileNames: pendingFileNames.value.length ? [...pendingFileNames.value] : undefined,
      documents: sourceDocuments.length ? sourceDocuments : undefined,
      docReference: pendingFirstFile.value ? `Pg 1: ${pendingFirstFile.value.name}` : undefined
    }

    maybeAttachComparisonPrompt(assistantMessage)
    selectedChat.messages.splice(thinkingIndex, 1, assistantMessage)

    typeAssistantMessage(response.message, (typed) => {
      const liveChat = chats.value.find(chat => chat.id === selectedChatId.value)
      if (!liveChat) return
      const liveMessage = liveChat.messages.find(msg => msg.id === assistantMessage.id)
      if (!liveMessage) return
      liveMessage.text = typed
    })
  }

  pendingThinkingId.value = null
  pendingFileNames.value = []
  pendingDocuments.value = []
  pendingFirstFile.value = null
}

const {
  connect: wsConnect,
  disconnect: wsDisconnect,
  sendMessage: wsSendMessage
} = useChatService(handleBackendResponse)

const activeMode = ref<'chat' | 'doc'>('chat')
const showIntro = ref(true)
const isConnected = ref(false)
const isSidebarExpanded = ref(true)
const isBrandHovered = ref(false)
const isLeavingPage = ref(false)
const inputValue = ref('')
const searchQuery = ref('')
const openMenuChatId = ref<number | null>(null)
const animatedText = ref('')
const attachedFiles = ref<File[]>([])
const previewFile = ref<File | null>(null)
const previewFileName = ref<string>('')
const previewFileUrl = ref('')
const isDocLoading = ref(false)
const isDocViewerOpen = ref(false)
const docLoadToken = ref(0)
const docSearchQuery = ref('')
const assistantReplyCount = ref(0)
const typingSpeed = 18

const comparisonPromptProbability = 0.3
const comparisonLabels = [
  { left: 'Response A', right: 'Response B' },
  { left: 'Version 1', right: 'Version 2' },
  { left: 'Option A', right: 'Option B' }
]

const phrases = ['Ask about specific projects', 'Troubleshoot a problem', 'Ask a question']

const documentServiceUrl = import.meta.env.VITE_DOCUMENT_SERVICE_URL || 'http://localhost:8083'

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

const userInitial = computed(() => displayName.value.charAt(0).toUpperCase())
const userPhoto = computed(() => (userStore as any).account?.idTokenClaims?.picture || '')

const chats = ref<ChatItem[]>([])

const selectedChatId = ref<number | null>(null)
let nextChatId = 1
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

const supportedPreviewText = computed(() => {
  return 'PDF, Word and Excel previews are supported'
})

const currentPreviewFileName = computed(() => {
  return previewFile.value?.name || previewFileName.value || 'No document selected'
})

const isPdfPreview = computed(() => {
  const name = (previewFile.value?.name || previewFileName.value).toLowerCase()
  return !!name && name.endsWith('.pdf')
})

const isImagePreview = computed(() => {
  const name = (previewFile.value?.name || previewFileName.value).toLowerCase()
  return name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp')
})

const isWordPreview = computed(() => {
  const name = (previewFile.value?.name || previewFileName.value).toLowerCase()
  return name.endsWith('.doc') || name.endsWith('.docx')
})

const isExcelPreview = computed(() => {
  const name = (previewFile.value?.name || previewFileName.value).toLowerCase()
  return name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')
})

const officeViewerUrl = computed(() => {
  if (!previewFileUrl.value) return ''
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewFileUrl.value)}`
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

function typeAssistantMessage(fullText: string, done: (typed: string) => void) {
  let index = 0
  let typed = ''

  const interval = window.setInterval(() => {
    typed += fullText[index]
    done(typed)
    index++

    if (index >= fullText.length) {
      clearInterval(interval)
      activeTypingIntervals.delete(interval)
    }
  }, typingSpeed)

  activeTypingIntervals.add(interval)
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
  if (firstMatch) selectedChatId.value = firstMatch.id
}

function toggleMenu(chatId: number) {
  openMenuChatId.value = openMenuChatId.value === chatId ? null : chatId
}

async function selectChatById(chatId: number) {
  selectedChatId.value = chatId
  openMenuChatId.value = null

  const chat = chats.value.find(c => c.id === chatId)
  if (!chat || chat.messages.length > 0) return

  const session = await chatSessionService.getSessionById(chat.sessionId)
  if (!session || !session.chatHistory) return

  try {
    const history: ChatHistoryEntry[] =
      typeof session.chatHistory === 'string'
        ? JSON.parse(session.chatHistory)
        : session.chatHistory

    for (const entry of history) {
      chat.messages.push({
        id: nextMessageId++,
        role: 'user',
        text: entry.question
      })

      const sourceDocuments: MessageDocument[] = (entry.sources || []).map((s, index) => ({
        id: `source-${s.chunk_id || index}-${Date.now()}`,
        name: s.file,
        documentPath: s.document_path
      }))

      chat.messages.push({
        id: nextMessageId++,
        role: 'assistant',
        text: entry.answer,
        documents: sourceDocuments.length ? sourceDocuments : undefined
      })
    }
  } catch {
    console.error('Failed to parse chat history')
  }
}

function renameChat(chatId: number) {
  const chat = chats.value.find(item => item.id === chatId)
  if (!chat) return

  const newName = window.prompt('Rename chat', chat.name)

  if (newName && newName.trim()) {
    chat.name = newName.trim()
    const userEmail = authService.getCurrentUser()?.email || userStore.account?.username || localStorage.getItem('userEmail') || 'anonymous'
    chatSessionService.updateSession(chat.sessionId, {
      chatName: chat.name,
      userName: userEmail,
      createdBy: userEmail
    })
  }

  openMenuChatId.value = null
}

async function deleteChat(chatId: number) {
  const chat = chats.value.find(c => c.id === chatId)
  if (chat) {
    chatSessionService.deleteSession(chat.sessionId)
  }

  if (chats.value.length === 1) {
    await startNewChat()
    const oldIndex = chats.value.findIndex(c => c.id === chatId)
    if (oldIndex !== -1) chats.value.splice(oldIndex, 1)
    openMenuChatId.value = null
    return
  }

  const chatIndex = chats.value.findIndex(c => c.id === chatId)
  if (chatIndex === -1) return

  chats.value.splice(chatIndex, 1)

  if (selectedChatId.value === chatId) {
    selectedChatId.value = chats.value[0].id
    inputValue.value = ''
  }

  openMenuChatId.value = null
}

async function startNewChat() {
  const userEmail = authService.getCurrentUser()?.email || userStore.account?.username || localStorage.getItem('userEmail') || 'anonymous'
  const session = await chatSessionService.createSession({
    chatName: 'New Chat',
    userName: userEmail,
    createdBy: userEmail,
    status: 'active'
  })

  const newChat: ChatItem = {
    id: nextChatId++,
    sessionId: session?.id || crypto.randomUUID(),
    name: session?.chatName || 'New Chat',
    messages: [],
    selectedDocumentId: null
  }

  chats.value.unshift(newChat)
  selectedChatId.value = newChat.id
  inputValue.value = ''
  searchQuery.value = ''
  openMenuChatId.value = null
}

function setChatMode() {
  activeMode.value = 'chat'
}

function getFileBadge(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() || ''

  if (extension === 'pdf') return 'PDF'
  if (['doc', 'docx'].includes(extension)) return 'DOC'
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'XLS'
  if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) return 'IMG'

  return 'FILE'
}

function setPreviewFile(file: File) {
  if (previewFileUrl.value) {
    URL.revokeObjectURL(previewFileUrl.value)
  }

  previewFile.value = file
  previewFileUrl.value = URL.createObjectURL(file)
}

function clearPreviewFile() {
  if (previewFileUrl.value) {
    URL.revokeObjectURL(previewFileUrl.value)
  }

  previewFile.value = null
  previewFileName.value = ''
  previewFileUrl.value = ''
}

function createMessageDocuments(files: File[]): MessageDocument[] {
  return files.map((file, index) => ({
    id: `${file.name}-${file.lastModified}-${file.size}-${index}-${Date.now()}`,
    name: file.name,
    file
  }))
}

async function fetchDocumentBlob(documentPath: string): Promise<string> {
  const token = await authService.getToken()
  const response = await fetch(
    `${documentServiceUrl}/documents/file?path=${encodeURIComponent(documentPath)}`,
    token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  )
  if (!response.ok) throw new Error(`Failed to fetch document: ${response.status}`)
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

async function loadDocumentPreview(document: MessageDocument) {
  if (document.file) {
    setPreviewFile(document.file)
  } else if (document.documentPath) {
    if (previewFileUrl.value) URL.revokeObjectURL(previewFileUrl.value)
    previewFile.value = null
    previewFileName.value = document.name
    previewFileUrl.value = ''
    try {
      previewFileUrl.value = await fetchDocumentBlob(document.documentPath)
    } catch (e) {
      console.error('Failed to load document from document-service:', e)
    }
  }
}

function findDocumentByIdInChat(chat: ChatItem | null, documentId: string | null | undefined) {
  if (!chat || !documentId) return null

  for (const message of chat.messages) {
    if (!message.documents || !message.documents.length) continue

    const found = message.documents.find(document => document.id === documentId)
    if (found) return found
  }

  return null
}

function findFirstDocumentInChat(chat: ChatItem | null) {
  if (!chat) return null

  for (const message of chat.messages) {
    if (message.documents && message.documents.length) {
      return message.documents[0]
    }
  }

  return null
}

function syncPreviewFileFromChat(chat: ChatItem | null) {
  if (!chat) {
    clearPreviewFile()
    return
  }

  const selectedDocument = findDocumentByIdInChat(chat, chat.selectedDocumentId)

  if (selectedDocument) {
    triggerDocLoading(320)
    loadDocumentPreview(selectedDocument)
    return
  }

  const firstDocument = findFirstDocumentInChat(chat)

  if (firstDocument) {
    chat.selectedDocumentId = firstDocument.id
    triggerDocLoading(320)
    loadDocumentPreview(firstDocument)
    return
  }

  clearPreviewFile()
}

function triggerDocLoading(delayMs: number) {
  isDocLoading.value = true
  window.setTimeout(() => {
    isDocLoading.value = false
  }, delayMs)
}

function syncPreviewFileFromCurrentChat() {
  syncPreviewFileFromChat(currentChat.value)
}

function maybeAttachComparisonPrompt(targetMessage: Message) {
  assistantReplyCount.value++

  if (assistantReplyCount.value <= 1) return

  const shouldShow = Math.random() < comparisonPromptProbability
  if (!shouldShow) return

  const randomLabels =
    comparisonLabels[Math.floor(Math.random() * comparisonLabels.length)]

  targetMessage.compared = true
  targetMessage.comparisonOptions = {
    left: randomLabels.left,
    right: randomLabels.right
  }
  targetMessage.chosenOption = null
}

function chooseComparisonOption(messageId: number, option: 'left' | 'right') {
  const chat = currentChat.value
  if (!chat) return

  const targetIndex = chat.messages.findIndex(msg => msg.id === messageId)
  if (targetIndex === -1) return

  const target = chat.messages[targetIndex]
  if (!target || !target.compared || !target.comparisonOptions) return

  target.chosenOption = option

  const selectedTitle =
    option === 'left'
      ? target.comparisonOptions.left
      : target.comparisonOptions.right

  window.setTimeout(() => {
    chat.messages.splice(targetIndex + 1, 0, {
      id: nextMessageId++,
      role: 'comparison_result',
      text: `You selected ${selectedTitle}. I understand. This is a sample response area where the chatbot answer will appear.`,
      documents: target.documents,
      fileNames: target.fileNames
    })
  }, 260)
}

function isDocumentSelected(documentId: string) {
  const chat = currentChat.value
  if (!chat) return false
  return chat.selectedDocumentId === documentId
}

async function openDocumentFromMessage(document: MessageDocument) {
  const chat = currentChat.value
  if (chat) {
    chat.selectedDocumentId = document.id
  }

  docLoadToken.value = Date.now()
  isDocLoading.value = true
  activeMode.value = 'doc'
  isDocViewerOpen.value = true

  try {
    await loadDocumentPreview(document)
  } finally {
    isDocLoading.value = false
  }
}

function sendMessage() {
  const text = inputValue.value.trim()

  if (!text || !currentChat.value) return

  currentChat.value.messages.push({
    id: nextMessageId++,
    role: 'user',
    text
  })

  if (currentChat.value.name === 'New Chat') {
    currentChat.value.name = text.length > 28 ? text.slice(0, 28) + '...' : text
  }

  inputValue.value = ''

  const thinkingMessageId = nextMessageId++

  currentChat.value.messages.push({
    id: thinkingMessageId,
    role: 'thinking',
    text: ''
  })

  const userFiles = attachedFiles.value
  const messageDocuments = createMessageDocuments(userFiles)
  const fileNames = userFiles.map(f => f.name)
  const firstAttachedFile = userFiles.length ? userFiles[0] : null
  const firstMessageDocument = messageDocuments.length ? messageDocuments[0] : null

  if (firstMessageDocument && currentChat.value) {
    currentChat.value.selectedDocumentId = firstMessageDocument.id
    if (firstMessageDocument.file) setPreviewFile(firstMessageDocument.file)
  }

  attachedFiles.value = []

  pendingThinkingId.value = thinkingMessageId
  pendingFileNames.value = fileNames
  pendingDocuments.value = messageDocuments
  pendingFirstFile.value = firstAttachedFile

  const userEmail = authService.getCurrentUser()?.email || userStore.account?.username || localStorage.getItem('userEmail') || 'anonymous'
  wsSendMessage({
    sessionId: currentChat.value?.sessionId || crypto.randomUUID(),
    sender: userEmail,
    message: text
  })
}

async function handleLogout() {
  isLeavingPage.value = true
  await new Promise(resolve => setTimeout(resolve, 260))
  await authService.logout()
  router.push('/login')
}

onMounted(async () => {
  wsConnect()

  window.setTimeout(() => {
    isConnected.value = true
  }, 1800)

  window.setTimeout(() => {
    showIntro.value = false
  }, 3200)

  window.setTimeout(() => {
    const nav = navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean }
    nav.vibrate?.([30, 40, 30])
  }, 550)

  window.addEventListener('click', closeMenuOutside)
  typeLoop()

  const userEmail =
    authService.getCurrentUser()?.email ||
    userStore.account?.username ||
    localStorage.getItem('userEmail') ||
    'anonymous'

  try {
    const sessions = await chatSessionService.getSessionsByUser(userEmail)
    if (sessions && sessions.length > 0) {
      const sorted = [...sessions].sort(
        (a, b) => new Date(b.lastAccess).getTime() - new Date(a.lastAccess).getTime()
      )
      for (const session of sorted) {
        chats.value.push({
          id: nextChatId++,
          sessionId: session.id,
          name: session.chatName || 'Chat',
          messages: [],
          selectedDocumentId: null
        })
      }
      selectedChatId.value = chats.value[0].id
      await selectChatById(chats.value[0].id)
    } else {
      await startNewChat()
    }
  } catch {
    await startNewChat()
  }
})

onBeforeUnmount(() => {
  wsDisconnect()
  window.removeEventListener('click', closeMenuOutside)

  if (typeTimeout !== null) {
    clearTimeout(typeTimeout)
  }

  activeTypingIntervals.forEach(interval => clearInterval(interval))
  activeTypingIntervals.clear()
})
</script>

<template>
  <div class="chat-page">
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

    <div class="page-transition-overlay" :class="{ active: isLeavingPage }"></div>

    <aside
      class="sidebar"
      :class="{ collapsed: !isSidebarExpanded, introSidebar: showIntro }"
    >
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
            @click="setChatMode"
          >
            <img :src="aiLogo" alt="Chatbot" class="nav-image-icon nav-chat-logo" />
            <span>Chatbot</span>
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
                <img :src="chatLogo" alt="Chat" class="history-img-icon" />
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
            @click="setChatMode"
            title="Chatbot"
            aria-label="Chatbot"
          >
            <img :src="aiLogo" alt="Chatbot" class="collapsed-rail-icon collapsed-chat-logo" />
            <span class="collapsed-tooltip">Chatbot</span>
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
            <img :src="chatLogo" alt="New Chat" class="collapsed-rail-icon collapsed-chat-logo" />
            <span class="collapsed-tooltip">New Chat</span>
          </button>

          <div class="collapsed-rail-divider"></div>

          <button
            class="collapsed-rail-item selected-chat-item"
            @click="isSidebarExpanded = true"
            :title="selectedChatName"
            aria-label="Current selected chat"
          >
            <img :src="chatLogo" alt="Current Chat" class="collapsed-rail-icon collapsed-chat-logo" />
            <span class="collapsed-tooltip current-chat-tooltip">
              {{ selectedChatName }}
            </span>
          </button>
        </div>

        <div class="collapsed-bottom">
          <button
            class="collapsed-logout-btn"
            @click="handleLogout"
            title="Logout"
            aria-label="Logout"
          >
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
      <div class="chat-panel">
        <header class="topbar" :class="{ introTopbar: showIntro }">
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
          @close-menu="openMenuChatId = null"
          @open-document="openDocumentFromMessage"
        />

        <div :class="{ introInput: showIntro }">
          <ChatInput
            :input-value="inputValue"
            @update-input="inputValue = $event"
            @send-message="sendMessage"
          />
        </div>
      </div>
    </main>

    <DocViewer
      :is-open="isDocViewerOpen"
      :current-chat="currentChat"
      :preview-file="previewFile"
      :preview-file-url="previewFileUrl"
      :current-preview-file-name="currentPreviewFileName"
      :doc-search-query="docSearchQuery"
      :is-doc-loading="isDocLoading"
      :is-pdf-preview="isPdfPreview"
      :is-word-preview="isWordPreview"
      :is-excel-preview="isExcelPreview"
      :is-image-preview="isImagePreview"
      :office-viewer-url="officeViewerUrl"
      :supported-preview-text="supportedPreviewText"
      :doc-logo="docLogo"
      :get-file-badge="getFileBadge"
      @close="isDocViewerOpen = false"
      @update-search="docSearchQuery = $event"
    />
  </div>
</template>

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
    introFadeOut 0.6s ease forwards;
  animation-delay: 0s, 2.65s;
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
    logoPulseBeforeFade 0.8s ease-in-out forwards;
  animation-delay: 0s, 1.9s;
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

.introSidebar {
  animation: sidebarIntro 0.75s ease both;
  animation-delay: 2.4s;
}

.introTopbar {
  animation: topbarIntro 0.75s ease both;
  animation-delay: 2.5s;
}

.introMessages {
  animation: messagesIntro 0.8s ease both;
  animation-delay: 2.7s;
}

.introInput {
  animation: inputIntro 0.8s ease both;
  animation-delay: 2.9s;
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

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
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

@keyframes sidebarIntro {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
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

@keyframes messagesIntro {
  from {
    transform: translateY(36px) scale(0.98);
    opacity: 0;
  }

  to {
    transform: translateY(0) scale(1);
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

@keyframes heartbeatGlow {
  0% { transform: scale(0.9); opacity: 0.25; }
  25% { transform: scale(1.02); opacity: 0.45; }
  40% { transform: scale(0.96); opacity: 0.3; }
  60% { transform: scale(1.08); opacity: 0.5; }
  100% { transform: scale(1.2); opacity: 0; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
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
}
</style>