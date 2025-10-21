import React, {useCallback, useEffect, useMemo, useState} from "react";
import useNodesStore from "@/stores/nodesStore";
import useChatViewStore from "@/stores/chatViewStore";
import useEditorStore from "@/stores/editorStore";
import useConnectionsStore from "@/stores/connectionsStore";

import PromptField from "@/components/editor/chat/components/prompt-field";
import ChatTabs from "@/components/editor/chat/components/chat-tabs";
import Messages from "@/components/editor/chat/components/messages";
import SessionUserManager from "@/components/editor/chat/components/session-user-manager";
import AIComplianceIndicator from "@/components/editor/chat/components/ai-compliance-indicator";
import TeamMemberIndicators from "@/components/editor/chat/components/team-member-indicators";
import SessionsSidebar from "@/components/editor/chat/sessions-sidebar";
import {traceStorageConfiguration} from "@/utils/chatHistoryUtils";
import { ChevronDownIcon, ChevronUpIcon, ChatBubbleLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import {useSmartWebSocketListener} from "@/hooks/editor/nodes/useSmartWebSocketListener";
import {NodeVariable, NodeVariableType} from "@/types/types";
import {resumeFlow} from "@/api/executionApi";

const PROMPT_NODE_PATH = 'polysynergy_nodes.play.prompt.Prompt';

interface ChatProps {
    showBackButton?: boolean;
    onBackClick?: () => void;
    isEndUserChatMode?: boolean;
}

const Chat: React.FC<ChatProps> = ({ showBackButton = false, onBackClick, isEndUserChatMode = false }) => {
    // State for team response collapse controls
    const [teamResponsesCollapsed, setTeamResponsesCollapsed] = useState(true);

    // Select stable primitive data from stores
    const nodes = useNodesStore(s => s.nodes);
    const connections = useConnectionsStore(s => s.connections);
    const activeTeamMembers = useChatViewStore(s => s.activeTeamMembers);
    const updateNodeVariable = useNodesStore((s) => s.updateNodeVariable);
    const setWaitingForResponse = useChatViewStore((s) => s.setWaitingForResponse);
    const activeVersionId = useEditorStore(s => s.activeVersionId);

    // Handle resume flow for HITL pause events
    const handleResumeFlow = useCallback(async (runId: string, nodeId: string, userInput: unknown) => {
        const chatView = useChatViewStore.getState();
        const activeSessionId = chatView.activeSessionId;

        if (!activeVersionId) {
            console.error('❌ [Chat] No active version ID');
            alert('Cannot resume: no active flow version');
            return;
        }

        // Set waiting state IMMEDIATELY (before API call)
        // This ensures "thinking" indicator appears right away
        setWaitingForResponse(true);

        try {
            console.log('⏸️ [Chat] Resuming flow:', { runId, nodeId, userInput, versionId: activeVersionId });

            // Call resume API
            await resumeFlow(activeVersionId, runId, nodeId, userInput);

            console.log('✅ [Chat] Resume API call successful');

            // Remove pause message from chat after successful resume
            if (activeSessionId) {
                const messages = chatView.messagesBySession[activeSessionId] ?? [];
                const pauseMessage = messages.find(m =>
                    m.sender === 'system' &&
                    m.pause_data?.run_id === runId &&
                    m.pause_data?.node_id === nodeId
                );

                if (pauseMessage) {
                    chatView.removePauseMessage(activeSessionId, pauseMessage.id);
                    console.log('⏸️ [Chat] Removed pause message after resume');
                }
            }
        } catch (error) {
            console.error('❌ [Chat] Failed to resume flow:', error);
            // On error: stop waiting and keep pause message visible
            setWaitingForResponse(false);
            alert(`Failed to resume agent execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [activeVersionId, setWaitingForResponse]);



    // Memoize prompt nodes calculation
    const promptNodes = useMemo(() => {
        return nodes
            .filter(n => n.path === PROMPT_NODE_PATH)
            .map(n => {
                const nameVar = n.variables?.find(v => v.handle === 'name');
                const displayName = (nameVar?.value ? String(nameVar.value) : n.handle) || n.handle;
                return {id: n.id, name: displayName, handle: n.handle, node: n};
            });
    }, [nodes]);
    
    const chatWindowVisible = promptNodes.length > 0;
    const multipleChats = promptNodes.length > 1;
    
    const getLiveContextForPrompt = useNodesStore(s => s.getLiveContextForPrompt);
    const ensurePromptSelected = useNodesStore(s => s.ensurePromptSelected);
    const selectedPromptNodeId = useNodesStore(s => s.selectedPromptNodeId);
    const {sid} = getLiveContextForPrompt(selectedPromptNodeId);

    // Get project ID from editor store (activeVersionId already defined above)
    const activeProjectId = useEditorStore(s => s.activeProjectId);

    // Initialize WebSocket connection for chat
    const { connectionStatus, isConnected } = useSmartWebSocketListener(activeVersionId as string);

    // Log websocket status for debugging
    useEffect(() => {
        console.log('[Chat] WebSocket status:', {
            connectionStatus,
            isConnected,
            activeVersionId,
            activeProjectId
        });
    }, [connectionStatus, isConnected, activeVersionId, activeProjectId]);

    // Check for storage configuration - reactive to both nodes AND connections
    // eslint-disable-next-line react-hooks/exhaustive-deps -- connections is needed for traceStorageConfiguration to detect storage node connections
    const hasStorage = useMemo(() => {
        if (!selectedPromptNodeId) return false;
        return !!traceStorageConfiguration(selectedPromptNodeId);
    }, [selectedPromptNodeId, connections]);
    
    // Get active session from prompt node
    const activeSession = useMemo(() => {
        if (!selectedPromptNodeId) return '';
        const promptNode = nodes.find(n => n.id === selectedPromptNodeId);
        const activeSessionVar = promptNode?.variables?.find(v => v.handle === 'active_session');
        return (activeSessionVar?.value as string) || '';
    }, [selectedPromptNodeId, nodes]);
    
    // Get active user from prompt node
    // const activeUser = useMemo(() => {
    //     if (!selectedPromptNodeId) return '';
    //     const promptNode = nodes.find(n => n.id === selectedPromptNodeId);
    //     const activeUserVar = promptNode?.variables?.find(v => v.handle === 'active_user');
    //     return (activeUserVar?.value as string) || '';
    // }, [selectedPromptNodeId, nodes]);

    // Get sessions for empty state detection in end-user chat mode
    const sessions = useMemo(() => {
        if (!selectedPromptNodeId) return [];
        const promptNode = nodes.find(n => n.id === selectedPromptNodeId);
        const sessionVar = promptNode?.variables?.find(v => v.handle === 'session');

        if (sessionVar?.value && Array.isArray(sessionVar.value)) {
            return sessionVar.value as NodeVariable[];
        }
        return [];
    }, [selectedPromptNodeId, nodes]);

    // Helper to create new session
    const createNewSession = () => {
        if (!selectedPromptNodeId) return;

        const sessionId = "session-" + Math.random().toString(36).substr(2, 9) + "-" + Date.now().toString(36);
        const sessionName = "New Chat";

        const newSessionVariable: NodeVariable = {
            handle: sessionId,
            type: NodeVariableType.String,
            value: sessionName,
            has_in: false,
            has_out: false,
            published: false,
        };

        const updatedSessionVariables = [...sessions, newSessionVariable];
        updateNodeVariable(selectedPromptNodeId, "session", updatedSessionVariables);
        updateNodeVariable(selectedPromptNodeId, "active_session", sessionId);
    };

    // ✅ session activeren zodra we 'm kennen (of fallback op nodeId)
    const setActiveSession = useChatViewStore(s => s.setActiveSession);
    useEffect(() => {
        const sessionId = sid ?? selectedPromptNodeId ?? null;
        if (sessionId) setActiveSession(sessionId);
    }, [sid, selectedPromptNodeId, setActiveSession]);

    // fallback selectie op basis van actuele promptNodes
    useEffect(() => {
        ensurePromptSelected();
    }, [promptNodes.length, ensurePromptSelected]);

    // Auto-sync when storage becomes available (e.g., when connecting storage node to agent)
    const syncSessionFromBackend = useChatViewStore(s => s.syncSessionFromBackend);
    useEffect(() => {
        if (!hasStorage || !selectedPromptNodeId || !activeProjectId) return;

        const context = getLiveContextForPrompt(selectedPromptNodeId);
        const {storageNow, sid, uid, hasMemory} = context;

        if (!hasMemory || !storageNow || !sid) return;

        console.log('[chat] Storage detected, auto-syncing session...');

        // Trigger sync when storage becomes available
        (async () => {
            try {
                await syncSessionFromBackend({
                    projectId: activeProjectId,
                    storageConfig: storageNow as {type: "LocalAgentStorage" | "DynamoDBAgentStorage" | "LocalDb" | "DynamoDb"},
                    sessionId: sid,
                    userId: uid as string | undefined,
                    limit: 200,
                });
                console.log('[chat] Auto-sync completed');
            } catch (e) {
                console.warn('[chat] Auto-sync failed:', e);
            }
        })();
    }, [hasStorage, selectedPromptNodeId, activeProjectId, getLiveContextForPrompt, syncSessionFromBackend]);

    // Show inactive state when no prompt nodes available
    if (!chatWindowVisible) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-center h-full p-8">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <div className="text-lg font-medium mb-2">No prompt node found</div>
                        <div className="text-sm">Add a PromptNode to enable chat functionality</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full">
            {/* Sessions Sidebar for end-user chat mode */}
            {isEndUserChatMode && (
                <SessionsSidebar
                    promptNodeId={selectedPromptNodeId}
                    showBackButton={showBackButton}
                    onBackClick={onBackClick}
                />
            )}

            {/* Main chat area */}
            <div className="flex flex-col flex-1 h-full">

            <ChatTabs
                promptNodes={promptNodes}
                selectedPromptNodeId={selectedPromptNodeId}
                multipleChats={multipleChats}
            />
            
            {/* Session/User Management with AI Act Compliance Indicator */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-white/10">
                {!isEndUserChatMode && (
                    <SessionUserManager
                        promptNodeId={selectedPromptNodeId}
                        hasStorage={hasStorage}
                        onEnterChatMode={() => {
                        // Chat Mode is handled in editor-layout.tsx where layout panels are available
                        const editorLayout = document.querySelector('[data-panel="top"]');
                        if (editorLayout) {
                            // Dispatch custom event to trigger Chat Mode in editor layout
                            window.dispatchEvent(new CustomEvent('enterChatMode'));
                        }
                    }}
                    onExitChatMode={() => {
                        // Chat Mode is handled in editor-layout.tsx where layout panels are available
                        const editorLayout = document.querySelector('[data-panel="top"]');
                        if (editorLayout) {
                            // Dispatch custom event to trigger Chat Mode exit in editor layout
                            window.dispatchEvent(new CustomEvent('exitChatMode'));
                        }
                    }}
                    />
                )}
                <AIComplianceIndicator />
            </div>
            
            {/* Team Member Activity Indicators */}
            <TeamMemberIndicators />

            {/* Team Response Controls */}
            {Object.keys(activeTeamMembers).length > 0 && (
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Team Responses</span>
                    <button
                        onClick={() => setTeamResponsesCollapsed(!teamResponsesCollapsed)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                        {teamResponsesCollapsed ? (
                            <>
                                <ChevronDownIcon className="w-3 h-3" />
                                Expand All
                            </>
                        ) : (
                            <>
                                <ChevronUpIcon className="w-3 h-3" />
                                Collapse All
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Storage Warnings */}
            {!hasStorage && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md mx-3 my-2 p-3">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                No storage connected
                            </h3>
                            <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                                Sessions and user data won&apos;t persist without a storage connection. Connect a storage node to enable session management.
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {hasStorage && !activeSession && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md mx-3 my-2 p-3">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                No session selected
                            </h3>
                            <div className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                                Chat history cannot be stored without an active session. Select or create a session to enable storage.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty state when no sessions in end-user chat mode */}
            {isEndUserChatMode && sessions.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <div className="mb-6">
                            <ChatBubbleLeftIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No chat sessions yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Start a new conversation to begin chatting
                        </p>
                        <button
                            onClick={createNewSession}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Create New Chat
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <Messages
                        teamResponsesCollapsed={teamResponsesCollapsed}
                        onResumeFlow={handleResumeFlow}
                    />
                    <PromptField
                        promptNodes={promptNodes}
                        selectedPromptNodeId={selectedPromptNodeId}
                    />
                </>
            )}
            </div>
        </div>
    );
};

export default Chat;