<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
import attachLogo from '@/assets/attach-logo.png'

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
  comparisonOptions?: {
    left: string
    right: string
  }
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
  isConnected,
  connect: wsConnect,
  disconnect: wsDisconnect,
  sendMessage: wsSendMessage
} = useChatService(handleBackendResponse)

const activeMode = ref<'chat' | 'doc'>('chat')
const isSidebarExpanded = ref(true)
const isBrandHovered = ref(false)
const isLeavingPage = ref(false)
const isDocViewerOpen = ref(false)
const isDocLoading = ref(false)
const docLoadToken = ref(0)
const inputValue = ref('')
const searchQuery = ref('')
const docSearchQuery = ref('')
const openMenuChatId = ref<number | null>(null)
const animatedText = ref('')
const attachedFiles = ref<File[]>([])
const previewFile = ref<File | null>(null)
const previewFileName = ref<string>('')
const previewFileUrl = ref('')
const assistantReplyCount = ref(0)
const typingSpeed = 18

const comparisonPromptProbability = 0.28
const comparisonLabels = [
  { left: 'Option 1', right: 'Option 2' },
  { left: 'Response 1', right: 'Response 2' },
  { left: 'Version 1', right: 'Version 2' }
]

const phrases = [
  'Ask about specific projects',
  'Upload a manual for reference',
  'Troubleshoot a problem'
]

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
  if (firstMatch) {
    selectedChatId.value = firstMatch.id
  }
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
    const userEmail = userStore.account?.username || 'anonymous'
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
    attachedFiles.value = []
    syncPreviewFileFromChat(chats.value[0] || null)
  }

  openMenuChatId.value = null
}

async function startNewChat() {
  const userEmail = userStore.account?.username || 'anonymous'
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
  attachedFiles.value = []
  openMenuChatId.value = null
  assistantReplyCount.value = 0
  clearPreviewFile()
}

function setChatMode() {
  activeMode.value = 'chat'
  isDocViewerOpen.value = false
}

function triggerDocLoading(duration = 420) {
  const token = Date.now()
  docLoadToken.value = token
  isDocLoading.value = true

  window.setTimeout(() => {
    if (docLoadToken.value === token) {
      isDocLoading.value = false
    }
  }, duration)
}

function openDocViewerPanel() {
  activeMode.value = 'doc'
  syncPreviewFileFromCurrentChat()
  triggerDocLoading()
  isDocViewerOpen.value = true
}

function closeDocViewerPanel() {
  isDocViewerOpen.value = false
  activeMode.value = 'chat'
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

  if (!previewFile.value && attachedFiles.value.length > 0) {
    setPreviewFile(attachedFiles.value[0])
  }
}

function removeAttachedFile(fileToRemove: File) {
  const wasPreview =
    previewFile.value &&
    previewFile.value.name === fileToRemove.name &&
    previewFile.value.lastModified === fileToRemove.lastModified &&
    previewFile.value.size === fileToRemove.size

  attachedFiles.value = attachedFiles.value.filter(
    file =>
      !(
        file.name === fileToRemove.name &&
        file.lastModified === fileToRemove.lastModified &&
        file.size === fileToRemove.size
      )
  )

  if (wasPreview) {
    if (attachedFiles.value.length > 0) {
      setPreviewFile(attachedFiles.value[0])
    } else {
      clearPreviewFile()
    }
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

  if (!text && !attachedFiles.value.length) return
  if (!currentChat.value) return

  const userFiles = [...attachedFiles.value]
  const fileNames = userFiles.map(file => file.name)
  const messageDocuments = createMessageDocuments(userFiles)

  currentChat.value.messages.push({
    id: nextMessageId++,
    role: 'user',
    text,
    fileNames,
    documents: messageDocuments
  })

  inputValue.value = ''

  const thinkingMessageId = nextMessageId++

  currentChat.value.messages.push({
    id: thinkingMessageId,
    role: 'thinking',
    text: ''
  })

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

  const userEmail = userStore.account?.username || 'anonymous'
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

watch(selectedChatId, () => {
  syncPreviewFileFromCurrentChat()
})

watch(isDocViewerOpen, (isOpen) => {
  if (isOpen) {
    syncPreviewFileFromCurrentChat()
  }
})

watch(activeMode, (mode) => {
  if (mode === 'doc') {
    syncPreviewFileFromCurrentChat()
  }
})

onMounted(async () => {
  await authService.initialize()
  await authService.exchangeToken()
  wsConnect()

  const userEmail = userStore.account?.username || 'anonymous'
  const sessions = await chatSessionService.getSessionsByUser(userEmail)

  if (sessions.length > 0) {
    chats.value = sessions.map(s => ({
      id: nextChatId++,
      sessionId: s.id,
      name: s.chatName,
      messages: [],
      selectedDocumentId: null
    }))
    selectedChatId.value = chats.value[0].id
  } else {
    await startNewChat()
  }

  window.addEventListener('click', closeMenuOutside)
  typeLoop()
})

onBeforeUnmount(() => {
  wsDisconnect()
  window.removeEventListener('click', closeMenuOutside)

  if (typeTimeout !== null) {
    clearTimeout(typeTimeout)
  }

  activeTypingIntervals.forEach(interval => clearInterval(interval))
  activeTypingIntervals.clear()

  if (previewFileUrl.value) {
    URL.revokeObjectURL(previewFileUrl.value)
  }
})
</script>

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
            @click="setChatMode"
          >
            <img :src="aiLogo" alt="Chatbot" class="nav-image-icon nav-chat-logo" />
            <span>Chatbot</span>
          </button>

          <button
            class="nav-item"
            :class="{ active: activeMode === 'doc' }"
            @click="openDocViewerPanel"
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
            :class="{ active: activeMode === 'doc' }"
            @click="openDocViewerPanel"
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

    <main class="main-content" :class="{ 'doc-open': isDocViewerOpen }">
      <div class="chat-panel">
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

        <ChatMessages
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
          @choose-comparison="chooseComparisonOption"
        />

        <ChatInput
          :input-value="inputValue"
          :attached-files="attachedFiles"
          :attach-logo="attachLogo"
          :get-file-badge="getFileBadge"
          @update-input="inputValue = $event"
          @add-files="handleFileChange"
          @remove-file="removeAttachedFile"
          @send-message="sendMessage"
        />
      </div>

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
        @close="closeDocViewerPanel"
        @update-search="docSearchQuery = $event"
      />
    </main>
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

.main-content.doc-open .chat-panel {
  width: calc(100% - 48%);
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

@media (max-width: 1100px) {
  .main-content.doc-open .chat-panel {
    width: calc(100% - 44%);
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

  .main-content.doc-open .chat-panel {
    width: 100%;
  }
}
</style>