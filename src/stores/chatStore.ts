import {create} from "zustand";

type ChatMessage = {
    sender: 'user' | 'agent';
    text: string;
    node_id?: string;
};

type ChatStore = {
    messagesByRun: Record<string, ChatMessage[]>;
    addUserMessage: (text: string, runId: string) => void;
    startAgentMessage: (runId: string, nodeId?: string) => void;
    appendToAgentMessage: (text: string, runId: string, nodeId?: string) => void;
    clearChatStore: (runId?: string) => void;
    activeRunId: string | null;
    setActiveRunId: (runId: string | null) => void;
};

const useChatStore = create<ChatStore>((set) => ({
    messagesByRun: {},

    addUserMessage: (text, runId) =>
        set((state) => {
            const messages = [...(state.messagesByRun[runId] || []), {sender: 'user', text}];
            return {
                messagesByRun: {
                    ...state.messagesByRun,
                    [runId]: messages,
                },
            };
        }),

    startAgentMessage: (runId, nodeId?) =>
        set((state) => {
            const messages = [...(state.messagesByRun[runId] || []), {sender: 'agent', text: '', node_id: nodeId}];
            return {
                messagesByRun: {
                    ...state.messagesByRun,
                    [runId]: messages,
                },
            };
        }),

    appendToAgentMessage: (text, runId, nodeId?) =>
        set((state) => {
            const messages = [...(state.messagesByRun[runId] || [])];
            const last = messages[messages.length - 1];
            if (last && last.sender === 'agent' && last.node_id === nodeId) {
                last.text += text;
            } else {
                messages.push({sender: 'agent', text, node_id: nodeId});
            }
            return {
                messagesByRun: {
                    ...state.messagesByRun,
                    [runId]: messages,
                },
            };
        }),

    clearChatStore: (runId) =>
        set((state) => {
            if (runId) {
                const {[runId]: _, ...rest} = state.messagesByRun;
                return {messagesByRun: rest};
            }
            return {messagesByRun: {}};
        }),

    activeRunId: null,
    setActiveRunId: (runId) =>
        set(() => ({
            activeRunId: runId,
        })),
}));

export default useChatStore;