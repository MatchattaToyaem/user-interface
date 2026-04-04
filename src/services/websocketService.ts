import {ref, onUnmounted} from 'vue';
import type {MessageRequest} from '@/models/messageRequest';
import type {MessageResponse} from '@/models/messageResponse';
import {Client, IMessage} from '@stomp/stompjs';

export function useChatService(){
    const messages = ref<{ id: number; text: string; sender: string }[]>([]);
    const isConnected = ref(false);
    const isLoading = ref(false);

    const stompClient = new Client({
        brokerURL: 'ws://localhost:8082/ws',
        onConnect: () => {
            console.log('WebSocket connected');
            isConnected.value = true;
            stompClient.subscribe('/topic/message', (msg: IMessage) => {
                const body: MessageResponse = JSON.parse(msg.body);
                messages.value.push({
                    id: Date.now(),
                    text: body.message,
                    sender: body.sender,
                });
                isLoading.value = false;
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

    const connect = () => stompClient.activate();

    const disconnect = () => {
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