import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

export type MessageState = 'pending' | 'streaming' | 'complete' | 'failed';
export type MessageSource = 'user' | 'agent_stream' | 'agent_api' | 'system';

export interface ChatMessage {
    id: string; // Client-generated for UI, or derived from server data
    conversationId: string;
    source: MessageSource;
    state: MessageState;
    content: string;
    nodeId?: string;
    timestamp: number;
    streamId?: string; // For tracking stream vs API versions
    
    // Server data (when loaded from storage)
    serverTimestamp?: string; // Original server timestamp string
    userId?: string;
    
    metadata?: {
        executionId?: string;
        responseTime?: number;
        isPartial?: boolean;
        sequence?: number;
        microtime?: number;
    };
}

export interface Conversation {
    id: string;
    agentId: string;
    sessionId?: string;
    messageIds: string[];
    createdAt: number;
    updatedAt: number;
}

// Import server message type
interface ServerChatMessage {
    sender: 'user' | 'agent';
    text: string;
    timestamp: string;
    user_id?: string;
}

interface UnifiedChatStore {
    // Core data
    messages: Map<string, ChatMessage>;
    conversations: Map<string, Conversation>;
    
    // Current state
    activeConversationId: string | null;
    activeRunId: string | null;
    pendingStreamIds: Set<string>; // Track incomplete streams
    
    // Actions - Message management
    addMessage: (message: Omit<ChatMessage, 'id'> & { timestamp?: number }) => string;
    updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
    deleteMessage: (id: string) => void;
    
    // Actions - Server message integration
    loadServerMessages: (conversationId: string, serverMessages: ServerChatMessage[]) => void;
    createStableMessageId: (serverMessage: ServerChatMessage) => string;
    
    // Actions - Stream management
    startStream: (conversationId: string, nodeId?: string) => string;
    appendToStream: (streamId: string, content: string, sequence?: number) => void;
    completeStream: (streamId: string, finalContent?: string) => void;
    failStream: (streamId: string, error?: string) => void;
    
    // Actions - Conversation management
    createConversation: (agentId: string, sessionId?: string, customId?: string) => string;
    setActiveConversation: (conversationId: string | null) => void;
    clearConversation: (conversationId: string) => void;
    
    // Actions - Run management
    setActiveRunId: (runId: string | null) => void;
    
    // Getters
    getConversationMessages: (conversationId: string) => ChatMessage[];
    getActiveMessages: () => ChatMessage[];
    getIncompleteStreams: () => ChatMessage[];
    
    // Cleanup
    cleanupOldData: (maxAge?: number) => void;
    clearAll: () => void;
}

const STREAM_TIMEOUT = 30000; // 30 seconds

export const useUnifiedChatStore = create<UnifiedChatStore>((set, get) => ({
    // Initial state
    messages: new Map(),
    conversations: new Map(),
    activeConversationId: null,
    activeRunId: null,
    pendingStreamIds: new Set(),

    // Message management
    addMessage: (messageData) => {
        const id = uuidv4();
        const timestamp = messageData.timestamp ?? Date.now();
        
        const message: ChatMessage = {
            ...messageData,
            id,
            timestamp,
        };

        set((state) => {
            const newMessages = new Map(state.messages);
            newMessages.set(id, message);

            // Add to conversation if specified
            const newConversations = new Map(state.conversations);
            if (messageData.conversationId) {
                const conversation = newConversations.get(messageData.conversationId);
                if (conversation) {
                    conversation.messageIds.push(id);
                    conversation.updatedAt = timestamp;
                    newConversations.set(messageData.conversationId, { ...conversation });
                    
                    console.log('🔥 MESSAGE ADDED AT END - TOTAL:', conversation.messageIds.length, 'SOURCE:', messageData.source, 'CONTENT:', messageData.content?.substring(0, 20));
                    console.log('🔥 CURRENT messageIds ORDER:', conversation.messageIds.slice(-5)); // Show last 5 IDs
                }
            }

            return {
                messages: newMessages,
                conversations: newConversations,
            };
        });

        return id;
    },

    updateMessage: (id, updates) => {
        set((state) => {
            const message = state.messages.get(id);
            if (!message) return state;

            const updatedMessage = { ...message, ...updates };
            const newMessages = new Map(state.messages);
            newMessages.set(id, updatedMessage);

            return { messages: newMessages };
        });
    },

    deleteMessage: (id) => {
        set((state) => {
            const message = state.messages.get(id);
            if (!message) return state;

            const newMessages = new Map(state.messages);
            newMessages.delete(id);

            // Remove from conversation
            const newConversations = new Map(state.conversations);
            const conversation = newConversations.get(message.conversationId);
            if (conversation) {
                conversation.messageIds = conversation.messageIds.filter(msgId => msgId !== id);
                newConversations.set(message.conversationId, { ...conversation });
            }

            return {
                messages: newMessages,
                conversations: newConversations,
            };
        });
    },

    // Server message integration
    createStableMessageId: (serverMessage) => {
        // Create deterministic ID based on server message properties
        // This ensures same message always gets same ID across app reloads
        const key = `${serverMessage.sender}_${serverMessage.timestamp}_${serverMessage.text.substring(0, 50)}`;
        
        // Simple deterministic UUID generation (you might want a proper hash function)
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Convert hash to UUID-like format for consistency
        const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
        return `server-${hashStr}-${serverMessage.timestamp.replace(/[^0-9]/g, '').substring(0, 8)}`;
    },

    loadServerMessages: (conversationId, serverMessages) => {
        set((state) => {
            const newMessages = new Map(state.messages);
            const messageIds: string[] = [];

            // Convert server messages to internal format
            serverMessages.forEach(serverMsg => {
                const id = get().createStableMessageId(serverMsg);
                const timestamp = new Date(serverMsg.timestamp).getTime();
                
                const chatMessage: ChatMessage = {
                    id,
                    conversationId,
                    source: serverMsg.sender === 'user' ? 'user' : 'agent_api',
                    state: 'complete',
                    content: serverMsg.text,
                    timestamp,
                    serverTimestamp: serverMsg.timestamp,
                    userId: serverMsg.user_id,
                };

                newMessages.set(id, chatMessage);
                messageIds.push(id);
            });

            // Update conversation
            const newConversations = new Map(state.conversations);
            const conversation = newConversations.get(conversationId);
            if (conversation) {
                newConversations.set(conversationId, {
                    ...conversation,
                    messageIds,
                    updatedAt: Date.now(),
                });
            }

            return {
                messages: newMessages,
                conversations: newConversations,
            };
        });
    },

    // Stream management
    startStream: (/* conversationId, nodeId */) => {
        const streamId = uuidv4();

        set((state) => ({
            pendingStreamIds: new Set([...state.pendingStreamIds, streamId]),
        }));

        return streamId;
    },

    appendToStream: (streamId, content, sequence) => {
        set((state) => {
            const message = Array.from(state.messages.values())
                .find(m => m.streamId === streamId);
            
            if (!message) return state;

            const updatedMessage = {
                ...message,
                content: message.content + content,
                metadata: {
                    ...message.metadata,
                    sequence,
                    isPartial: true,
                },
            };

            const newMessages = new Map(state.messages);
            newMessages.set(message.id, updatedMessage);

            return { messages: newMessages };
        });
    },

    completeStream: (streamId, finalContent) => {
        set((state) => {
            const message = Array.from(state.messages.values())
                .find(m => m.streamId === streamId);
            
            if (!message) return state;

            const updatedMessage = {
                ...message,
                state: 'complete' as MessageState,
                content: finalContent ?? message.content,
                metadata: {
                    ...message.metadata,
                    isPartial: false,
                },
            };

            const newMessages = new Map(state.messages);
            newMessages.set(message.id, updatedMessage);

            const newPendingStreamIds = new Set(state.pendingStreamIds);
            newPendingStreamIds.delete(streamId);

            return {
                messages: newMessages,
                pendingStreamIds: newPendingStreamIds,
            };
        });
    },

    failStream: (streamId, error) => {
        set((state) => {
            const message = Array.from(state.messages.values())
                .find(m => m.streamId === streamId);
            
            if (!message) return state;

            const updatedMessage = {
                ...message,
                state: 'failed' as MessageState,
                metadata: {
                    ...message.metadata,
                    error,
                },
            };

            const newMessages = new Map(state.messages);
            newMessages.set(message.id, updatedMessage);

            const newPendingStreamIds = new Set(state.pendingStreamIds);
            newPendingStreamIds.delete(streamId);

            return {
                messages: newMessages,
                pendingStreamIds: newPendingStreamIds,
            };
        });
    },

    // Conversation management
    createConversation: (agentId, sessionId, customId) => {
        const id = customId || uuidv4();
        const timestamp = Date.now();
        const conversation: Conversation = {
            id,
            agentId,
            sessionId,
            messageIds: [],
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        set((state) => ({
            conversations: new Map([...state.conversations, [id, conversation]]),
        }));

        return id;
    },

    setActiveConversation: (conversationId) => {
        set({ activeConversationId: conversationId });
    },

    clearConversation: (conversationId) => {
        set((state) => {
            const conversation = state.conversations.get(conversationId);
            if (!conversation) return state;

            // Remove all messages in conversation
            const newMessages = new Map(state.messages);
            conversation.messageIds.forEach(messageId => {
                newMessages.delete(messageId);
            });

            // Clear conversation message list
            const newConversations = new Map(state.conversations);
            const clearedConversation = {
                ...conversation,
                messageIds: [],
                updatedAt: Date.now(),
            };
            newConversations.set(conversationId, clearedConversation);

            return {
                messages: newMessages,
                conversations: newConversations,
            };
        });
    },

    // Run management
    setActiveRunId: (runId) => {
        set({ activeRunId: runId });
    },

    // Getters
    getConversationMessages: (conversationId) => {
        const state = get();
        const conversation = state.conversations.get(conversationId);
        if (!conversation) return [];

        return conversation.messageIds
            .map(id => state.messages.get(id))
            .filter((msg): msg is ChatMessage => !!msg)
            .sort((a, b) => a.timestamp - b.timestamp);
    },

    getActiveMessages: () => {
        const state = get();
        if (!state.activeConversationId) return [];
        return state.getConversationMessages(state.activeConversationId);
    },

    getIncompleteStreams: () => {
        const state = get();
        const now = Date.now();
        
        return Array.from(state.messages.values())
            .filter(message => 
                message.state === 'streaming' && 
                (now - message.timestamp) > STREAM_TIMEOUT
            );
    },

    // Cleanup
    cleanupOldData: (maxAge = 24 * 60 * 60 * 1000) => { // Default: 24 hours
        const cutoff = Date.now() - maxAge;
        
        set((state) => {
            const newMessages = new Map();
            const newConversations = new Map();

            // Keep recent messages
            for (const [id, message] of state.messages) {
                if (message.timestamp > cutoff) {
                    newMessages.set(id, message);
                }
            }

            // Keep conversations with recent messages
            for (const [id, conversation] of state.conversations) {
                const hasRecentMessages = conversation.messageIds.some(msgId => 
                    newMessages.has(msgId)
                );
                
                if (hasRecentMessages || conversation.updatedAt > cutoff) {
                    // Filter out deleted message IDs
                    const validMessageIds = conversation.messageIds.filter(msgId => 
                        newMessages.has(msgId)
                    );
                    
                    newConversations.set(id, {
                        ...conversation,
                        messageIds: validMessageIds,
                    });
                }
            }

            return {
                messages: newMessages,
                conversations: newConversations,
            };
        });
    },

    clearAll: () => {
        set({
            messages: new Map(),
            conversations: new Map(),
            activeConversationId: null,
            activeRunId: null,
            pendingStreamIds: new Set(),
        });
    },
}));