import { useEffect, useRef } from 'react';
import { useUnifiedChatStore } from '@/stores/unifiedChatStore';
import useChatStore from '@/stores/chatStore';

/**
 * Bridge between old chat store (WebSocket integration) and new unified store
 * This allows gradual migration while maintaining existing functionality
 */
export const useUnifiedChatIntegration = () => {
    const unifiedStore = useUnifiedChatStore();
    const streamMapRef = useRef<Map<string, string>>(new Map()); // nodeId -> streamId mapping
    
    // Listen for changes in old chat store and sync to unified store
    const messagesByRun = useChatStore((state) => state.messagesByRun);
    const activeRunId = useChatStore((state) => state.activeRunId);
    
    useEffect(() => {
        if (!activeRunId || !messagesByRun[activeRunId]) {
            return;
        }

        const messages = messagesByRun[activeRunId];
        console.log('🔄 UNIFIED CHAT SYNC - ActiveRunId:', activeRunId);
        console.log('🔄 UNIFIED CHAT SYNC - Messages from chatStore:', messages.map(m => ({
            sender: m.sender,
            text: m.text.substring(0, 50) + '...',
            timestamp: m.timestamp,
            sequence: m.sequence,
            node_id: m.node_id
        })));
        
        // Check if this is a session-based conversation (memory mode)
        const activeConversation = unifiedStore.activeConversationId;
        const isSessionBased = activeConversation && activeConversation.startsWith('session-');
        
        if (isSessionBased) {
            // Memory mode: Smart merge with existing conversation
            // Track which messages we've processed by nodeId to handle streaming
            const processedNodes = new Map<string, string>(); // nodeId -> lastContent
            
            messages.forEach((message) => {
                // In memory mode, ONLY process agent messages (user messages are already added correctly)
                if (message.sender === 'agent' && message.node_id) {
                    const existingMessages = unifiedStore.getConversationMessages(activeConversation);
                    
                    // Find existing message for this node
                    const existingMsg = existingMessages.find(m => 
                        m.source === 'agent_stream' && 
                        m.nodeId === message.node_id
                    );
                    
                    if (existingMsg) {
                        // Update existing message if content changed (streaming update)
                        if (existingMsg.content !== message.text) {
                            unifiedStore.updateMessage(existingMsg.id, {
                                content: message.text,
                                metadata: {
                                    ...existingMsg.metadata,
                                    sequence: message.sequence,
                                    microtime: message.microtime,
                                }
                            });
                        }
                    } else {
                        // Add new message for this node
                        console.log('🚨 ADDING AGENT MESSAGE IN MEMORY MODE:', {
                            text: message.text.substring(0, 30),
                            timestamp: message.timestamp,
                            sequence: message.sequence
                        });
                        
                        unifiedStore.addMessage({
                            conversationId: activeConversation,
                            source: 'agent_stream',
                            state: 'complete',
                            content: message.text,
                            nodeId: message.node_id,
                            metadata: {
                                sequence: message.sequence,
                                microtime: message.microtime,
                            }
                        });
                    }
                }
            });
        } else {
            // No-memory mode: Incremental sync (fixed to preserve order)
            const conversationId = activeRunId;
            
            // Ensure conversation exists
            if (!unifiedStore.conversations.has(conversationId)) {
                unifiedStore.createConversation('agent', undefined, conversationId);
            }
            
            // Get existing messages to track what we've already synced
            const existingMessages = unifiedStore.getConversationMessages(conversationId);
            
            // Create a set of existing message signatures to avoid duplicates
            const existingSignatures = new Set(
                existingMessages.map(msg => `${msg.source}-${msg.content}-${msg.metadata?.sequence || 0}`)
            );
            
            // Sort messages by sequence number to process in correct order
            const sortedMessages = [...messages].sort((a, b) => {
                // Sort by sequence number, with undefined sequences last
                const seqA = a.sequence || Number.MAX_SAFE_INTEGER;
                const seqB = b.sequence || Number.MAX_SAFE_INTEGER;
                if (seqA !== seqB) return seqA - seqB;
                
                // If sequences are equal, user messages come first
                if (a.sender !== b.sender) {
                    return a.sender === 'user' ? -1 : 1;
                }
                
                // Finally sort by timestamp
                return a.timestamp - b.timestamp;
            });
            
            // Process messages from chat store and only add new ones
            sortedMessages.forEach((message, index) => {
                const messageSignature = `${message.sender === 'user' ? 'user' : 'agent_stream'}-${message.text}-${message.sequence || 0}`;
                
                // Skip if we already have this message
                if (existingSignatures.has(messageSignature)) {
                    return;
                }
                
                // Calculate proper timestamp to ensure chronological order
                let messageTimestamp = message.timestamp;
                
                // Use a deterministic timestamp based on sequence for reliable ordering
                if (message.sequence) {
                    // Base timestamp: start of run + sequence offset
                    const runStartTime = sortedMessages.find(m => m.sequence === 1)?.timestamp || Date.now();
                    const sequenceOffset = (message.sequence - 1) * 1000; // 1 second between sequences
                    
                    if (message.sender === 'user') {
                        // User messages at the start of their sequence
                        messageTimestamp = runStartTime + sequenceOffset;
                    } else {
                        // Agent messages 500ms after user message in same sequence
                        messageTimestamp = runStartTime + sequenceOffset + 500;
                    }
                    
                    // If we have microtime, use it for fine-grained ordering within the sequence
                    if (message.microtime) {
                        messageTimestamp = message.microtime;
                    }
                } else {
                    // For messages without sequence, ensure they don't interfere with sequenced messages
                    messageTimestamp = message.timestamp;
                }
                
                console.log('💬 ADDING TO UNIFIED:', {
                    sender: message.sender,
                    originalTimestamp: message.timestamp,
                    calculatedTimestamp: messageTimestamp,
                    sequence: message.sequence,
                    text: message.text.substring(0, 30) + '...'
                });

                if (message.sender === 'agent') {
                    // For agent messages, use calculated timestamp
                    unifiedStore.addMessage({
                        conversationId,
                        source: 'agent_stream',
                        state: 'complete',
                        content: message.text,
                        nodeId: message.node_id,
                        timestamp: messageTimestamp,
                        metadata: {
                            sequence: message.sequence,
                            microtime: message.microtime,
                        }
                    });
                } else if (message.sender === 'user') {
                    // For user messages, use calculated timestamp
                    unifiedStore.addMessage({
                        conversationId,
                        source: 'user',
                        state: 'complete',
                        content: message.text,
                        timestamp: messageTimestamp,
                        metadata: {
                            sequence: message.sequence,
                            microtime: message.microtime,
                        }
                    });
                }
                
                // Add to existing signatures to track what we've added
                existingSignatures.add(messageSignature);
            });
            
            // Set active conversation for no-memory mode
            unifiedStore.setActiveConversation(activeRunId);
            unifiedStore.setActiveRunId(activeRunId);
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messagesByRun, activeRunId]); // unifiedStore methods are stable, don't include as dependency

    // Listen for run completion from old chat store
    const onRunCompleted = useChatStore((state) => state.onRunCompleted);
    
    useEffect(() => {
        if (!activeRunId) return;
        
        const unsubscribe = onRunCompleted(activeRunId, () => {
            // Mark all streaming messages in this conversation as complete
            const conversationId = activeRunId;
            const messages = unifiedStore.getConversationMessages(conversationId);
            
            messages.forEach(message => {
                if (message.state === 'streaming' && message.streamId) {
                    // Complete the stream with current content
                    unifiedStore.completeStream(message.streamId, message.content);
                }
            });
        });

        return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps  
    }, [activeRunId, onRunCompleted]); // unifiedStore methods are stable, don't include as dependency

    return {
        // Expose unified store methods for components to use
        getActiveMessages: unifiedStore.getActiveMessages,
        addMessage: unifiedStore.addMessage,
        createConversation: unifiedStore.createConversation,
        setActiveConversation: unifiedStore.setActiveConversation,
        loadServerMessages: unifiedStore.loadServerMessages,
        clearConversation: unifiedStore.clearConversation,
        
        // State
        activeConversationId: unifiedStore.activeConversationId,
        conversations: unifiedStore.conversations,
    };
};