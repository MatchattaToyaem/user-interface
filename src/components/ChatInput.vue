<template>
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
            @click="$emit('remove-file', file)"
            aria-label="Remove file"
          >
            ×
          </button>
        </div>
      </div>

      <div class="chat-input-bar">
        <input
          ref="docInputRef"
          type="file"
          class="hidden-file-input"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
          @change="handleInternalFileChange"
        />

        <input
          ref="imageInputRef"
          type="file"
          class="hidden-file-input"
          accept=".png,.jpg,.jpeg,.webp"
          @change="handleInternalFileChange"
        />

        <div class="attach-wrap">
          <button
            class="attach-btn"
            @mouseenter="showHoverHint = true"
            @mouseleave="showHoverHint = false"
            @click.stop="toggleAttachMenu"
          >
            <img :src="attachLogo" alt="Attach file" class="attach-btn-icon" />
          </button>

          <transition name="attach-hint-fade">
            <div v-if="showHoverHint && !showAttachMenu" class="attach-hover-hint">
              Add files and more
            </div>
          </transition>

          <transition name="attach-menu-fade">
            <div v-if="showAttachMenu" class="attach-menu">
              <button class="attach-menu-item" @click="openDocumentPicker">
                <img :src="attachLogo" class="attach-menu-icon" alt="Add document" />
                <span>Add document</span>
              </button>

              <button class="attach-menu-item" @click="openImagePicker">
                <img :src="attachLogo" class="attach-menu-icon" alt="Add image" />
                <span>Add image</span>
              </button>

              <button class="attach-menu-item disabled" disabled>
                <img :src="attachLogo" class="attach-menu-icon" alt="Upload from drive" />
                <span>Upload from Drive</span>
                <small>Coming soon</small>
              </button>
            </div>
          </transition>
        </div>

        <input
          :value="inputValue"
          type="text"
          :placeholder="
            attachedFiles.length
              ? 'Ask about this document...'
              : 'Ask a question or describe an issue...'
          "
          @input="onInput"
          @keyup.enter="$emit('send-message')"
        />

        <button class="send-btn" @click="$emit('send-message')">➤</button>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps<{
  inputValue: string
  attachedFiles: File[]
  attachLogo: string
  getFileBadge: (fileName: string) => string
}>()

const emit = defineEmits<{
  (e: 'update-input', value: string): void
  (e: 'add-files', event: Event): void
  (e: 'remove-file', file: File): void
  (e: 'send-message'): void
}>()

const docInputRef = ref<HTMLInputElement | null>(null)
const imageInputRef = ref<HTMLInputElement | null>(null)
const showAttachMenu = ref(false)
const showHoverHint = ref(false)

function openDocumentPicker() {
  showAttachMenu.value = false
  docInputRef.value?.click()
}

function openImagePicker() {
  showAttachMenu.value = false
  imageInputRef.value?.click()
}

function toggleAttachMenu() {
  showAttachMenu.value = !showAttachMenu.value
  showHoverHint.value = false
}

function handleInternalFileChange(event: Event) {
  emit('add-files', event)

  const input = event.target as HTMLInputElement
  if (input) input.value = ''
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update-input', target.value)
}

function closeMenus(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (!target) return
  if (!target.closest('.attach-wrap')) {
    showAttachMenu.value = false
    showHoverHint.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', closeMenus)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', closeMenus)
})
</script>

<style scoped>
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

.attach-wrap {
  position: relative;
  display: flex;
  align-items: center;
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

.attach-hover-hint {
  position: absolute;
  left: 54px;
  bottom: 0;
  height: 38px;
  padding: 0 14px;
  border-radius: 12px;
  background: #000000;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  z-index: 60;
}

.attach-menu {
  position: absolute;
  left: 0;
  bottom: 54px;
  width: 230px;
  padding: 10px;
  border-radius: 18px;
  background: rgba(24, 28, 40, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.42),
    0 0 24px rgba(17, 132, 255, 0.08);
  backdrop-filter: blur(16px);
  z-index: 80;
}

.attach-menu-item {
  width: 100%;
  min-height: 48px;
  border: none;
  background: transparent;
  color: #e7ebf5;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.attach-menu-item:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-1px);
}

.attach-menu-item.disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.attach-menu-item.disabled:hover {
  background: transparent;
  transform: none;
}

.attach-menu-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.attach-menu-item small {
  margin-left: auto;
  color: #8ea4cc;
  font-size: 11px;
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

.attach-hint-fade-enter-active,
.attach-hint-fade-leave-active,
.attach-menu-fade-enter-active,
.attach-menu-fade-leave-active {
  transition: all 0.2s ease;
}

.attach-hint-fade-enter-from,
.attach-hint-fade-leave-to,
.attach-menu-fade-enter-from,
.attach-menu-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 900px) {
  .chat-input-shell {
    width: calc(100% - 24px);
  }

  .attach-hover-hint {
    display: none;
  }
}
</style>