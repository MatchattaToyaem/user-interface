<template>
  <LightTheme :is-light-theme="isLightTheme">
    <div class="document-shell">
      <ThemeEffects
        :theme-transition="themeTransition"
        :show-fireworks="false"
      />

      <ChatSidebar
        :show-intro="false"
        :is-sidebar-expanded="isSidebarExpanded"
        :is-brand-hovered="isBrandHovered"
        :main-logo="isLightTheme ? logoPng : mainLogo"
        :chat-logo="chatLogo"
        :search-query="sidebarSearchQuery"
        :filtered-chats="filteredSidebarChats"
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
        @brand-click="router.push('/chat')"
        @brand-hover="isBrandHovered = $event"
        @update-search="sidebarSearchQuery = $event"
        @search-enter="handleSearchEnter"
        @select-chat="selectChatForDocuments"
        @toggle-menu="toggleMenu"
        @rename-chat="startRename"
        @delete-chat="deleteChat"
        @update-editing-name="editingChatName = $event"
        @save-rename="saveRename"
        @cancel-rename="cancelRename"
        @new-chat="router.push('/chat')"
        @logout="handleLogout"
        @expand-sidebar="isSidebarExpanded = true"
        @expand-search="isSidebarExpanded = true"
      />

      <main class="document-main">
        <header class="document-header">
          <div>
            <h1>Document Library</h1>
          </div>

          <div class="header-actions">
            <button
              class="theme-toggle-btn"
              :class="{ lightActive: isLightTheme }"
              @click="toggleTheme"
            >
              <div class="theme-scene">
                <div v-if="!isLightTheme" class="day-scene">
                  <span class="sun-core">☀</span>

                  <div class="cloud cloud-1"></div>
                  <div class="cloud cloud-2"></div>
                  <div class="cloud cloud-3"></div>
                  <div class="cloud cloud-4"></div>

                  <div class="hill hill-1"></div>
                  <div class="hill hill-2"></div>

                  <span class="rabbit rabbit-1">🐇</span>
                  <span class="rabbit rabbit-2">🐇</span>
                  <span class="rabbit rabbit-3">🐇</span>

                  <span class="flower flower-1">✿</span>
                  <span class="flower flower-2">✿</span>
                  <span class="flower flower-3">✿</span>
                  <span class="flower flower-4">✿</span>
                </div>

                <div v-else class="night-scene">
                  <span class="moon-core">☾</span>

                  <span class="star star-1">✦</span>
                  <span class="star star-2">✦</span>
                  <span class="star star-3">✦</span>
                  <span class="star star-4">✦</span>

                  <div class="night-cloud night-cloud-1"></div>
                  <div class="night-cloud night-cloud-2"></div>
                </div>
              </div>
            </button>
          </div>
        </header>

        <div class="document-content">
          <section class="document-toolbar">
            <div class="document-search">
              <span>⌕</span>

              <input
                v-model="documentSearchQuery"
                type="text"
                placeholder="Search unprocessed documents..."
              />
            </div>

            <button class="filter-btn" type="button">
              Issue Type
            </button>

            <button class="filter-btn" type="button">
              Failed Date
            </button>

            <div class="view-buttons">
              <button type="button">☷</button>
              <button type="button">▦</button>
            </div>
          </section>

          <Transition name="document-slide" mode="out-in">
            <section
              :key="selectedChatId"
              class="table-card"
            >
              <table>
                <thead>
                  <tr>
                    <th><input type="checkbox" /></th>
                    <th>DOCUMENT NAME</th>
                    <th>FILE TYPE</th>
                    <th>FAILED DATE</th>
                    <th>ISSUE</th>
                    <th>SOURCE CHAT</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody v-if="isLoading">
                  <tr>
                    <td colspan="7">
                      <div class="empty-state">
                        <p>Loading failed documents…</p>
                      </div>
                    </td>
                  </tr>
                </tbody>

                <tbody v-else-if="fetchError">
                  <tr>
                    <td colspan="7">
                      <div class="empty-state">
                        <h3>Could not load documents</h3>
                        <p>{{ fetchError }}</p>
                      </div>
                    </td>
                  </tr>
                </tbody>

                <tbody v-else-if="filteredDocuments.length">
                  <tr
                    v-for="doc in filteredDocuments"
                    :key="doc.id"
                  >
                    <td><input type="checkbox" /></td>

                    <td>
                      <div class="doc-name">
                        <div
                          class="file-icon"
                          :class="doc.extension.toLowerCase()"
                        >
                          {{ doc.extension }}
                        </div>

                        <div>
                          <strong>{{ doc.name }}</strong>
                          <span>{{ doc.size }}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span class="tag primary">
                        {{ doc.fileType }}
                      </span>
                    </td>

                    <td>{{ doc.failedDate }}</td>

                    <td>
                      <span
                        class="status"
                        :class="doc.status.toLowerCase().replace(' ', '-')"
                      >
                        <span class="status-dot"></span>
                        {{ doc.issue }}
                      </span>
                    </td>

                    <td>{{ doc.sourceChat }}</td>

                    <td>
                      <div class="actions">
                        <button type="button" title="Retry processing">↻</button>
                        <button type="button" title="View details">▣</button>
                        <button type="button" title="More options">⋮</button>
                      </div>
                    </td>
                  </tr>
                </tbody>

                <tbody v-else>
                  <tr>
                    <td colspan="7">
                      <div class="empty-state">
                        <h3>No unprocessed documents</h3>

                        <p>
                          Files that cannot be indexed, parsed, or linked to the knowledge base will appear here for review.
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <footer class="table-footer">
                <span>
                  Showing {{ filteredDocuments.length }} of {{ totalElements }} entries
                </span>

                <div class="pagination">
                  <button
                    :disabled="currentPage === 0 || isLoading"
                    @click="goToPage(currentPage - 1)"
                  >
                    Previous
                  </button>

                  <button
                    v-for="p in totalPages"
                    :key="p"
                    :class="{ active: p - 1 === currentPage }"
                    :disabled="isLoading"
                    @click="goToPage(p - 1)"
                  >
                    {{ p }}
                  </button>

                  <button
                    :disabled="currentPage >= totalPages - 1 || isLoading"
                    @click="goToPage(currentPage + 1)"
                  >
                    Next
                  </button>
                </div>
              </footer>
            </section>
          </Transition>
        </div>
      </main>
    </div>
  </LightTheme>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { authService } from '@/services/authService'

import LightTheme from '@/components/LightTheme.vue'
import ThemeEffects from '@/components/ThemeEffects.vue'
import ChatSidebar from '@/components/ChatSidebar.vue'

import mainLogo from '@/assets/oconnors-logo.png'
import logoPng from '@/assets/logo.png'
import chatLogo from '@/assets/chat-logo.png'

const documentServiceUrl = import.meta.env.VITE_DOCUMENT_SERVICE_URL || 'http://localhost:8083'

type ChatItem = {
  id: number
  name: string
  messages: unknown[]
  selectedDocumentId?: string | null
}

type FailedDocumentResponse = {
  id: number
  fileName: string
  sharepointPath: string | null
  sharepointId: string | null
  etag: string | null
  lastModified: string | null
  lastProcessed: string | null
  createdAt: string | null
  updatedAt: string | null
}

type DocumentItem = {
  id: string
  name: string
  size: string
  fileType: string
  failedDate: string
  issue: string
  sourceChat: string
  status: 'Failed' | 'Unsupported' | 'Needs Review'
  extension: string
}

const router = useRouter()
const userStore = useUserStore()

const isLightTheme = ref(false)
const themeTransition = ref<'light-wipe' | 'dark-wipe' | null>(null)

const isSidebarExpanded = ref(true)
const isBrandHovered = ref(false)

const sidebarSearchQuery = ref('')
const selectedChatId = ref(1)
const openMenuChatId = ref<number | null>(null)
const editingChatId = ref<number | null>(null)
const editingChatName = ref('')

const sidebarChats = ref<ChatItem[]>([
  {
    id: 1,
    name: 'New Chat',
    messages: [],
    selectedDocumentId: null
  }
])

const documentSearchQuery = ref('')
const documents = ref<DocumentItem[]>([])
const isLoading = ref(false)
const fetchError = ref<string | null>(null)
const currentPage = ref(0)
const pageSize = ref(20)
const totalElements = ref(0)
const totalPages = ref(0)

const displayName = computed(() => {
  const fullName = userStore.account?.name?.trim() || 'User'
  const cleanedName = fullName.replace(/\s*\([^)]*\)/g, '').trim()

  return cleanedName.split(' ')[0] || 'User'
})

const displayRole = computed(() => {
  const account = userStore.account
  const fullName = account?.name || ''
  const roleFromName = fullName.match(/\(([^)]+)\)/)?.[1]

  if (roleFromName) return roleFromName

  const roles =
    (account as any)?.idTokenClaims?.roles ||
    (account as any)?.idTokenClaims?.extension_Role ||
    (account as any)?.idTokenClaims?.role

  if (Array.isArray(roles) && roles.length > 0) return roles[0]
  if (typeof roles === 'string' && roles.trim()) return roles

  const email = account?.username?.toLowerCase() || ''

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

const selectedChatName = computed(() => {
  const chat = sidebarChats.value.find(item => item.id === selectedChatId.value)
  return chat?.name || 'New Chat'
})

const filteredSidebarChats = computed(() => {
  const query = sidebarSearchQuery.value.trim().toLowerCase()

  if (!query) return sidebarChats.value

  return sidebarChats.value.filter(chat =>
    chat.name.toLowerCase().includes(query)
  )
})

const filteredDocuments = computed(() => {
  const query = documentSearchQuery.value.trim().toLowerCase()

  if (!query) return documents.value

  return documents.value.filter(doc =>
    doc.name.toLowerCase().includes(query) ||
    doc.fileType.toLowerCase().includes(query) ||
    doc.issue.toLowerCase().includes(query) ||
    doc.status.toLowerCase().includes(query) ||
    doc.sourceChat.toLowerCase().includes(query)
  )
})

function getExtension(fileName: string): string {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'file'
}

function getFileType(extension: string): string {
  const map: Record<string, string> = {
    pdf: 'PDF', doc: 'Word', docx: 'Word',
    xls: 'Excel', xlsx: 'Excel',
    png: 'Image', jpg: 'Image', jpeg: 'Image',
  }
  return map[extension] ?? extension.toUpperCase()
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

async function fetchFailedDocuments(page = 0) {
  isLoading.value = true
  fetchError.value = null

  try {
    const token = await authService.getToken()
    const url = `${documentServiceUrl}/documents/failed?page=${page}&size=${pageSize.value}`
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

    const response = await fetch(url, { headers })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    const data = await response.json()

    currentPage.value = data.page
    totalPages.value = data.totalPages
    totalElements.value = data.totalElements

    documents.value = (data.content as FailedDocumentResponse[]).map(doc => {
      const ext = getExtension(doc.fileName)
      return {
        id: String(doc.id),
        name: doc.fileName,
        extension: ext,
        fileType: getFileType(ext),
        failedDate: formatDate(doc.lastProcessed ?? doc.updatedAt),
        issue: 'Extraction Failed',
        sourceChat: doc.sharepointPath ?? '—',
        status: 'Failed' as const,
        size: '—',
      }
    })
  } catch (err) {
    fetchError.value = err instanceof Error ? err.message : 'Failed to load documents'
    documents.value = []
  } finally {
    isLoading.value = false
  }
}

function goToPage(page: number) {
  if (page < 0 || page >= totalPages.value) return
  fetchFailedDocuments(page)
}

function loadSidebarChats() {
  const savedChats = localStorage.getItem('chatSidebarList')

  if (!savedChats) return

  try {
    const parsedChats = JSON.parse(savedChats) as ChatItem[]

    if (Array.isArray(parsedChats) && parsedChats.length > 0) {
      sidebarChats.value = parsedChats
      selectedChatId.value = parsedChats[0].id
    }
  } catch {
    sidebarChats.value = [
      {
        id: 1,
        name: 'New Chat',
        messages: [],
        selectedDocumentId: null
      }
    ]
  }
}

function toggleTheme() {
  themeTransition.value = isLightTheme.value ? 'dark-wipe' : 'light-wipe'

  window.setTimeout(() => {
    isLightTheme.value = !isLightTheme.value
  }, 280)

  window.setTimeout(() => {
    themeTransition.value = null
  }, 850)
}

function toggleSidebar() {
  isSidebarExpanded.value = !isSidebarExpanded.value
}

function handleSearchEnter() {
  const firstMatch = filteredSidebarChats.value[0]

  if (firstMatch) {
    selectChatForDocuments(firstMatch.id)
  }
}

function selectChatForDocuments(chatId: number) {
  selectedChatId.value = chatId
  openMenuChatId.value = null
  documentSearchQuery.value = ''
}

function toggleMenu(chatId: number) {
  openMenuChatId.value = openMenuChatId.value === chatId ? null : chatId
}

function startRename(chatId: number) {
  const chat = sidebarChats.value.find(item => item.id === chatId)

  if (!chat) return

  editingChatId.value = chatId
  editingChatName.value = chat.name
  openMenuChatId.value = null
}

function saveRename(chatId: number) {
  const chat = sidebarChats.value.find(item => item.id === chatId)

  if (!chat) return

  if (editingChatName.value.trim()) {
    chat.name = editingChatName.value.trim()
  }

  localStorage.setItem('chatSidebarList', JSON.stringify(sidebarChats.value))

  editingChatId.value = null
  editingChatName.value = ''
}

function cancelRename() {
  editingChatId.value = null
  editingChatName.value = ''
}

function deleteChat(chatId: number) {
  if (sidebarChats.value.length === 1) return

  sidebarChats.value = sidebarChats.value.filter(chat => chat.id !== chatId)

  if (selectedChatId.value === chatId) {
    selectedChatId.value = sidebarChats.value[0].id
  }

  localStorage.setItem('chatSidebarList', JSON.stringify(sidebarChats.value))

  openMenuChatId.value = null
}

async function handleLogout() {
  await authService.logout()
  router.push('/login')
}

onMounted(() => {
  loadSidebarChats()
  fetchFailedDocuments(0)
})
</script>

<style scoped>
.document-shell {
  width: 100vw;
  height: 100vh;
  display: flex;
  overflow: hidden;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
  background:
    radial-gradient(circle at center, rgba(0, 102, 255, 0.05) 0%, transparent 35%),
    linear-gradient(180deg, #05070d 0%, #03050a 100%);
}

.document-main {
  flex: 1;
  min-width: 0;
  height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at center, rgba(0, 102, 255, 0.05) 0%, transparent 35%),
    linear-gradient(180deg, #05070d 0%, #03050a 100%);
  animation: pageFadeIn 0.45s ease both;
}

.document-header {
  height: 74px;
  padding: 0 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.055);
  background: linear-gradient(90deg, rgba(11, 16, 30, 0.96), rgba(8, 12, 22, 0.78));
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: headerSlideDown 0.45s ease both;
}

.document-header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #f5f7ff;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.document-content {
  height: calc(100vh - 74px);
  padding: 18px 26px 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.document-toolbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 16px;
  animation: toolbarFadeUp 0.5s ease both;
}

.document-search {
  width: min(360px, 38vw);
  height: 40px;
  border-radius: 12px;
  background: rgba(16, 20, 32, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 13px;
}

.document-search span {
  color: #8b93a8;
}

.document-search input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #d8def0;
  font-size: 14px;
}

.document-search:focus-within {
  border-color: rgba(88, 128, 238, 0.75);
  box-shadow: 0 0 0 3px rgba(88, 128, 238, 0.12);
  transform: translateY(-1px);
}

.filter-btn,
.view-buttons button {
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  background: rgba(16, 20, 32, 0.88);
  color: #dce3f5;
  padding: 0 14px;
  cursor: pointer;
  font-weight: 650;
}

.view-buttons {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.table-card {
  flex: 1;
  min-height: 0;
  max-height: 100%;
  border-radius: 16px;
  background: rgba(16, 20, 32, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 0 22px rgba(47, 140, 255, 0.06),
    inset 0 0 18px rgba(255, 255, 255, 0.025);
  animation: tableReveal 0.55s ease both;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

thead {
  flex: 0 0 auto;
}

tbody {
  display: block;
  flex: 1;
  overflow-y: auto;
}

thead,
tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}

th {
  height: 42px;
  text-align: left;
  color: #9aa3b8;
  font-size: 10px;
  font-weight: 850;
  padding: 0 14px;
  background: rgba(16, 20, 32, 0.96);
}

td {
  height: 62px;
  padding: 0 14px;
  color: #b9c1d4;
  font-size: 13px;
  border-top: 1px solid rgba(255, 255, 255, 0.045);
}

th:first-child,
td:first-child {
  width: 46px;
}

th:last-child,
td:last-child {
  width: 130px;
}

tbody tr {
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease;
  animation: rowFadeIn 0.35s ease both;
}

tbody tr:hover {
  background: rgba(88, 128, 238, 0.045);
}

tbody tr:nth-child(1) {
  animation-delay: 0.04s;
}

tbody tr:nth-child(2) {
  animation-delay: 0.08s;
}

tbody tr:nth-child(3) {
  animation-delay: 0.12s;
}

tbody tr:nth-child(4) {
  animation-delay: 0.16s;
}

tbody tr:nth-child(5) {
  animation-delay: 0.2s;
}

.doc-name {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.doc-name strong {
  display: block;
  color: #f4f7ff;
  font-size: 13px;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-name span {
  color: #8f98ad;
  font-size: 12px;
}

.file-icon {
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  border-radius: 8px;
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  background: rgba(88, 128, 238, 0.16);
  color: #9ab4ff;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

tbody tr:hover .file-icon {
  transform: scale(1.08) rotate(-3deg);
  box-shadow: 0 0 18px rgba(88, 128, 238, 0.18);
}

.file-icon.pdf {
  background: rgba(220, 76, 76, 0.16);
  color: #ff8b8b;
}

.file-icon.doc,
.file-icon.docx {
  background: rgba(70, 120, 255, 0.16);
  color: #8fb0ff;
}

.file-icon.xls,
.file-icon.xlsx {
  background: rgba(44, 190, 95, 0.16);
  color: #75e095;
}

.tag {
  padding: 5px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.055);
  color: #aab3c8;
  font-size: 10px;
}

.tag.primary {
  background: rgba(98, 91, 255, 0.16);
  color: #c3bdff;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: statusPulse 1.6s ease-in-out infinite;
}

.status.failed {
  color: #ff8b8b;
}

.status.failed .status-dot {
  background: #ff6b6b;
}

.status.unsupported {
  color: #ffa94d;
}

.status.unsupported .status-dot {
  background: #ffa94d;
}

.status.needs-review {
  color: #a78bfa;
}

.status.needs-review .status-dot {
  background: #a78bfa;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.actions button {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(8, 11, 19, 0.55);
  color: #aab3c8;
  cursor: pointer;
}

.empty-state {
  height: calc(100vh - 250px);
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: emptyFloatIn 0.55s ease both;
}

.empty-state h3 {
  margin: 0 0 8px;
  color: #f5f7ff;
  font-size: 18px;
  animation: softGlowText 2.8s ease-in-out infinite;
}

.empty-state p {
  max-width: 560px;
  margin: 0;
  color: #9aa3b8;
  font-size: 14px;
  text-align: center;
  line-height: 1.6;
}

.table-footer {
  flex: 0 0 54px;
  height: 54px;
  padding: 0 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.045);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #9aa3b8;
  font-size: 12px;
  animation: footerFadeUp 0.5s ease both;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination button {
  min-width: 34px;
  height: 31px;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(8, 11, 19, 0.55);
  color: #aab3c8;
}

.pagination button.active {
  background: #6752e8;
  color: white;
}

.pagination button:disabled {
  opacity: 0.45;
}

.document-search,
.filter-btn,
.view-buttons button,
.actions button,
.pagination button,
.theme-toggle-btn {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.filter-btn:hover,
.view-buttons button:hover,
.actions button:hover,
.pagination button:hover {
  transform: translateY(-2px);
  border-color: rgba(88, 128, 238, 0.5);
  box-shadow: 0 8px 20px rgba(47, 140, 255, 0.12);
}

.document-slide-enter-active,
.document-slide-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.document-slide-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.document-slide-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

.theme-toggle-btn {
  position: relative;
  width: 50px;
  height: 46px;
  border-radius: 17px;
  border: 1px solid rgba(47, 140, 255, 0.75);
  background: #07111f;
  cursor: pointer;
  overflow: hidden;
  box-shadow:
    inset 0 0 18px rgba(255, 255, 255, 0.04),
    0 0 18px rgba(47, 140, 255, 0.16);
  animation: themeIdleGlow 2.4s ease-in-out infinite;
}

.theme-toggle-btn.lightActive {
  background:
    radial-gradient(circle at center, rgba(96, 165, 250, 0.18), transparent 68%),
    linear-gradient(180deg, #ffffff, #eef4ff);
  border-color: rgba(47, 140, 255, 0.72);
  box-shadow:
    0 0 18px rgba(47, 140, 255, 0.18),
    inset 0 0 14px rgba(47, 140, 255, 0.08);
}

.theme-toggle-btn:hover {
  width: 285px;
  transform: scale(1.02);
  box-shadow:
    0 0 28px rgba(47, 140, 255, 0.28),
    inset 0 0 18px rgba(255, 255, 255, 0.05);
}

.theme-scene,
.day-scene,
.night-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 16px;
}

.sun-core,
.moon-core {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 10;
  transform: translate(-50%, -50%);
  line-height: 1;
}

.sun-core {
  color: #ffd331;
  font-size: 26px;
  text-shadow:
    0 0 12px rgba(255, 211, 49, 0.9),
    0 0 28px rgba(255, 174, 0, 0.38);
}

.moon-core {
  color: #ffffff;
  font-size: 30px;
  font-weight: 700;
  text-shadow:
    0 0 10px rgba(255, 255, 255, 0.95),
    0 0 22px rgba(147, 197, 253, 0.75),
    0 0 42px rgba(96, 165, 250, 0.45);
  filter:
    drop-shadow(0 0 10px rgba(255, 255, 255, 0.9))
    drop-shadow(0 0 24px rgba(96, 165, 250, 0.5));
}

.theme-toggle-btn:hover .sun-core {
  left: 27px;
}

.theme-toggle-btn:hover .moon-core {
  left: 32px;
  transform: translate(-50%, -50%) scale(1.08);
}

.theme-toggle-btn:hover .day-scene {
  background:
    linear-gradient(180deg, #72b2ff 0%, #a9d4ff 44%, #7ac85c 45%, #4ca144 100%);
}

.theme-toggle-btn:hover .night-scene {
  background:
    radial-gradient(circle at 78% 18%, rgba(255, 255, 255, 0.22), transparent 11%),
    linear-gradient(180deg, #07123a 0%, #0a1d55 58%, #07111f 100%);
}

.cloud,
.night-cloud {
  position: absolute;
  opacity: 0;
  border-radius: 999px;
}

.theme-toggle-btn:hover .cloud {
  opacity: 1;
  background: rgba(255, 255, 255, 0.95);
  box-shadow:
    14px 4px 0 rgba(255, 255, 255, 0.9),
    28px -1px 0 rgba(255, 255, 255, 0.78);
  animation: cloudPass 5s linear infinite;
}

.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: inherit;
}

.cloud::before {
  width: 16px;
  height: 16px;
  left: 7px;
  top: -7px;
}

.cloud::after {
  width: 19px;
  height: 19px;
  right: 5px;
  top: -9px;
}

.cloud-1 {
  width: 34px;
  height: 13px;
  top: 10px;
  left: 75px;
}

.cloud-2 {
  width: 40px;
  height: 14px;
  top: 15px;
  left: 150px;
  animation-delay: 1s !important;
}

.cloud-3 {
  width: 36px;
  height: 13px;
  top: 9px;
  left: 215px;
  animation-delay: 1.8s !important;
}

.cloud-4 {
  width: 30px;
  height: 11px;
  top: 18px;
  left: 245px;
  animation-delay: 2.5s !important;
}

.hill {
  position: absolute;
  bottom: -22px;
  opacity: 0;
  border-radius: 50%;
}

.theme-toggle-btn:hover .hill {
  opacity: 1;
}

.hill-1 {
  width: 170px;
  height: 52px;
  left: 24px;
  background: #6fba55;
}

.hill-2 {
  width: 210px;
  height: 58px;
  left: 116px;
  bottom: -26px;
  background: #4f9d45;
}

.rabbit {
  position: absolute;
  opacity: 0;
  z-index: 9;
  font-size: 20px;
  bottom: 13px;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.16));
  transform-origin: bottom center;
}

.theme-toggle-btn:hover .rabbit {
  opacity: 1;
}

.rabbit-1 {
  left: 88px;
  animation: rabbitHop 0.8s ease-in-out infinite;
}

.rabbit-2 {
  left: 175px;
  animation: rabbitHopFlip 0.85s ease-in-out infinite;
  animation-delay: 0.15s;
}

.rabbit-3 {
  left: 232px;
  font-size: 18px;
  animation: rabbitHop 0.95s ease-in-out infinite;
  animation-delay: 0.3s;
}

.flower {
  position: absolute;
  opacity: 0;
  z-index: 8;
  font-size: 15px;
  transform: scale(0.3);
}

.theme-toggle-btn:hover .flower {
  opacity: 1;
  animation: flowerBloom 1.2s ease-in-out infinite alternate;
}

.flower-1 {
  left: 126px;
  bottom: 6px;
  color: #ff5faa;
}

.flower-2 {
  left: 205px;
  bottom: 8px;
  color: #fff176;
  animation-delay: 0.18s !important;
}

.flower-3 {
  left: 260px;
  bottom: 6px;
  color: #ff9f43;
  animation-delay: 0.3s !important;
}

.flower-4 {
  left: 155px;
  bottom: 5px;
  color: #fff176;
  animation-delay: 0.45s !important;
}

.theme-toggle-btn:hover .night-cloud {
  opacity: 1;
  background: rgba(129, 140, 248, 0.24);
  box-shadow:
    28px 5px 0 rgba(129, 140, 248, 0.18),
    56px -2px 0 rgba(129, 140, 248, 0.14);
  animation: nightCloudDrift 5s linear infinite;
}

.night-cloud-1 {
  width: 50px;
  height: 16px;
  bottom: 8px;
  left: 105px;
}

.night-cloud-2 {
  width: 64px;
  height: 18px;
  bottom: 14px;
  left: 205px;
}

.star {
  position: absolute;
  opacity: 0;
  color: #ffffff;
  z-index: 7;
  text-shadow:
    0 0 8px rgba(255, 255, 255, 0.95),
    0 0 18px rgba(147, 197, 253, 0.55);
}

.theme-toggle-btn:hover .star {
  opacity: 1;
  animation: starShimmer 1.35s ease-in-out infinite;
}

.star-1 {
  left: 92px;
  top: 8px;
  font-size: 12px;
}

.star-2 {
  left: 150px;
  top: 22px;
  font-size: 9px;
  animation-delay: 0.3s !important;
}

.star-3 {
  left: 205px;
  top: 9px;
  font-size: 14px;
  animation-delay: 0.6s !important;
}

.star-4 {
  left: 250px;
  top: 24px;
  font-size: 10px;
  animation-delay: 0.9s !important;
}

@keyframes pageFadeIn {
  from {
    opacity: 0;
    transform: scale(0.985);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes headerSlideDown {
  from {
    opacity: 0;
    transform: translateY(-14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toolbarFadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes tableReveal {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.99);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes rowFadeIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes statusPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(255, 107, 107, 0);
  }

  50% {
    transform: scale(1.35);
    box-shadow: 0 0 12px currentColor;
  }
}

@keyframes emptyFloatIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes softGlowText {
  0%, 100% {
    text-shadow: 0 0 0 rgba(88, 128, 238, 0);
  }

  50% {
    text-shadow: 0 0 18px rgba(88, 128, 238, 0.28);
  }
}

@keyframes footerFadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes themeIdleGlow {
  0%, 100% {
    box-shadow:
      inset 0 0 18px rgba(255, 255, 255, 0.04),
      0 0 18px rgba(47, 140, 255, 0.16);
  }

  50% {
    box-shadow:
      inset 0 0 18px rgba(255, 255, 255, 0.055),
      0 0 26px rgba(47, 140, 255, 0.28);
  }
}

@keyframes cloudPass {
  from {
    transform: translateX(-45px);
  }

  to {
    transform: translateX(75px);
  }
}

@keyframes nightCloudDrift {
  from {
    transform: translateX(80px);
  }

  to {
    transform: translateX(-130px);
  }
}

@keyframes rabbitHop {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }

  45% {
    transform: translateY(-9px) rotate(-4deg);
  }
}

@keyframes rabbitHopFlip {
  0%, 100% {
    transform: scaleX(-1) translateY(0) rotate(0deg);
  }

  45% {
    transform: scaleX(-1) translateY(-9px) rotate(4deg);
  }
}

@keyframes flowerBloom {
  0% {
    transform: scale(0.45) rotate(-4deg);
  }

  100% {
    transform: scale(1.1) rotate(6deg);
  }
}

@keyframes starShimmer {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.42;
  }

  50% {
    transform: scale(1.3);
    opacity: 1;
  }
}

@media (max-width: 1100px) {
  .document-header {
    padding: 0 18px;
  }

  .document-content {
    padding: 14px 18px 18px;
  }

  .document-search {
    width: 260px;
  }

  th,
  td {
    padding: 0 10px;
    font-size: 12px;
  }
}
</style>