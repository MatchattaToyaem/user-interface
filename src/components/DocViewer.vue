<template>
  <transition name="doc-panel-slide">
    <aside v-if="isOpen && !isFullscreen" class="doc-viewer-panel">
      <div class="doc-topbar">
        <div class="doc-file-pill">
          <img :src="docLogo" alt="Document" class="doc-file-pill-icon" />
          <span class="doc-file-pill-name">
            {{ currentPreviewFileName }}
          </span>
        </div>

        <div class="doc-search-box">
          <span class="doc-search-icon">⌕</span>
          <input
            :value="docSearchQuery"
            type="text"
            placeholder="Search document..."
            @input="onSearchInput"
          />
        </div>

        <button class="doc-topbar-btn" title="Expand" @click="openFullscreen">
          ⤢
        </button>

        <button class="doc-topbar-btn doc-close-btn" title="Close" @click="$emit('close')">
          ✕
        </button>
      </div>

      <div class="doc-viewer-body">
        <template v-if="!currentChat || !currentChat.messages || currentChat.messages.length === 0">
          <div class="doc-empty-state">
            <div class="doc-empty-card">
              <div class="doc-empty-icon-wrap">
                <img :src="docLogo" alt="Doc viewer" class="doc-empty-icon" />
              </div>
              <h3>Start a conversation</h3>
              <p>Ask something first and then open Chat + Doc Viewer.</p>
            </div>
          </div>
        </template>

        <template v-else-if="!previewFile">
          <div class="doc-empty-state">
            <div class="doc-empty-card">
              <div class="doc-empty-icon-wrap">
                <img :src="docLogo" alt="Doc viewer" class="doc-empty-icon" />
              </div>
              <h3>No documents to show</h3>
              <p>Upload a document and it will appear here.</p>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="doc-preview-shell">
            <transition name="doc-loading-fade" mode="out-in">
              <div v-if="isDocLoading" key="loading" class="doc-loading-state">
                <div class="doc-loading-card">
                  <div class="doc-loader">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p>Loading document...</p>
                </div>
              </div>

              <div v-else key="preview" class="doc-preview-content">
                <iframe
                  v-if="isPdfPreview"
                  :src="previewFileUrl"
                  class="doc-preview-frame"
                  title="Document preview"
                ></iframe>

                <iframe
                  v-else-if="isWordPreview || isExcelPreview"
                  :src="officeViewerUrl"
                  class="doc-preview-frame"
                  title="Office document preview"
                ></iframe>

                <div v-else-if="isImagePreview" class="doc-image-preview-wrap">
                  <img :src="previewFileUrl" :alt="currentPreviewFileName" class="doc-image-preview" />
                </div>

                <div v-else class="doc-generic-preview">
                  <div class="doc-generic-card">
                    <div class="doc-generic-badge">{{ getFileBadge(currentPreviewFileName) }}</div>
                    <h3>{{ currentPreviewFileName }}</h3>
                    <p>Preview is not available for this file type yet.</p>
                    <p class="doc-supported-text">{{ supportedPreviewText }}</p>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </template>
      </div>
    </aside>
  </transition>

  <transition name="fullscreen-doc-fade">
    <div v-if="isOpen && isFullscreen" class="fullscreen-doc-viewer">
      <div class="fullscreen-doc-topbar">
        <div class="doc-file-pill fullscreen-pill">
          <img :src="docLogo" alt="Document" class="doc-file-pill-icon" />
          <span class="doc-file-pill-name">{{ currentPreviewFileName }}</span>
        </div>

        <div class="fullscreen-actions">
          <button class="doc-topbar-btn" title="Exit Fullscreen" @click="closeFullscreen">
            ⤡
          </button>
          <button class="doc-topbar-btn doc-close-btn" title="Close" @click="closeFromFullscreen">
            ✕
          </button>
        </div>
      </div>

      <div class="fullscreen-doc-body">
        <iframe
          v-if="isPdfPreview"
          :src="previewFileUrl"
          class="doc-preview-frame"
          title="Document preview"
        ></iframe>

        <iframe
          v-else-if="isWordPreview || isExcelPreview"
          :src="officeViewerUrl"
          class="doc-preview-frame"
          title="Office document preview"
        ></iframe>

        <div v-else-if="isImagePreview" class="doc-image-preview-wrap fullscreen-image-wrap">
          <img :src="previewFileUrl" :alt="currentPreviewFileName" class="doc-image-preview" />
        </div>

        <div v-else class="doc-generic-preview fullscreen-generic">
          <div class="doc-generic-card">
            <div class="doc-generic-badge">{{ getFileBadge(currentPreviewFileName) }}</div>
            <h3>{{ currentPreviewFileName }}</h3>
            <p>Preview is not available for this file type yet.</p>
            <p class="doc-supported-text">{{ supportedPreviewText }}</p>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  isOpen: boolean
  currentChat: any
  previewFile: File | null
  previewFileUrl: string
  currentPreviewFileName: string
  docSearchQuery: string
  isDocLoading: boolean
  isPdfPreview: boolean
  isWordPreview: boolean
  isExcelPreview: boolean
  isImagePreview: boolean
  officeViewerUrl: string
  supportedPreviewText: string
  docLogo: string
  getFileBadge: (fileName: string) => string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update-search', value: string): void
}>()

const isFullscreen = ref(false)

function onSearchInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update-search', target.value)
}

function openFullscreen() {
  isFullscreen.value = true
}

function closeFullscreen() {
  isFullscreen.value = false
}

function closeFromFullscreen() {
  isFullscreen.value = false
  emit('close')
}
</script>

<style scoped>
.doc-viewer-panel {
  width: 48%;
  min-width: 420px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at top center, rgba(0, 102, 255, 0.08), transparent 30%),
    linear-gradient(180deg, rgba(8, 12, 22, 0.98), rgba(5, 8, 16, 0.99));
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: -20px 0 40px rgba(0, 0, 0, 0.24);
  overflow: hidden;
}

.doc-topbar,
.fullscreen-doc-topbar {
  height: 72px;
  min-height: 72px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(8, 12, 22, 0.9);
}

.fullscreen-doc-topbar {
  justify-content: space-between;
}

.fullscreen-actions {
  display: flex;
  gap: 12px;
}

.doc-file-pill {
  min-width: 190px;
  max-width: 260px;
  height: 40px;
  border-radius: 12px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(14, 20, 35, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.07);
  overflow: hidden;
}

.fullscreen-pill {
  max-width: 420px;
}

.doc-file-pill-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.doc-file-pill-name {
  color: #dfe6f5;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-search-box {
  flex: 1;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  background: rgba(14, 20, 35, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.doc-search-icon {
  color: #77809a;
  font-size: 14px;
}

.doc-search-box input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #d8def0;
  font-size: 14px;
}

.doc-search-box input::placeholder {
  color: #6d7488;
}

.doc-topbar-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(14, 20, 35, 0.95);
  color: #dce7ff;
  font-size: 18px;
  cursor: pointer;
  transition: 0.22s ease;
}

.doc-topbar-btn:hover {
  background: rgba(19, 33, 58, 0.88);
  box-shadow: 0 0 16px rgba(37, 99, 235, 0.16);
}

.doc-close-btn {
  color: #ffb3b3;
}

.doc-close-btn:hover {
  background: rgba(255, 90, 90, 0.08);
  border-color: rgba(255, 90, 90, 0.22);
  box-shadow: 0 0 16px rgba(255, 90, 90, 0.14);
}

.doc-viewer-body,
.fullscreen-doc-body {
  flex: 1;
  padding: 18px;
  overflow: hidden;
}

.fullscreen-doc-body {
  padding: 0;
  background: #0b1020;
}

.doc-empty-state {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}

.doc-empty-card {
  width: min(420px, 100%);
  min-height: 260px;
  padding: 28px 24px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(13, 19, 34, 0.98), rgba(8, 12, 22, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.doc-empty-icon-wrap {
  width: 76px;
  height: 76px;
  border-radius: 24px;
  background: rgba(19, 135, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.doc-empty-icon {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.doc-empty-card h3 {
  margin: 0 0 10px;
  font-size: 24px;
  color: #ffffff;
}

.doc-empty-card p {
  margin: 0;
  color: #8f9ab1;
  font-size: 14px;
  line-height: 1.7;
  max-width: 320px;
}

.doc-preview-shell {
  width: 100%;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
}

.doc-preview-content {
  width: 100%;
  height: 100%;
}

.doc-preview-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: #ffffff;
}

.doc-image-preview-wrap {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px;
  background: #111827;
}

.fullscreen-image-wrap {
  padding: 32px;
}

.doc-image-preview {
  max-width: 100%;
  height: auto;
  border-radius: 18px;
}

.doc-generic-preview,
.fullscreen-generic {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  padding: 24px;
}

.doc-generic-card {
  width: min(420px, 100%);
  padding: 28px 24px;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(13, 19, 34, 0.98), rgba(8, 12, 22, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
}

.doc-generic-badge {
  width: fit-content;
  min-width: 50px;
  height: 28px;
  padding: 0 12px;
  margin: 0 auto 16px;
  border-radius: 999px;
  background: rgba(255, 119, 119, 0.16);
  color: #ff8b8b;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.doc-generic-card h3 {
  margin: 0 0 10px;
  font-size: 20px;
  color: #ffffff;
}

.doc-generic-card p {
  margin: 0;
  color: #8f9ab1;
  font-size: 14px;
  line-height: 1.7;
}

.doc-supported-text {
  margin-top: 10px !important;
  color: #6faeff !important;
  font-size: 12px !important;
}

.doc-loading-state {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}

.doc-loading-card {
  width: min(280px, 100%);
  min-height: 180px;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(13, 19, 34, 0.98), rgba(8, 12, 22, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.doc-loading-card p {
  margin: 0;
  color: #a8b7d4;
  font-size: 14px;
}

.doc-loader {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.doc-loader span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #60b7ff;
  animation: docLoaderBounce 1.1s infinite ease-in-out;
}

.doc-loader span:nth-child(2) {
  animation-delay: 0.14s;
}

.doc-loader span:nth-child(3) {
  animation-delay: 0.28s;
}

.fullscreen-doc-viewer {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background:
    radial-gradient(circle at top center, rgba(0, 102, 255, 0.08), transparent 30%),
    linear-gradient(180deg, rgba(8, 12, 22, 0.995), rgba(5, 8, 16, 1));
  display: flex;
  flex-direction: column;
}

.doc-panel-slide-enter-active,
.doc-panel-slide-leave-active,
.doc-loading-fade-enter-active,
.doc-loading-fade-leave-active,
.fullscreen-doc-fade-enter-active,
.fullscreen-doc-fade-leave-active {
  transition: all 0.22s ease;
}

.doc-panel-slide-enter-from,
.doc-panel-slide-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

.doc-loading-fade-enter-from,
.doc-loading-fade-leave-to,
.fullscreen-doc-fade-enter-from,
.fullscreen-doc-fade-leave-to {
  opacity: 0;
}

@keyframes docLoaderBounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.45; }
  40% { transform: translateY(-6px); opacity: 1; }
}

@media (max-width: 1100px) {
  .doc-viewer-panel {
    width: 44%;
    min-width: 360px;
  }
}

@media (max-width: 900px) {
  .doc-viewer-panel {
    position: absolute;
    right: 0;
    top: 0;
    width: 100%;
    min-width: 0;
    z-index: 15;
  }

  .doc-search-box {
    display: none;
  }

  .doc-file-pill {
    flex: 1;
    min-width: 0;
    max-width: none;
  }
}
</style>