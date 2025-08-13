import {create} from "zustand";

type ChatMessage = {
    sender: 'user' | 'agent';
    text: string;
    node_id?: string;
    order?: number;
    timestamp?: number;
};

type ChatStore = {
    messagesByRun: Record<string, ChatMessage[]>;
    pendingMessages: Record<string, Record<number, {content: string, nodeId?: string}>>; // runId -> order -> message
    addUserMessage: (text: string, runId: string) => void;
    startAgentMessage: (runId: string, nodeId?: string, order?: number) => void;
    appendToAgentMessage: (text: string, runId: string, nodeId?: string, order?: number) => void;
    clearChatStore: (runId?: string) => void;
    activeRunId: string | null;
    setActiveRunId: (runId: string | null) => void;
    processPendingMessages: (runId: string) => void;
};

const useChatStore = create<ChatStore>((set, get) => ({
    messagesByRun: {},
    pendingMessages: {},

    addUserMessage: (text, runId) =>
        set((state) => {
            const messages = [
                ...(state.messagesByRun[runId] || []),
                {sender: 'user', text, timestamp: Date.now()} as const,
            ];
            return {
                messagesByRun: {
                    ...state.messagesByRun,
                    [runId]: messages,
                },
            };
        }),

    startAgentMessage: (runId, nodeId?, order?) =>
        set((state) => {
            const messages = [
                ...(state.messagesByRun[runId] || []),
                {sender: 'agent', text: '', node_id: nodeId, order, timestamp: Date.now()} as const,
            ];
            return {
                messagesByRun: {
                    ...state.messagesByRun,
                    [runId]: messages,
                },
            };
        }),

    appendToAgentMessage: (text, runId, nodeId?, order?) => {
        if (order !== undefined) {
            // Handle ordered messages
            set((state) => {
                const pending = state.pendingMessages[runId] || {};
                
                // Store or append to pending message
                if (pending[order]) {
                    pending[order].content += text;
                } else {
                    pending[order] = {content: text, nodeId};
                }
                
                return {
                    ...state,
                    pendingMessages: {
                        ...state.pendingMessages,
                        [runId]: pending,
                    },
                };
            });
            
            // Process pending messages to maintain order
            get().processPendingMessages(runId);
        } else {
            // Fallback to old behavior for messages without order
            set((state) => {
                const messages = [...(state.messagesByRun[runId] || [])];
                const last = messages[messages.length - 1];
                if (last && last.sender === 'agent' && last.node_id === nodeId) {
                    last.text += text;
                } else {
                    messages.push({sender: 'agent', text, node_id: nodeId, timestamp: Date.now()});
                }
                return {
                    messagesByRun: {
                        ...state.messagesByRun,
                        [runId]: messages,
                    },
                };
            });
        }
    },

    clearChatStore: (runId) =>
        set((state) => {
            if (runId) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const {[runId]: _, ...restMessages} = state.messagesByRun;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const {[runId]: __, ...restPending} = state.pendingMessages;
                return {messagesByRun: restMessages, pendingMessages: restPending};
            }
            return {messagesByRun: {}, pendingMessages: {}};
        }),

    activeRunId: null,
    setActiveRunId: (runId) =>
        set(() => ({
            activeRunId: runId,
        })),
        
    processPendingMessages: (runId) => {
        const state = get();
        const pending = state.pendingMessages[runId];
        if (!pending) return;
        
        const messages = [...(state.messagesByRun[runId] || [])];
        const orders = Object.keys(pending).map(Number).sort((a, b) => a - b);
        
        // Find the next expected order (last message order + 1)
        const lastMessage = messages.filter(m => m.sender === 'agent' && m.order !== undefined).pop();
        let expectedOrder = lastMessage?.order ? lastMessage.order + 1 : 0;
        
        // Process consecutive pending messages
        let processed = false;
        for (const order of orders) {
            if (order === expectedOrder) {
                const pendingMsg = pending[order];
                messages.push({
                    sender: 'agent',
                    text: pendingMsg.content,
                    node_id: pendingMsg.nodeId,
                    order,
                    timestamp: Date.now()
                });
                
                // Remove from pending
                delete pending[order];
                expectedOrder++;
                processed = true;
            } else {
                break; // Stop if we hit a gap in ordering
            }
        }
        
        if (processed) {
            set({
                messagesByRun: {
                    ...state.messagesByRun,
                    [runId]: messages,
                },
                pendingMessages: {
                    ...state.pendingMessages,
                    [runId]: pending,
                },
            });
        }
    },
}));

export default useChatStore;