import { create } from 'zustand';

export interface ChatMessage {
    id: string;
    sender: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
    pause_data?: {
        run_id: string;
        node_id: string;
        prompt?: string;
    };
}

interface EmbeddedChatState {
    // Connection state
    isConnected: boolean;
    isConnecting: boolean;
    connectionError: string | null;

    // Chat state
    messages: ChatMessage[];
    isWaitingForResponse: boolean;
    currentStreamingMessage: string;

    // Config from server
    chatWindowId: string | null;
    chatWindowName: string | null;
    sessionsEnabled: boolean;
    sidebarVisible: boolean;
    versionId: string | null;

    // Actions
    setConnected: (connected: boolean) => void;
    setConnecting: (connecting: boolean) => void;
    setConnectionError: (error: string | null) => void;
    setConfig: (config: {
        chatWindowId: string;
        chatWindowName: string;
        sessionsEnabled: boolean;
        sidebarVisible: boolean;
    }) => void;
    setVersionId: (versionId: string) => void;
    addMessage: (message: ChatMessage) => void;
    updateStreamingMessage: (content: string) => void;
    finalizeStreamingMessage: () => void;
    setWaitingForResponse: (waiting: boolean) => void;
    clearMessages: () => void;
    removePauseMessage: (messageId: string) => void;
}

export const useEmbeddedChatStore = create<EmbeddedChatState>((set, get) => ({
    // Initial state
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    messages: [],
    isWaitingForResponse: false,
    currentStreamingMessage: '',
    chatWindowId: null,
    chatWindowName: null,
    sessionsEnabled: true,
    sidebarVisible: true,
    versionId: null,

    // Actions
    setConnected: (connected) => set({ isConnected: connected, isConnecting: false }),
    setConnecting: (connecting) => set({ isConnecting: connecting }),
    setConnectionError: (error) => set({ connectionError: error, isConnecting: false }),

    setConfig: (config) => set({
        chatWindowId: config.chatWindowId,
        chatWindowName: config.chatWindowName,
        sessionsEnabled: config.sessionsEnabled,
        sidebarVisible: config.sidebarVisible,
    }),

    setVersionId: (versionId) => set({ versionId }),

    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message],
        currentStreamingMessage: '',
    })),

    updateStreamingMessage: (content) => set({ currentStreamingMessage: content }),

    finalizeStreamingMessage: () => {
        const state = get();
        if (state.currentStreamingMessage) {
            set({
                messages: [...state.messages, {
                    id: `msg-${Date.now()}`,
                    sender: 'assistant',
                    content: state.currentStreamingMessage,
                    timestamp: new Date(),
                }],
                currentStreamingMessage: '',
                isWaitingForResponse: false,
            });
        }
    },

    setWaitingForResponse: (waiting) => set({ isWaitingForResponse: waiting }),

    clearMessages: () => set({ messages: [], currentStreamingMessage: '' }),

    removePauseMessage: (messageId) => set((state) => ({
        messages: state.messages.filter(m => m.id !== messageId),
    })),
}));
