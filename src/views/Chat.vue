<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { authService } from '@/services/authService';
import { useChatService } from '@/services/websocketService'

interface Chat { id: number; title: string }

const { messages, isConnected, isLoading, connect, disconnect, sendMessage: wsSendMessage } = useChatService()
const userStore = useUserStore();
const newMessage = ref('');
const activeChatId = ref(1);
const senderName = computed(() => userStore.account?.name ?? 'Unknown User');

onMounted(() => connect());
onUnmounted(() => disconnect());

const chats = ref<Chat[]>([
    { id: 1, title: 'General Chat' },
    { id: 2, title: 'Project Discussion' },
]);

const selectChat = (id: number) => { activeChatId.value = id; };

const sidebarOpen = ref(true);
const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value; };

const logout = () => authService.logout();

const addChat = () => {
    const id = Date.now();
    chats.value.push({ id, title: `Chat ${chats.value.length + 1}` });
    activeChatId.value = id;
};

const sendMessage = () => {
    if (!newMessage.value.trim()) return;
    wsSendMessage({
        message: newMessage.value,
        sender: senderName.value,
    });
    newMessage.value = '';
};
</script>

<template>
    <div class="vh-100 d-flex flex-column">
        <!-- Navbar -->
        <nav class="navbar navbar-dark bg-dark px-3 gap-3">
            <button class="btn btn-dark p-1" @click="toggleSidebar" title="Toggle sidebar">
                <i class="bi bi-list fs-4"></i>
            </button>
            <span class="navbar-brand mb-0">O'Connors AI Platform</span>
            <div v-if="userStore.account" class="dropdown ms-auto">
                <button class="btn btn-dark text-white small dropdown-toggle" type="button" data-bs-toggle="dropdown"
                    aria-expanded="false">
                    <i class="bi bi-person-circle me-1"></i>{{ userStore.account?.name ?? '' }}
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li>
                        <button class="dropdown-item text-danger" @click="logout">
                            <i class="bi bi-box-arrow-right me-2"></i>Logout
                        </button>
                    </li>
                </ul>
            </div>
        </nav>

        <!-- Body -->
        <div class="d-flex flex-grow-1 overflow-hidden position-relative">

            <!-- Mobile backdrop -->
            <div v-if="sidebarOpen" class="sidebar-backdrop d-md-none" @click="toggleSidebar"></div>

            <!-- Sidebar -->
            <div class="d-flex flex-column bg-dark text-white sidebar" :class="{ collapsed: !sidebarOpen }">
                <div class="p-3 border-bottom border-secondary">
                    <button class="btn btn-outline-light w-100" @click="addChat">
                        <i class="bi bi-plus-lg me-2"></i>New Chat
                    </button>
                </div>
                <div class="flex-grow-1 overflow-auto">
                    <div v-for="chat in chats" :key="chat.id" class="px-3 py-2 d-flex align-items-center gap-2"
                        :class="activeChatId === chat.id ? 'bg-secondary' : 'chat-item'" @click="selectChat(chat.id)"
                        style="cursor: pointer;">
                        <i class="bi bi-chat-left-text"></i>
                        <span class="text-truncate small">{{ chat.title }}</span>
                    </div>
                </div>
            </div>

            <!-- Chat area -->
            <div class="d-flex flex-column flex-grow-1 bg-light overflow-hidden p-3">
                <div class="d-flex flex-column bg-white shadow-sm h-100 rounded">
                    <div class="flex-grow-1 p-4 overflow-auto">
                        <p v-if="!isConnected" style="color: red;">Connecting...</p>
                        <p v-else style="color: green;">Connected!</p>
                        <div v-if="messages.length === 0" class="text-center text-muted mt-5">
                            No messages yet. Start the conversation!
                        </div>
                        <div v-for="msg in messages" :key="msg.id" class="mb-3">
                            <strong class="text-primary">{{ msg.sender }}:</strong>
                            <p class="mb-0 bg-light p-2 rounded d-inline-block ms-2">{{ msg.text }}</p>
                        </div>
                        <!-- Typing indicator -->
                        <div v-if="isLoading" class="mb-3 d-flex align-items-center gap-2">
                            <strong class="text-secondary">AI:</strong>
                            <span class="ms-2 typing-indicator">
                                <span></span><span></span><span></span>
                            </span>
                        </div>
                    </div>

                    <div class="p-3 border-top">
                        <div class="input-group">
                            <input v-model="newMessage" type="text" class="form-control"
                                placeholder="Type your message..." @keyup.enter="sendMessage" :disabled="isLoading" />
                            <button class="btn btn-primary" @click="sendMessage"
                                :disabled="isLoading || !newMessage.trim()">
                                <span v-if="isLoading" class="spinner-border spinner-border-sm me-1"></span>
                                <i v-else class="bi bi-send me-1"></i>
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped>
@import '@/assets/chat.css';
</style>