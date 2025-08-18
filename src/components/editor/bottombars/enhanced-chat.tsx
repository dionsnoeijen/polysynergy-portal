'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowUpIcon, Cog6ToothIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useChatStore from '@/stores/chatStore';
import useNodesStore from '@/stores/nodesStore';
import useEditorStore from '@/stores/editorStore';
import { usePromptNodeDetection } from '@/hooks/editor/usePromptNodeDetection';
import { useHandlePlay } from '@/hooks/editor/useHandlePlay';
import { createAgnoChatHistoryApi, ChatHistory, ChatSession } from '@/api/agnoChatHistoryApi';
import { traceStorageConfiguration, traceAgentAndStorage, getSessionInfo } from '@/utils/chatHistoryUtils';

const EnhancedChat: React.FC = () => {
    const { promptNodes, chatWindowVisible, multipleChats } = usePromptNodeDetection();
    const messagesByRun = useChatStore((state) => state.messagesByRun);
    // // const addUserMessage = useChatStore((state) => state.addUserMessage);
    const onRunCompleted = useChatStore((state) => state.onRunCompleted);
    const setPendingUserMessage = useChatStore((state) => state.setPendingUserMessage);
    const pendingUserMessage = useChatStore((state) => state.pendingUserMessage);
    const activeRunId = useChatStore((state) => state.activeRunId);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);
    // const getNode = useNodesStore((state) => state.getNode);
    const forceSave = useEditorStore((state) => state.forceSave);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const handlePlay = useHandlePlay();

    const [input, setInput] = useState("");
    const [selectedPromptNodeId, setSelectedPromptNodeId] = useState<string>("");
    const [chatHistory, setChatHistory] = useState<ChatHistory | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [availableSessions, setAvailableSessions] = useState<ChatSession[]>([]);
    const [showSessionSelector, setShowSessionSelector] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [forceReloadTrigger, setForceReloadTrigger] = useState(0);
    // const [wasAtBottom, setWasAtBottom] = useState(true);
    const [manualRefreshLoading, setManualRefreshLoading] = useState(false);
    const [agentInfo, setAgentInfo] = useState<{ avatar?: string; name?: string } | null>(null);

    // Set default selected prompt node and handle node removal
    useEffect(() => {
        if (promptNodes.length > 0) {
            // If no node is selected, or the selected node no longer exists, select the first one
            const selectedNodeExists = promptNodes.some(node => node.id === selectedPromptNodeId);
            if (!selectedPromptNodeId || !selectedNodeExists) {
                setSelectedPromptNodeId(promptNodes[0].id);
            }
        } else {
            // No prompt nodes available, clear selection
            setSelectedPromptNodeId("");
        }
    }, [promptNodes, selectedPromptNodeId]);

    // Load chat history when selected prompt node changes
    useEffect(() => {
        if (!selectedPromptNodeId || !activeProjectId) {
            setChatHistory(null);
            return;
        }

        const loadChatHistory = async () => {
            setIsLoadingHistory(true);
            try {
                // Step 1: Trace storage configuration from prompt → agent → storage
                console.log('Tracing storage configuration from prompt node:', selectedPromptNodeId);
                const storageConfig = traceStorageConfiguration(selectedPromptNodeId);
                
                if (!storageConfig) {
                    console.log('No storage configuration found - agent may not have storage connected');
                    setChatHistory(null);
                    return;
                }

                // Step 2: Get session information from prompt node
                const { sessionId, userId } = getSessionInfo(selectedPromptNodeId);
                
                if (!sessionId) {
                    console.log('No session_id set in prompt node');
                    setChatHistory(null);
                    return;
                }

                // Step 3: Load history using Agno Storage abstractions
                console.log('Loading chat history with storage config:', storageConfig);
                const chatApi = createAgnoChatHistoryApi(activeProjectId);
                const history = await chatApi.getSessionHistory(storageConfig, sessionId, userId);
                
                setChatHistory(history);
                console.log(`Loaded ${history.messages.length} messages for session ${sessionId} using Agno ${storageConfig.type}`);
            } catch (error) {
                console.error('Failed to load chat history:', error);
                setChatHistory(null);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        loadChatHistory();
    }, [selectedPromptNodeId, activeProjectId, forceReloadTrigger]);
    
    // Load agent info (avatar, name) when prompt node changes
    useEffect(() => {
        if (!selectedPromptNodeId) {
            setAgentInfo(null);
            return;
        }
        
        const result = traceAgentAndStorage(selectedPromptNodeId);
        if (result) {
            setAgentInfo({
                avatar: result.agentAvatar,
                name: result.agentName
            });
        } else {
            setAgentInfo(null);
        }
    }, [selectedPromptNodeId]);

    // Load available sessions for session management
    const loadAvailableSessions = async () => {
        if (!activeProjectId || !selectedPromptNodeId) return;
        
        try {
            // Trace storage configuration to load sessions from the same storage
            const storageConfig = traceStorageConfiguration(selectedPromptNodeId);
            if (!storageConfig) {
                console.log('No storage configuration found for session listing');
                return;
            }

            const chatApi = createAgnoChatHistoryApi(activeProjectId);
            const sessions = await chatApi.listSessions(storageConfig);
            setAvailableSessions(sessions);
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    };

    // Create a new session for the current agent node
    const createNewSession = () => {
        if (!selectedPromptNodeId) return;
        
        const result = traceAgentAndStorage(selectedPromptNodeId);
        if (!result) {
            console.error('Cannot create session: no agent node found');
            return;
        }
        
        const newSessionId = `session-${Date.now()}`;
        updateNodeVariable(result.agentNode.id, "session_id", newSessionId);
        setShowSessionSelector(false);
    };

    // Select an existing session
    const selectSession = (sessionId: string) => {
        if (!selectedPromptNodeId) return;
        
        const result = traceAgentAndStorage(selectedPromptNodeId);
        if (!result) {
            console.error('Cannot select session: no agent node found');
            return;
        }
        
        updateNodeVariable(result.agentNode.id, "session_id", sessionId);
        setShowSessionSelector(false);
    };
    
    // Manual refresh/init chat history
    const refreshChatHistory = async () => {
        if (!selectedPromptNodeId || !activeProjectId) return;
        
        setManualRefreshLoading(true);
        try {
            // Trigger a reload by incrementing the force reload trigger
            setForceReloadTrigger(prev => prev + 1);
            
            // Wait a bit for the reload to complete
            await new Promise(resolve => setTimeout(resolve, 500));
        } finally {
            setManualRefreshLoading(false);
        }
    };

    // SIMPLE: Show streaming if active, otherwise show history + pending
    const { messages, currentRunId } = useMemo(() => {
        const historyMessages = chatHistory?.messages || [];
        
        // If we have an active run with messages, show history + streaming
        if (activeRunId && messagesByRun[activeRunId]?.length > 0) {
            const currentMessages = messagesByRun[activeRunId];
            return {
                messages: [...historyMessages, ...currentMessages],
                currentRunId: activeRunId
            };
        }
        
        // Show pending user message if exists
        if (pendingUserMessage) {
            return {
                messages: [...historyMessages, {
                    sender: 'user' as const,
                    text: pendingUserMessage,
                    timestamp: new Date().toISOString()
                }],
                currentRunId: null
            };
        }
        
        // Just show history
        return {
            messages: historyMessages,
            currentRunId: null
        };
    }, [messagesByRun, chatHistory, pendingUserMessage, activeRunId]);
    
    // Listen for run completion: clear streaming + reload history
    useEffect(() => {
        if (!currentRunId) return;
        
        const unsubscribe = onRunCompleted(currentRunId, () => {
            console.log(`Run ${currentRunId} completed, clearing and reloading...`);
            // Clear everything and reload history
            setPendingUserMessage(null);
            // The reload will happen automatically when forceReloadTrigger changes
            setForceReloadTrigger(prev => prev + 1);
        });
        
        return unsubscribe;
    }, [currentRunId, onRunCompleted]);
    
    // SIMPLE: Always scroll to bottom when messages change
    useEffect(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    }, [messages.length]);

    const handleSend = async () => {
        if (!input.trim()) return;
        if (!selectedPromptNodeId) return;

        const userInput = input;
        setInput("");
        
        // Show user message immediately
        setPendingUserMessage(userInput);

        try {
            updateNodeVariable(selectedPromptNodeId, "prompt", userInput);
            
            if (forceSave) {
                await forceSave();
            }
            
            const syntheticEvent = {
                preventDefault: () => {},
                stopPropagation: () => {}
            } as React.MouseEvent;
            
            await handlePlay(syntheticEvent, selectedPromptNodeId, 'mock');
            
        } catch (error) {
            console.error('Failed to save and execute:', error);
            setPendingUserMessage(null);
        }
    };


    const selectedPromptNode = promptNodes.find(node => node.id === selectedPromptNodeId);

    // Auto-scroll to bottom during streaming
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        
        // Check if user was near bottom before message was added
        const { scrollTop, scrollHeight, clientHeight } = container;
        const wasNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold
        
        // Always scroll down for:
        // 1. New user messages (pending or actual)
        // 2. When user was already near bottom  
        // 3. When there's a pending message (user just submitted)
        if (wasNearBottom || pendingUserMessage) {
            // Use setTimeout to ensure DOM is updated
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 10);
        }
    }, [messages, pendingUserMessage]);

    // Show message if no prompt nodes
    if (!chatWindowVisible) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="text-lg font-medium mb-2">No prompt node found</div>
                    <div className="text-sm">
                        Add a PromptNode to enable chat functionality
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Tab headers for multiple prompt nodes */}
            {multipleChats && (
                <div className="border-b border-gray-200 dark:border-white/10">
                    <div className="flex justify-between items-center">
                        <div className="flex">
                            {promptNodes.map((node) => (
                                <button
                                    key={node.id}
                                    onClick={() => setSelectedPromptNodeId(node.id)}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                        selectedPromptNodeId === node.id
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    {node.name}
                                </button>
                            ))}
                        </div>
                        {selectedPromptNodeId && (
                            <div className="flex items-center space-x-2 px-4">
                                <button
                                    onClick={refreshChatHistory}
                                    disabled={manualRefreshLoading}
                                    className={`text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 ${
                                        manualRefreshLoading ? 'animate-spin' : ''
                                    }`}
                                    title="Refresh chat history"
                                >
                                    <ArrowPathIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={createNewSession}
                                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    title="New session"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        loadAvailableSessions();
                                        setShowSessionSelector(!showSessionSelector);
                                    }}
                                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    title="Manage sessions"
                                >
                                    <Cog6ToothIcon className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Session selector dropdown */}
            {showSessionSelector && (
                <div className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800 p-4">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Session</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        <button
                            onClick={createNewSession}
                            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400"
                        >
                            + Create New Session
                        </button>
                        {availableSessions.map((session) => (
                            <button
                                key={session.session_id}
                                onClick={() => selectSession(session.session_id)}
                                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <div className="font-medium">{session.session_name || session.session_id}</div>
                                <div className="text-xs text-gray-500">
                                    {session.message_count} messages • {new Date(session.last_activity).toLocaleDateString()}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Messages area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-auto p-4 space-y-2">
                {/* Loading state for chat history */}
                {isLoadingHistory && (
                    <div className="flex justify-center text-gray-500 dark:text-gray-400 text-sm">
                        Loading chat history...
                    </div>
                )}
                
                {/* Session info display */}
                {chatHistory && !isLoadingHistory && (
                    <div className="text-center text-xs text-gray-400 dark:text-gray-500 pb-2 border-b border-gray-200 dark:border-gray-700">
                        Session: {chatHistory.session_id} 
                        {chatHistory.session_info.created_at && (
                            <> • Started {new Date(chatHistory.session_info.created_at).toLocaleDateString()}</>
                        )}
                        {chatHistory.total_messages > 0 && (
                            <> • {chatHistory.total_messages} messages</>
                        )}
                    </div>
                )}
                
                {messages.filter(msg => msg.text.trim()).map((msg, i) => (
                    <div
                        key={i}
                        className={msg.sender === "user" ? "flex justify-end" : "flex justify-start items-start space-x-2"}
                    >
                        {/* Agent avatar - only show if message has actual content */}
                        {msg.sender === "agent" && agentInfo?.avatar && (
                            <div className="flex-shrink-0 mt-1">
                                <img 
                                    src={agentInfo.avatar} 
                                    alt={agentInfo.name || 'Agent'}
                                    className="w-8 h-8 rounded-full object-cover"
                                    onError={(e) => {
                                        // Hide avatar if image fails to load
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                        
                        <div
                            className={`px-4 py-2 rounded-xl text-sm max-w-[70%] ${
                                msg.sender === "user"
                                    ? "bg-blue-500 text-white"
                                    : "text-gray-900 dark:text-gray-100"
                            }`}
                        >
                            {msg.sender === "user" ? (
                                // User messages as plain text
                                <div className="whitespace-pre-wrap">{msg.text}</div>
                            ) : (
                                // Agent messages with markdown parsing
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            // Custom styling for markdown elements
                                            p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                            code: ({children, className}) => {
                                                const isInline = !className;
                                                return isInline ? (
                                                    <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">{children}</code>
                                                ) : (
                                                    <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">{children}</code>
                                                );
                                            },
                                            pre: ({children}) => <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">{children}</pre>,
                                            ul: ({children}) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                                            ol: ({children}) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                                            li: ({children}) => <li className="mb-1">{children}</li>,
                                            blockquote: ({children}) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic">{children}</blockquote>,
                                        }}
                                    >
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-sky-500/50 dark:border-white/10 p-4">
                <div className="relative max-w-3xl mx-auto">
                    <textarea
                        className="w-full resize-none border border-sky-500/50 dark:border-white/20 rounded-md p-3 pr-12 min-h-[40px] max-h-[120px] text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:border-sky-500 dark:focus:border-white/40 transition-colors"
                        rows={1}
                        value={input}
                        placeholder={`Prompt${selectedPromptNode ? ` for ${selectedPromptNode.name}` : ''}...`}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <button
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-white p-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        onClick={handleSend}
                        disabled={!selectedPromptNodeId}
                        title="Send prompt and run workflow"
                    >
                        <ArrowUpIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnhancedChat;