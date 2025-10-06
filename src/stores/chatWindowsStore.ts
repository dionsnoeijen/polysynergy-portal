import { create, StateCreator } from 'zustand';
import {
    fetchChatWindowsAPI,
    storeChatWindowAPI,
    updateChatWindowAPI,
    deleteChatWindowAPI,
} from '@/api/chatWindowsApi';
import useEditorStore from "@/stores/editorStore";
import { ChatWindow } from '@/types/types';

type ChatWindowsStore = {
    reset: () => void;
    isFetching: boolean;
    hasInitialFetched: boolean;
    chatWindows: ChatWindow[];
    getChatWindow: (chatWindowId: string) => ChatWindow | undefined;
    fetchChatWindows: () => Promise<void>;
    storeChatWindow: (chatWindow: ChatWindow) => Promise<ChatWindow | undefined>;
    updateChatWindow: (chatWindow: ChatWindow) => Promise<ChatWindow | undefined>;
    deleteChatWindow: (projectId: string, chatWindowId: string) => Promise<void>;
};

const useChatWindowsStore = create<ChatWindowsStore>((
    set: Parameters<StateCreator<ChatWindowsStore>>[0]
) => ({
    reset: () => {
        set({
            chatWindows: [],
            hasInitialFetched: false,
        });
    },

    isFetching: false,
    hasInitialFetched: false,

    chatWindows: [],

    getChatWindow: (chatWindowId): ChatWindow | undefined => {
        return useChatWindowsStore.getState().chatWindows.find((window) => window.id === chatWindowId);
    },

    fetchChatWindows: async () => {
        const { activeProjectId } = useEditorStore.getState();
        if (!activeProjectId) return;

        set({ isFetching: true });
        try {
            const data: ChatWindow[] = await fetchChatWindowsAPI(activeProjectId);
            set({ chatWindows: data, hasInitialFetched: true });
        } catch (error) {
            console.error('Failed to fetch chat windows:', error);
        } finally {
            set({ isFetching: false });
        }
    },

    storeChatWindow: async (chatWindow: ChatWindow): Promise<ChatWindow | undefined> => {
        const { activeProjectId } = useEditorStore.getState();
        try {
            const response = await storeChatWindowAPI(activeProjectId, chatWindow);
            chatWindow.id = response.id;
            set((state) => ({ chatWindows: [...state.chatWindows, chatWindow] }));
            return chatWindow;
        } catch (error) {
            console.error('Failed to store chat window:', error);
        }
    },

    updateChatWindow: async (chatWindow: ChatWindow): Promise<ChatWindow | undefined> => {
        const { activeProjectId } = useEditorStore.getState();
        try {
            const response = await updateChatWindowAPI(activeProjectId, chatWindow.id as string, chatWindow);
            set((state) => ({
                chatWindows: state.chatWindows.map((w) => (w.id === chatWindow.id ? chatWindow : w)),
            }));
            return response;
        } catch (error) {
            console.error('Failed to update chat window:', error);
        }
    },

    deleteChatWindow: async (projectId: string, chatWindowId: string) => {
        try {
            await deleteChatWindowAPI(projectId, chatWindowId);
            set((state) => ({
                chatWindows: state.chatWindows.filter((w) => w.id !== chatWindowId),
            }));
        } catch (error) {
            console.error('Failed to delete chat window:', error);
        }
    }
}));

export default useChatWindowsStore;
