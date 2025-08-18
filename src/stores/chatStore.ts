import {create} from "zustand";

type ChatMessage = {
    sender: 'user' | 'agent';
    text: string;
    node_id?: string;
    timestamp: number;
    sequence?: number; // Backend sequence_id for reliable ordering
    microtime?: number; // Backend precise timestamp
};

type MessageChunk = {
    text: string;
    sequence: number;
    microtime?: number;
    node_id?: string;
};

type ChatStore = {
    messagesByRun: Record<string, ChatMessage[]>;
    sequenceCounters: Record<string, number>; // runId -> next sequence number for user messages
    chunkBuffers: Record<string, Record<string, MessageChunk[]>>; // runId -> nodeId -> chunks
    runCompletionListeners: Record<string, (() => void)[]>; // runId -> callback functions
    pendingUserMessage: string | null; // User message waiting for run to start
    addUserMessage: (text: string, runId: string) => void;
    addAgentMessage: (text: string, runId: string, nodeId?: string, sequence?: number, microtime?: number) => void;
    clearChatStore: (runId?: string) => void;
    activeRunId: string | null;
    setActiveRunId: (runId: string | null) => void;
    setPendingUserMessage: (message: string | null) => void;
    sortMessages: (runId: string) => void;
    flushChunks: (runId: string, nodeId: string) => void;
    onRunCompleted: (runId: string, callback: () => void) => () => void; // Returns unsubscribe function
    fireRunCompleted: (runId: string) => void;
};

const useChatStore = create<ChatStore>((set, get) => ({
    messagesByRun: {},
    sequenceCounters: {},
    chunkBuffers: {},
    runCompletionListeners: {},
    pendingUserMessage: null,

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
            if (!sequence) {
                // No sequence - add directly (fallback for non-sequenced messages)
                const messages = [...(state.messagesByRun[runId] || [])];
                const lastMessage = messages[messages.length - 1];
                
                if (lastMessage && lastMessage.sender === 'agent' && lastMessage.node_id === nodeId) {
                    lastMessage.text += text;
                    lastMessage.timestamp = Date.now();
                } else {
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
            }
            
            // Buffer chunks with sequence for proper ordering
            const newChunkBuffers = { ...state.chunkBuffers };
            if (!newChunkBuffers[runId]) newChunkBuffers[runId] = {};
            if (!newChunkBuffers[runId][nodeId || 'default']) newChunkBuffers[runId][nodeId || 'default'] = [];
            
            // Add chunk to buffer
            newChunkBuffers[runId][nodeId || 'default'].push({
                text,
                sequence,
                microtime,
                node_id: nodeId
            });
            
            // Sort chunks by sequence and rebuild message
            const nodeChunks = newChunkBuffers[runId][nodeId || 'default'].sort((a, b) => a.sequence - b.sequence);
            const fullText = nodeChunks.map(chunk => chunk.text).join('');
            
            // Update the actual message with properly ordered text
            const messages = [...(state.messagesByRun[runId] || [])];
            const lastMessage = messages[messages.length - 1];
            
            if (lastMessage && lastMessage.sender === 'agent' && lastMessage.node_id === nodeId) {
                // Update existing message with ordered chunks
                lastMessage.text = fullText;
                lastMessage.timestamp = Date.now();
                if (!lastMessage.sequence) lastMessage.sequence = nodeChunks[0]?.sequence;
                if (!lastMessage.microtime) lastMessage.microtime = nodeChunks[0]?.microtime;
            } else {
                // Create new message with ordered chunks
                messages.push({
                    sender: 'agent',
                    text: fullText,
                    node_id: nodeId,
                    timestamp: Date.now(),
                    sequence: nodeChunks[0]?.sequence,
                    microtime: nodeChunks[0]?.microtime
                });
            }
            
            return {
                messagesByRun: {
                    ...state.messagesByRun,
                    [runId]: messages,
                },
                chunkBuffers: newChunkBuffers,
            };
        }),


    clearChatStore: (runId) =>
        set((state) => {
            if (runId) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const {[runId]: _, ...restMessages} = state.messagesByRun;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const {[runId]: __, ...restSequences} = state.sequenceCounters;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const {[runId]: ___, ...restChunks} = state.chunkBuffers;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const {[runId]: _listeners, ...restListeners} = state.runCompletionListeners;
                return {
                    messagesByRun: restMessages, 
                    sequenceCounters: restSequences,
                    chunkBuffers: restChunks,
                    runCompletionListeners: restListeners
                };
            }
            return {
                messagesByRun: {}, 
                sequenceCounters: {},
                chunkBuffers: {},
                runCompletionListeners: {},
                pendingUserMessage: null
            };
        }),

    activeRunId: null,
    setActiveRunId: (runId) =>
        set((state) => {
            const newState: Partial<ChatStore> = {
                activeRunId: runId,
            };
            
            // If we have a pending user message and a new run is starting, add it
            if (runId && state.pendingUserMessage) {
                console.log(`Adding pending user message to new run: ${runId}`);
                const sequence = (state.sequenceCounters[runId] || 0) + 1;
                const messages = [
                    ...(state.messagesByRun[runId] || []),
                    {sender: 'user', text: state.pendingUserMessage, timestamp: Date.now(), sequence} as const,
                ];
                
                newState.messagesByRun = {
                    ...state.messagesByRun,
                    [runId]: messages,
                };
                newState.sequenceCounters = {
                    ...state.sequenceCounters,
                    [runId]: sequence,
                };
                newState.pendingUserMessage = null;
            }
            
            return newState;
        }),
        
    setPendingUserMessage: (message) =>
        set(() => ({
            pendingUserMessage: message,
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
        
    flushChunks: (runId, nodeId) =>
        set((state) => {
            const chunks = state.chunkBuffers[runId]?.[nodeId];
            if (!chunks || chunks.length === 0) return state;
            
            // Clear the chunks for this node since we're flushing
            const newChunkBuffers = { ...state.chunkBuffers };
            if (newChunkBuffers[runId]) {
                delete newChunkBuffers[runId][nodeId];
                if (Object.keys(newChunkBuffers[runId]).length === 0) {
                    delete newChunkBuffers[runId];
                }
            }
            
            return {
                ...state,
                chunkBuffers: newChunkBuffers
            };
        }),
        
    onRunCompleted: (runId, callback) => {
        set((state) => {
            const listeners = [...(state.runCompletionListeners[runId] || []), callback];
            return {
                runCompletionListeners: {
                    ...state.runCompletionListeners,
                    [runId]: listeners,
                },
            };
        });
        
        // Return unsubscribe function
        return () => {
            set((state) => {
                const listeners = (state.runCompletionListeners[runId] || []).filter(cb => cb !== callback);
                const newListeners = { ...state.runCompletionListeners };
                if (listeners.length === 0) {
                    delete newListeners[runId];
                } else {
                    newListeners[runId] = listeners;
                }
                return {
                    runCompletionListeners: newListeners,
                };
            });
        };
    },
    
    fireRunCompleted: (runId) => {
        const state = get();
        const listeners = state.runCompletionListeners[runId] || [];
        
        // Fire all callbacks
        listeners.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Error in run completion callback:', error);
            }
        });
        
        // Clear the completed run's messages and listeners
        setTimeout(() => {
            set((state) => {
                const newListeners = { ...state.runCompletionListeners };
                delete newListeners[runId];
                
                // Also clear the run's messages
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { [runId]: _, ...restMessages } = state.messagesByRun;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { [runId]: __, ...restSequences } = state.sequenceCounters;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { [runId]: ___, ...restChunks } = state.chunkBuffers;
                
                return {
                    runCompletionListeners: newListeners,
                    messagesByRun: restMessages,
                    sequenceCounters: restSequences,
                    chunkBuffers: restChunks,
                };
            });
        }, 100); // Short delay to allow UI to process
    },
}));

export default useChatStore;