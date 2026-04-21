import { ref, onUnmounted } from 'vue';
import type { MessageRequest } from '@/models/messageRequest';
import type { MessageResponse } from '@/models/messageResponse';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
import { authService } from '@/services/authService';

/** Reconnect 2 minutes before access-token expiry. */
const REFRESH_BUFFER_MS = 2 * 60 * 1000;

export function useChatService(onMessageReceived?: (msg: MessageResponse) => void) {
    const messages = ref<{ id: number; text: string; sender: string }[]>([]);
    const isConnected = ref(false);
    const isLoading = ref(false);
    let tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null;

    const clearRefreshTimer = () => {
        if (tokenRefreshTimer) {
            clearTimeout(tokenRefreshTimer);
            tokenRefreshTimer = null;
        }
    };

    /**
     * Schedule a proactive reconnect so the server always sees a valid JWT.
     * When the timer fires the client disconnects and immediately re-activates,
     * which triggers beforeConnect → fresh token → new STOMP CONNECT.
     */
    const scheduleTokenRefresh = (expiresOn: Date | null) => {
        clearRefreshTimer();
        if (!expiresOn) return;

        const msUntilRefresh = expiresOn.getTime() - Date.now() - REFRESH_BUFFER_MS;
        if (msUntilRefresh <= 0) return;

        tokenRefreshTimer = setTimeout(async () => {
            console.info('Access token expiring soon — reconnecting with fresh token');
            await stompClient.deactivate();
            stompClient.activate();
        }, msUntilRefresh);
    };

    const stompClient = new Client({
        brokerURL: (import.meta.env.VITE_CHAT_SERVICE_URL || 'http://localhost:8082').replace(/^http/, 'ws') + '/ws',
        beforeConnect: async () => {
            const result = await authService.getValidBackendToken();
            if (result) {
                stompClient.connectHeaders = { Authorization: `Bearer ${result.accessToken}` };
                scheduleTokenRefresh(authService.getBackendTokenExpiry());
            }
        },
        onConnect: () => {
            console.log('WebSocket connected');
            isConnected.value = true;
            stompClient.subscribe('/user/queue/message', (msg: IMessage) => {
                const body: MessageResponse = JSON.parse(msg.body);
                messages.value.push({
                    id: Date.now(),
                    text: body.message,
                    sender: body.sender,
                });
                isLoading.value = false;
                onMessageReceived?.(body);
            });
        },
        onDisconnect: () => {
            isConnected.value = false;
        },
        onStompError: (frame) => {
            console.error('STOMP error:', frame);
        },
        onWebSocketError: (event) => {
            console.error('WebSocket error:', event);
        },
        reconnectDelay: 5000,
        debug: (str) => console.log(str),
    });

    const connect = () => {
        console.info('Connecting to WebSocket...');
        stompClient.activate();
    };

    const disconnect = () => {
        clearRefreshTimer();
        if (stompClient.active) {
            stompClient.deactivate();
        }
    };

    const sendMessage = (message: MessageRequest) => {
        messages.value.push({
            id: Date.now(),
            text: message.message,
            sender: message.sender,
        });
        if (stompClient.active) {
            isLoading.value = true;
            stompClient.publish({
                destination: '/app/chat',
                body: JSON.stringify(message),
            });
        } else {
            console.warn('Cannot send message, WebSocket is not connected');
        }
    };
    onUnmounted(() => disconnect());

    return {
        messages,
        isConnected,
        isLoading,
        connect,
        disconnect,
        sendMessage
    };
}