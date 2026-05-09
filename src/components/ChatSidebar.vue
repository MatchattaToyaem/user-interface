<template>
  <aside
    class="sidebar"
    :class="{ collapsed: !isSidebarExpanded, introSidebar: showIntro }"
  >
    <div class="sidebar-top">
      <button
        class="brand-button"
        :class="{ collapsed: !isSidebarExpanded }"
        @click="$emit('brand-click')"
        @mouseenter="$emit('brand-hover', true)"
        @mouseleave="$emit('brand-hover', false)"
      >
        <div v-if="isSidebarExpanded" class="brand">
          <div class="brand-logo-wrap">
            <div class="brand-pulse brand-pulse-1"></div>
            <div class="brand-pulse brand-pulse-2"></div>

            <div class="brand-logo">
              <img :src="mainLogo" alt="O'Connors AI" />
              <span class="lucky-tooltip">
                I'm feeling lucky!
              </span>
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
        @click="$emit('toggle-sidebar')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M15 18L9 12L15 6" />
        </svg>
      </button>
    </div>

    <template v-if="isSidebarExpanded">
      <div class="search-box">
        <span class="search-icon">⌕</span>

        <input
          :value="searchQuery"
          type="text"
          placeholder="Search..."
          @input="$emit('update-search', ($event.target as HTMLInputElement).value)"
          @keyup.enter="$emit('search-enter')"
        />
      </div>

      <div class="history-section">
        <p class="history-title">CHAT HISTORY</p>

        <TransitionGroup
          name="chat-delete"
          tag="div"
          class="history-list"
        >
          <div
            v-for="chat in filteredChats"
            :key="chat.id"
            class="history-item"
            :class="{ selected: selectedChatId === chat.id }"
            @click="$emit('select-chat', chat.id)"
          >
            <div class="history-left">
              <img
                :src="chatLogo"
                alt="Chat"
                class="history-img-icon"
              />

              <input
                v-if="editingChatId === chat.id"
                :value="editingChatName"
                class="history-rename-input"
                type="text"
                autofocus
                @click.stop
                @input="$emit('update-editing-name', ($event.target as HTMLInputElement).value)"
                @keyup.enter="$emit('save-rename', chat.id)"
                @keyup.esc="$emit('cancel-rename')"
                @blur="$emit('save-rename', chat.id)"
              />

              <span v-else class="history-text">
                {{ chat.name }}
              </span>
            </div>

            <div class="history-actions">
              <button
                class="history-menu"
                @click.stop="$emit('toggle-menu', chat.id)"
              >
                •••
              </button>

              <div
                v-if="openMenuChatId === chat.id"
                class="history-dropdown"
              >
                <button @click.stop="$emit('rename-chat', chat.id)">
                  Rename
                </button>

                <button
                  class="delete-action"
                  @click.stop="$emit('delete-chat', chat.id)"
                >
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
            <img
              v-if="userPhoto"
              :src="userPhoto"
              alt="Profile photo"
              class="profile-photo"
            />

            <span v-else>{{ userInitial }}</span>
          </div>

          <div class="profile-info">
            <div class="profile-name">
              {{ displayName }}
            </div>

            <div class="profile-role">
              {{ displayRole }}
            </div>
          </div>
        </div>

        <button
          class="logout-btn"
          @click="$emit('logout')"
        >
          <span class="logout-icon">↩</span>
          <span>Logout</span>
        </button>
      </div>
    </template>

    <template v-else>
      <div class="collapsed-rail">
        <button
          class="collapsed-rail-item"
          @click="$emit('expand-search')"
          title="Search"
        >
          <span class="collapsed-search-icon">⌕</span>
          <span class="collapsed-tooltip">Search</span>
        </button>

        <div class="collapsed-recents-wrap">
          <button
            class="collapsed-rail-item selected-chat-item"
            title="Recents"
          >
            <img
              :src="chatLogo"
              alt="Recents"
              class="collapsed-rail-icon collapsed-chat-logo"
            />

            <span class="collapsed-tooltip">Recents</span>
          </button>

          <div class="recents-popup">
            <h4>Recents</h4>

            <button
              v-for="chat in filteredChats"
              :key="chat.id"
              class="recent-chat-btn"
              :class="{ active: selectedChatId === chat.id }"
              @click="$emit('select-chat', chat.id)"
            >
              {{ chat.name }}
            </button>
          </div>
        </div>
      </div>

      <div class="collapsed-bottom">
        <button
          class="collapsed-logout-btn"
          @click="$emit('logout')"
          title="Logout"
        >
          <span class="collapsed-logout-icon">↩</span>
          <span class="collapsed-tooltip">Logout</span>
        </button>

        <button
          class="collapsed-user-btn"
          @click="$emit('expand-sidebar')"
          :title="displayName"
        >
          <div class="collapsed-user-avatar">
            <img
              v-if="userPhoto"
              :src="userPhoto"
              alt="Profile photo"
              class="profile-photo"
            />

            <span v-else>{{ userInitial }}</span>
          </div>

          <span class="collapsed-tooltip">
            {{ displayName }}
          </span>
        </button>
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
type ChatItem = {
  id: number
  name: string
  messages: unknown[]
  selectedDocumentId?: string | null
}

defineProps<{
  showIntro: boolean
  isSidebarExpanded: boolean
  isBrandHovered: boolean
  mainLogo: string
  chatLogo: string
  searchQuery: string
  filteredChats: ChatItem[]
  selectedChatId: number
  selectedChatName: string
  openMenuChatId: number | null
  editingChatId: number | null
  editingChatName: string
  displayName: string
  displayRole: string
  userInitial: string
  userPhoto: string
}>()

defineEmits<{
  (e: 'toggle-sidebar'): void
  (e: 'brand-click'): void
  (e: 'brand-hover', value: boolean): void
  (e: 'update-search', value: string): void
  (e: 'search-enter'): void
  (e: 'select-chat', chatId: number): void
  (e: 'toggle-menu', chatId: number): void
  (e: 'rename-chat', chatId: number): void
  (e: 'delete-chat', chatId: number): void
  (e: 'update-editing-name', value: string): void
  (e: 'save-rename', chatId: number): void
  (e: 'cancel-rename'): void
  (e: 'new-chat'): void
  (e: 'logout'): void
  (e: 'expand-sidebar'): void
  (e: 'expand-search'): void
}>()
</script>

<style scoped>
.sidebar {
  width: 308px;
  min-width: 308px;
  max-width: 308px;
  background:
    linear-gradient(
      180deg,
      rgba(10, 16, 32, 0.97),
      rgba(6, 10, 22, 0.99)
    );
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  padding: 16px 16px 22px;
  overflow: hidden;
  box-shadow:
    8px 0 34px rgba(47, 140, 255, 0.045),
    inset -1px 0 0 rgba(47, 140, 255, 0.08);
  transition:
    width 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    min-width 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    max-width 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    padding 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.3s ease;
}

.sidebar.collapsed {
  width: 82px;
  min-width: 82px;
  max-width: 82px;
  padding: 16px 10px 18px;
  overflow: visible;
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
  overflow: visible;
  box-shadow: 0 0 20px rgba(41, 121, 255, 0.5);
}

.brand-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  filter: drop-shadow(0 0 16px rgba(37, 99, 235, 0.55));
  transition:
    transform 0.22s ease,
    filter 0.22s ease;
}

.brand-button:hover .brand-logo img {
  animation: excitedLogoSpin 0.55s ease-in-out;
  filter: drop-shadow(0 0 20px rgba(84, 166, 255, 0.85));
}

.lucky-tooltip {
  position: absolute;
  left: 48px;
  top: 50%;
  transform: translateY(-50%) translateX(-6px) scale(0.96);
  padding: 8px 11px;
  border-radius: 11px;
  background: rgba(14, 18, 28, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #f3f6ff;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.32);
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.brand-button:hover .lucky-tooltip {
  opacity: 1;
  transform: translateY(-50%) translateX(0) scale(1);
}

@keyframes excitedLogoSpin {
  0% {
    transform: rotate(0deg) scale(1);
  }

  35% {
    transform: rotate(-16deg) scale(1.08);
  }

  70% {
    transform: rotate(376deg) scale(1.12);
  }

  100% {
    transform: rotate(360deg) scale(1);
  }
}

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
  transition:
    background 0.24s ease,
    transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
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
  position: relative;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  color: #dbe8ff;
  background:
    linear-gradient(
      145deg,
      rgba(18, 26, 44, 0.96),
      rgba(8, 13, 24, 0.98)
    );
  box-shadow:
    inset 1px 1px 0 rgba(255,255,255,0.05),
    inset -2px -2px 5px rgba(0,0,0,0.42),
    0 6px 18px rgba(0,0,0,0.28),
    0 0 0 1px rgba(78, 144, 255, 0.06);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease;
}

.sidebar-toggle-icon-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,0.05),
      transparent 42%
    );
  pointer-events: none;
}

.sidebar-toggle-icon-btn svg {
  width: 18px;
  height: 18px;
  position: relative;
  z-index: 2;
  transition:
    transform 0.22s ease,
    filter 0.22s ease;
}

.sidebar-toggle-icon-btn:hover {
  transform: translateY(-1px) scale(1.03);
  background:
    linear-gradient(
      145deg,
      rgba(24, 34, 58, 0.98),
      rgba(10, 16, 30, 1)
    );
  box-shadow:
    inset 1px 1px 0 rgba(255,255,255,0.08),
    inset -3px -3px 8px rgba(0,0,0,0.5),
    0 10px 24px rgba(0,0,0,0.36),
    0 0 18px rgba(65, 140, 255, 0.14);
}

.sidebar-toggle-icon-btn:hover svg {
  transform: translateX(-2px);
  filter: drop-shadow(0 0 8px rgba(93, 167, 255, 0.45));
}

.sidebar-toggle-icon-btn:active {
  transform: scale(0.95);
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
  transition:
    border-color 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease;
}

.search-box:focus-within {
  border-color: rgba(77, 163, 255, 0.36);
  background: rgba(10, 16, 32, 0.96);
  box-shadow: 0 0 22px rgba(47, 140, 255, 0.12);
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

.history-section {
  flex: 1;
  padding-top: 10px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(47, 140, 255, 0.42) rgba(5, 7, 13, 0.55);
}

.history-section::-webkit-scrollbar {
  width: 8px;
}

.history-section::-webkit-scrollbar-track {
  background: rgba(5, 7, 13, 0.55);
  border-radius: 999px;
}

.history-section::-webkit-scrollbar-thumb {
  background:
    linear-gradient(
      180deg,
      rgba(47, 140, 255, 0.5),
      rgba(23, 113, 235, 0.25)
    );
  border-radius: 999px;
  border: 2px solid rgba(5, 7, 13, 0.9);
}

.history-section::-webkit-scrollbar-thumb:hover {
  background:
    linear-gradient(
      180deg,
      rgba(77, 163, 255, 0.72),
      rgba(23, 113, 235, 0.42)
    );
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
  transition:
    background 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.28s ease,
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.04);
  transform: translateY(-1px);
}

.history-item.selected {
  border: 1px solid #1184ff;
  color: #ffffff;
  background:
    linear-gradient(
      180deg,
      rgba(7, 15, 30, 0.95),
      rgba(6, 12, 24, 0.95)
    );
  box-shadow:
    inset 0 0 0 1px rgba(17, 132, 255, 0.2),
    0 0 18px rgba(17, 132, 255, 0.18);
}

.history-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
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

.history-rename-input {
  width: 100%;
  min-width: 0;
  background: rgba(8, 14, 26, 0.9);
  border: 1px solid rgba(77, 163, 255, 0.45);
  outline: none;
  color: #ffffff;
  font-size: 14px;
  border-radius: 9px;
  padding: 6px 8px;
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
  transition:
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    background 0.22s ease,
    box-shadow 0.22s ease;
}

.logout-btn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.055);
  box-shadow: 0 0 18px rgba(47, 140, 255, 0.08);
}

.collapsed-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin-top: 8px;
  padding-top: 10px;
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
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.collapsed-rail-item:hover,
.collapsed-user-btn:hover,
.collapsed-logout-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-1px);
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
  padding: 9px 11px;
  border-radius: 10px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
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

.collapsed-recents-wrap {
  position: relative;
}

.recents-popup {
  position: absolute;
  left: 62px;
  top: 50%;
  width: 270px;
  max-height: 420px;
  padding: 18px;
  border-radius: 16px;
  background: rgba(18, 22, 34, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  transform: translateY(-50%) translateX(-8px) scale(0.96);
  opacity: 0;
  pointer-events: none;
  z-index: 80;
  overflow-y: auto;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.collapsed-recents-wrap:hover .recents-popup {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(-50%) translateX(0) scale(1);
}

.recents-popup h4 {
  margin: 0 0 14px;
  color: #e7ebf5;
  font-size: 15px;
  font-weight: 700;
}

.recent-chat-btn {
  width: 100%;
  border: none;
  background: transparent;
  color: #e7ebf5;
  font-size: 14px;
  text-align: left;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.recent-chat-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateX(2px);
}

.recent-chat-btn.active {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.06);
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

.introSidebar {
  animation: sidebarIntro 0.75s ease both;
  animation-delay: 2.4s;
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
</style>