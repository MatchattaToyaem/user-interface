<template>
  <div
    class="chat-theme-shell"
    :class="{ lightTheme: isLightTheme }"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isLightTheme: boolean
}>()
</script>

<style scoped>
.chat-theme-shell {
  display: contents;
}

.chat-theme-shell.lightTheme :deep(.chat-page) {
  background:
    radial-gradient(circle at center, rgba(47, 140, 255, 0.12) 0%, transparent 38%),
    linear-gradient(180deg, #eef6ff 0%, #f8fbff 100%);
  color: #0f172a;
}

.chat-theme-shell.lightTheme :deep(.sidebar) {
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.98), rgba(224, 239, 255, 0.98));
  border-right: 1px solid rgba(37, 99, 235, 0.12);
}

.chat-theme-shell.lightTheme :deep(.topbar) {
  background: linear-gradient(90deg, rgba(239, 246, 255, 0.96), rgba(248, 251, 255, 0.88));
  border-bottom: 1px solid rgba(37, 99, 235, 0.12);
}

.chat-theme-shell.lightTheme :deep(.topbar h1),
.chat-theme-shell.lightTheme :deep(.brand-text),
.chat-theme-shell.lightTheme :deep(.history-text),
.chat-theme-shell.lightTheme :deep(.profile-name) {
  color: #0f172a;
}

.chat-theme-shell.lightTheme :deep(.ready) {
  color: #047857;
  background: rgba(209, 250, 229, 0.95);
  border-color: rgba(16, 185, 129, 0.28);
  box-shadow:
    0 0 20px rgba(16, 185, 129, 0.12),
    inset 0 0 12px rgba(255, 255, 255, 0.35);
}

.chat-theme-shell.lightTheme :deep(.ready-dot) {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.85);
}

.chat-theme-shell.lightTheme :deep(.new-chat-btn) {
  background: rgba(255, 255, 255, 0.88);
  color: #2563eb;
  border-color: rgba(47, 140, 255, 0.68);
  box-shadow:
    0 0 20px rgba(47, 140, 255, 0.08),
    inset 0 0 12px rgba(255, 255, 255, 0.5);
}

.chat-theme-shell.lightTheme :deep(.new-chat-btn:hover) {
  background: rgba(239, 246, 255, 0.98);
  box-shadow: 0 0 24px rgba(47, 140, 255, 0.18);
}

.chat-theme-shell.lightTheme :deep(.theme-toggle-btn) {
  background: #ffffff;
  border-color: rgba(47, 140, 255, 0.65);
  box-shadow:
    0 0 18px rgba(47, 140, 255, 0.12),
    inset 0 0 12px rgba(47, 140, 255, 0.04);
}

.chat-theme-shell.lightTheme :deep(.sidebar-toggle-icon-btn) {
  background: rgba(255, 255, 255, 0.9);
  color: #1d4ed8;
  border-color: rgba(37, 99, 235, 0.28);
  box-shadow: 0 0 18px rgba(47, 140, 255, 0.12);
}

.chat-theme-shell.lightTheme :deep(.sidebar-toggle-icon-btn:hover) {
  background: rgba(219, 234, 254, 0.95);
  border-color: rgba(37, 99, 235, 0.42);
  box-shadow: 0 0 22px rgba(47, 140, 255, 0.18);
}

.chat-theme-shell.lightTheme :deep(.brand-logo) {
  background: rgba(219, 234, 254, 0.85);
  box-shadow:
    0 0 20px rgba(47, 140, 255, 0.22),
    0 0 42px rgba(47, 140, 255, 0.12);
}

.chat-theme-shell.lightTheme :deep(.brand-logo img),
.chat-theme-shell.lightTheme :deep(.collapsed-brand-logo) {
  filter: drop-shadow(0 0 10px rgba(37, 99, 235, 0.35));
}

.chat-theme-shell.lightTheme :deep(.brand-pulse) {
  background: rgba(47, 140, 255, 0.14);
}

.chat-theme-shell.lightTheme :deep(.collapsed-brand:hover),
.chat-theme-shell.lightTheme :deep(.brand-button.collapsed:hover .collapsed-brand) {
  background: rgba(37, 99, 235, 0.08);
}

.chat-theme-shell.lightTheme :deep(.search-box),
.chat-theme-shell.lightTheme :deep(.history-dropdown) {
  background: rgba(255, 255, 255, 0.78);
  border-color: rgba(37, 99, 235, 0.14);
}

.chat-theme-shell.lightTheme :deep(.search-box input) {
  color: #0f172a;
}

.chat-theme-shell.lightTheme :deep(.search-box input::placeholder) {
  color: #64748b;
}

.chat-theme-shell.lightTheme :deep(.history-title),
.chat-theme-shell.lightTheme :deep(.profile-role) {
  color: #64748b;
}

.chat-theme-shell.lightTheme :deep(.history-item) {
  color: #334155;
}

.chat-theme-shell.lightTheme :deep(.history-item:hover) {
  background: rgba(37, 99, 235, 0.07);
}

.chat-theme-shell.lightTheme :deep(.history-item.selected) {
  background: rgba(255, 255, 255, 0.86);
  border-color: #2f8cff;
  color: #0f172a;
  box-shadow:
    inset 0 0 0 1px rgba(47, 140, 255, 0.15),
    0 0 20px rgba(47, 140, 255, 0.16);
}

.chat-theme-shell.lightTheme :deep(.history-menu) {
  color: #64748b;
}

.chat-theme-shell.lightTheme :deep(.history-dropdown button) {
  color: #0f172a;
}

.chat-theme-shell.lightTheme :deep(.delete-action) {
  color: #dc2626 !important;
}

.chat-theme-shell.lightTheme :deep(.history-rename-input) {
  background: rgba(255, 255, 255, 0.95);
  color: #0f172a;
  border-color: rgba(47, 140, 255, 0.5);
}

.chat-theme-shell.lightTheme :deep(.profile-card) {
  border-top: 1px solid rgba(37, 99, 235, 0.14);
}

.chat-theme-shell.lightTheme :deep(.logout-btn) {
  background: rgba(255, 255, 255, 0.66);
  border: 1px solid rgba(37, 99, 235, 0.14);
  color: #0f172a;
}

.chat-theme-shell.lightTheme :deep(.logout-btn:hover) {
  background: rgba(239, 246, 255, 0.95);
  box-shadow: 0 0 18px rgba(47, 140, 255, 0.12);
}

.chat-theme-shell.lightTheme :deep(.logout-btn),
.chat-theme-shell.lightTheme :deep(.collapsed-rail-item),
.chat-theme-shell.lightTheme :deep(.collapsed-user-btn),
.chat-theme-shell.lightTheme :deep(.collapsed-logout-btn) {
  color: #1e293b;
}

.chat-theme-shell.lightTheme :deep(.collapsed-bottom) {
  border-top: 1px solid rgba(37, 99, 235, 0.14);
}

.chat-theme-shell.lightTheme :deep(.collapsed-search-icon),
.chat-theme-shell.lightTheme :deep(.collapsed-logout-icon),
.chat-theme-shell.lightTheme :deep(.collapsed-sidebar-icon) {
  color: #1d4ed8;
}

.chat-theme-shell.lightTheme :deep(.collapsed-tooltip) {
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
  border-color: rgba(37, 99, 235, 0.14);
}

.chat-theme-shell.lightTheme :deep(.profile-avatar),
.chat-theme-shell.lightTheme :deep(.collapsed-user-avatar) {
  background: #ffffff;
  color: #0f172a;
  border: 1px solid rgba(37, 99, 235, 0.12);
}

.chat-theme-shell.lightTheme :deep(.chat-body) {
  background: transparent;
  scrollbar-color: rgba(47, 140, 255, 0.55) rgba(226, 232, 240, 0.8);
}

.chat-theme-shell.lightTheme :deep(.chat-body::-webkit-scrollbar-track) {
  background: rgba(226, 232, 240, 0.75);
}

.chat-theme-shell.lightTheme :deep(.chat-body::-webkit-scrollbar-thumb) {
  background: linear-gradient(180deg, rgba(47, 140, 255, 0.58), rgba(23, 113, 235, 0.32));
  border-color: rgba(239, 246, 255, 0.95);
}

.chat-theme-shell.lightTheme :deep(.message-row.user .message-bubble) {
  background: linear-gradient(180deg, rgba(219, 234, 254, 0.95), rgba(191, 219, 254, 0.9));
  color: #0f172a;
}

.chat-theme-shell.lightTheme :deep(.message-row.assistant .message-bubble),
.chat-theme-shell.lightTheme :deep(.message-row.thinking .message-bubble),
.chat-theme-shell.lightTheme :deep(.message-row.comparison_result .message-bubble) {
  background: rgba(255, 255, 255, 0.86);
  color: #0f172a;
  border-color: rgba(37, 99, 235, 0.12);
}

.chat-theme-shell.lightTheme :deep(.welcome-card h2) {
  color: #0f172a;
}

.chat-theme-shell.lightTheme :deep(.typing-text) {
  color: #64748b;
}

.chat-theme-shell.lightTheme :deep(.chat-input-bar) {
  background: rgba(255, 255, 255, 0.86);
  border-color: rgba(37, 99, 235, 0.16);
  box-shadow:
    0 0 36px rgba(47, 140, 255, 0.14),
    inset 0 0 18px rgba(255, 255, 255, 0.35);
}

.chat-theme-shell.lightTheme :deep(.chat-input-bar input[type='text']) {
  color: #0f172a;
}

.chat-theme-shell.lightTheme :deep(.chat-input-bar input[type='text']::placeholder) {
  color: #64748b;
}

.chat-theme-shell.lightTheme :deep(.response-action-btn) {
  background: rgba(255, 255, 255, 0.94);
  color: #0f172a;
  border-color: rgba(37, 99, 235, 0.16);
  box-shadow:
    0 12px 26px rgba(37, 99, 235, 0.06),
    inset 0 0 10px rgba(255, 255, 255, 0.6);
}

.chat-theme-shell.lightTheme :deep(.response-action-btn:hover) {
  color: #2563eb;
  border-color: rgba(47, 140, 255, 0.42);
  background: rgba(239, 246, 255, 0.98);
}

.chat-theme-shell.lightTheme :deep(.response-rating-card) {
  background: rgba(255, 255, 255, 0.94);
  color: #0f172a;
  border-color: rgba(37, 99, 235, 0.16);
  box-shadow:
    0 16px 34px rgba(37, 99, 235, 0.08),
    inset 0 0 12px rgba(255, 255, 255, 0.55);
}

.chat-theme-shell.lightTheme :deep(.rating-label) {
  color: #0f172a;
  font-weight: 600;
}

.chat-theme-shell.lightTheme :deep(.star-btn) {
  color: rgba(37, 99, 235, 0.45);
}

.chat-theme-shell.lightTheme :deep(.star-btn.active) {
  color: #ffd84d;
  text-shadow:
    0 0 8px rgba(255, 216, 77, 0.75),
    0 0 18px rgba(255, 191, 0, 0.35);
}

.chat-theme-shell.lightTheme :deep(.floating-reply-indicator) {
  background: rgba(255, 255, 255, 0.86);
  border-color: rgba(37, 99, 235, 0.16);
  box-shadow:
    0 0 22px rgba(47, 140, 255, 0.16),
    inset 0 0 18px rgba(255, 255, 255, 0.35);
}

.chat-theme-shell.lightTheme :deep(.floating-reply-indicator span) {
  background: #2563eb;
}
</style>