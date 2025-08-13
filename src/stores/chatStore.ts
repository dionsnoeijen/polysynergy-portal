import {create} from "zustand";

type ChatMessage = {
    sender: 'user' | 'agent';
    text: string;
    node_id?: string;
    timestamp: number;
    sequence?: number; // Simple incremental sequence per run
};

type ChatStore = {
    messagesByRun: Record<string, ChatMessage[]>;
    sequenceCounters: Record<string, number>; // runId -> next sequence number
    addUserMessage: (text: string, runId: string) => void;
    addAgentMessage: (text: string, runId: string, nodeId?: string) => void;
    clearChatStore: (runId?: string) => void;
    activeRunId: string | null;
    setActiveRunId: (runId: string | null) => void;
    sortMessages: (runId: string) => void;
};

const useChatStore = create<ChatStore>((set, get) => ({
    messagesByRun: {},
    sequenceCounters: {},

    addUserMessage: (text, runId) =>
        set((state) => {
            const sequence = (state.sequenceCounters[runId] || 0) + 1;
            const messages = [
                ...(state.messagesByRun[runId] || []),
                {sender: 'user', text, timestamp: Date.now(), sequence} as const,
            ];
            return {
                messagesByRun: {
                    ...state.messagesByRun,
                    [runId]: messages,
                },
                sequenceCounters: {
                    ...state.sequenceCounters,
                    [runId]: sequence,
                },
            };
        }),

    addAgentMessage: (text, runId, nodeId?) =>
        set((state) => {
            const sequence = (state.sequenceCounters[runId] || 0) + 1;
            const messages = [...(state.messagesByRun[runId] || [])];
            
            // Find existing agent message from same node or create new one
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.sender === 'agent' && lastMessage.node_id === nodeId && !lastMessage.text.trim()) {
                // Append to existing empty message
                lastMessage.text = text;
                lastMessage.timestamp = Date.now();
            } else {
                // Create new message
                messages.push({sender: 'agent', text, node_id: nodeId, timestamp: Date.now(), sequence});
            }
            
            return {
                messagesByRun: {
                    ...state.messagesByRun,
                    [runId]: messages,
                },
                sequenceCounters: {
                    ...state.sequenceCounters,
                    [runId]: sequence,
                },
            };
        }),


    clearChatStore: (runId) =>
        set((state) => {
            if (runId) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const {[runId]: _, ...restMessages} = state.messagesByRun;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const {[runId]: __, ...restSequences} = state.sequenceCounters;
                return {messagesByRun: restMessages, sequenceCounters: restSequences};
            }
            return {messagesByRun: {}, sequenceCounters: {}};
        }),

    activeRunId: null,
    setActiveRunId: (runId) =>
        set(() => ({
            activeRunId: runId,
        })),
        
    sortMessages: (runId) => 
        set((state) => {
            const messages = state.messagesByRun[runId];
            if (!messages) return state;
            
            // Sort by sequence first, then by timestamp as fallback
            const sortedMessages = [...messages].sort((a, b) => {
                if (a.sequence && b.sequence) {
                    return a.sequence - b.sequence;
                }
                return a.timestamp - b.timestamp;
            });
            
            return {
                ...state,
                messagesByRun: {
                    ...state.messagesByRun,
                    [runId]: sortedMessages,
                },
            };
        }),
}));

export default useChatStore;