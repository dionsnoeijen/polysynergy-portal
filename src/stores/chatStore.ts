import {create} from "zustand";

type ChatMessage = {
    sender: 'user' | 'agent';
    text: string;
    node_id?: string;
    timestamp: number;
    sequence?: number; // Backend sequence_id for reliable ordering
    microtime?: number; // Backend precise timestamp
};

type ChatStore = {
    messagesByRun: Record<string, ChatMessage[]>;
    sequenceCounters: Record<string, number>; // runId -> next sequence number for user messages
    addUserMessage: (text: string, runId: string) => void;
    addAgentMessage: (text: string, runId: string, nodeId?: string, sequence?: number, microtime?: number) => void;
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

    addAgentMessage: (text, runId, nodeId?, sequence?, microtime?) =>
        set((state) => {
            const messages = [...(state.messagesByRun[runId] || [])];
            
            // Find the most recent agent message from the same node to append to
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && 
                lastMessage.sender === 'agent' && 
                lastMessage.node_id === nodeId) {
                
                // Append to existing message (streaming behavior)
                lastMessage.text += text;
                lastMessage.timestamp = Date.now();
                
                // Keep the original sequence number (first chunk determines order)
                if (lastMessage.sequence === undefined && sequence !== undefined) {
                    lastMessage.sequence = sequence;
                }
                if (lastMessage.microtime === undefined && microtime !== undefined) {
                    lastMessage.microtime = microtime;
                }
            } else {
                // Create new message (new response starts)
                messages.push({
                    sender: 'agent', 
                    text, 
                    node_id: nodeId, 
                    timestamp: Date.now(),
                    sequence,
                    microtime
                });
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
            
            // Sort by backend sequence first, then microtime, then timestamp as fallback
            const sortedMessages = [...messages].sort((a, b) => {
                // Both have backend sequence - use that
                if (a.sequence !== undefined && b.sequence !== undefined) {
                    return a.sequence - b.sequence;
                }
                // Both have microtime - use that
                if (a.microtime !== undefined && b.microtime !== undefined) {
                    return a.microtime - b.microtime;
                }
                // Fallback to local timestamp
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