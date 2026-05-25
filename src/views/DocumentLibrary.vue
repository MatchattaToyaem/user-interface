<template>
  <LightTheme :is-light-theme="isLightTheme">
    <div class="document-shell">

      <!-- SIDEBAR -->
      <ChatSidebar
        :show-intro="false"
        :is-sidebar-expanded="isSidebarExpanded"
        :is-brand-hovered="false"
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
        @select-chat="selectChatForDocuments"
        @update-search="sidebarSearchQuery = $event"
        @logout="handleLogout"
      />

      <!-- MAIN -->
      <main class="document-main">

        <!-- HEADER -->
        <header class="document-header">
          <h1>Document Library</h1>

          <!-- THEME BUTTON -->
          <button class="theme-btn" @click="toggleTheme">
            {{ isLightTheme ? '🌙' : '☀' }}
          </button>
        </header>

        <!-- CONTENT -->
        <div class="document-content">

          <!-- TOOLBAR -->
          <div class="document-toolbar">
            <input
              v-model="searchQuery"
              placeholder="Search documents..."
            />

            <button>Issue Type</button>
            <button>Failed Date</button>
          </div>

          <!-- TABLE -->
          <transition name="fade-slide" mode="out-in">
            <div class="table-card" :key="selectedChatId">

              <table>
                <thead>
                  <tr>
                    <th>DOCUMENT NAME</th>
                    <th>FILE TYPE</th>
                    <th>FAILED DATE</th>
                    <th>ISSUE</th>
                    <th>SOURCE CHAT</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody v-if="filteredDocs.length">

                  <tr v-for="doc in filteredDocs" :key="doc.id">

                    <td>{{ doc.name }}</td>
                    <td>{{ doc.fileType }}</td>
                    <td>{{ doc.date }}</td>
                    <td>{{ doc.issue }}</td>
                    <td>{{ doc.chat }}</td>

                    <td class="actions">
                      <button>↻</button>
                      <button>⋮</button>
                    </td>

                  </tr>

                </tbody>

                <!-- EMPTY -->
                <tbody v-else>
                  <tr>
                    <td colspan="6">
                      <div class="empty">
                        <h3>No unprocessed documents</h3>
                        <p>
                          Files that cannot be indexed or processed will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>

              </table>

            </div>
          </transition>

        </div>

      </main>
    </div>
  </LightTheme>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { authService } from '@/services/authService'

import ChatSidebar from '@/components/ChatSidebar.vue'
import LightTheme from '@/components/LightTheme.vue'

import mainLogo from '@/assets/oconnors-logo.png'
import logoPng from '@/assets/logo.png'
import chatLogo from '@/assets/chat-logo.png'

const router = useRouter()
const userStore = useUserStore()

const isLightTheme = ref(false)
const isSidebarExpanded = ref(true)

const sidebarSearchQuery = ref('')
const selectedChatId = ref(1)

const searchQuery = ref('')

const docs = ref([])

const filteredDocs = computed(() => {
  if (!searchQuery.value) return docs.value

  return docs.value.filter((d: any) =>
    d.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const displayName = computed(() => userStore.account?.name?.split(' ')[0] || 'User')
const displayRole = computed(() => {
  const name = userStore.account?.name || ''
  const match = name.match(/\((.*?)\)/)
  return match ? match[1] : 'User'
})
const userInitial = computed(() => displayName.value[0])
const userPhoto = computed(() => userStore.account?.photo || '')

const selectedChatName = computed(() => 'New Chat')
const filteredSidebarChats = computed(() => [])

function toggleTheme() {
  isLightTheme.value = !isLightTheme.value
}

function selectChatForDocuments(id: number) {
  selectedChatId.value = id
}

async function handleLogout() {
  await authService.logout()
  router.push('/login')
}

onMounted(() => {
  docs.value = []
})
</script>

<style scoped>

.document-shell {
  display: flex;
  height: 100vh;
  background: #03050a;
}

.document-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.document-header {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.document-header h1 {
  font-size: 20px;
}

.theme-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.document-content {
  padding: 16px 24px;
}

.document-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.document-toolbar input {
  width: 280px;
  height: 36px;
  border-radius: 10px;
  background: #0f1420;
  border: none;
  padding: 0 10px;
  color: white;
}

.document-toolbar button {
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  background: #0f1420;
  border: none;
  color: white;
}

.table-card {
  background: #0f1420;
  border-radius: 12px;
  overflow: hidden;
}

table {
  width: 100%;
}

th {
  text-align: left;
  padding: 12px;
  font-size: 11px;
  color: #aaa;
}

td {
  padding: 12px;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.actions button {
  margin-right: 6px;
}

.empty {
  text-align: center;
  padding: 60px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: 0.2s;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

</style>