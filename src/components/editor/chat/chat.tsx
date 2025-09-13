import React, {useEffect, useMemo, useState} from "react";
import useNodesStore from "@/stores/nodesStore";
import useChatViewStore from "@/stores/chatViewStore";
import useEditorStore from "@/stores/editorStore";

import PromptField from "@/components/editor/chat/components/prompt-field";
import ChatTabs from "@/components/editor/chat/components/chat-tabs";
import Messages from "@/components/editor/chat/components/messages";
import SessionUserManager from "@/components/editor/chat/components/session-user-manager";
import {TransparencyMonitor} from "@/components/editor/chat/components/transparency-monitor";
import AIComplianceIndicator from "@/components/editor/chat/components/ai-compliance-indicator";
import TeamMemberIndicators from "@/components/editor/chat/components/team-member-indicators";
import {traceStorageConfiguration} from "@/utils/chatHistoryUtils";
import {NodeVariable} from "@/types/types";

const PROMPT_NODE_PATH = 'polysynergy_nodes.play.prompt.Prompt';

const Chat: React.FC = () => {
    // Select stable primitive data from stores
    const nodes = useNodesStore(s => s.nodes);
    
    // Transparency monitor state
    const [showTransparency, setShowTransparency] = useState(false);
    
    
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
    
    // Get project ID from editor store
    const activeProjectId = useEditorStore(s => s.activeProjectId);

    // Check for storage configuration - reactive to both nodes AND connections
    const hasStorage = useMemo(() => {
        if (!selectedPromptNodeId) return false;
        return !!traceStorageConfiguration(selectedPromptNodeId);
    }, [selectedPromptNodeId]);
    
    // Get active session from prompt node
    const activeSession = useMemo(() => {
        if (!selectedPromptNodeId) return '';
        const promptNode = nodes.find(n => n.id === selectedPromptNodeId);
        const activeSessionVar = promptNode?.variables?.find(v => v.handle === 'active_session');
        return (activeSessionVar?.value as string) || '';
    }, [selectedPromptNodeId, nodes]);
    
    // Get active user from prompt node  
    const activeUser = useMemo(() => {
        if (!selectedPromptNodeId) return '';
        const promptNode = nodes.find(n => n.id === selectedPromptNodeId);
        const activeUserVar = promptNode?.variables?.find(v => v.handle === 'active_user');
        return (activeUserVar?.value as string) || '';
    }, [selectedPromptNodeId, nodes]);
    
    // Get storage configuration for transparency
    const storageConfig = useMemo(() => {
        if (!selectedPromptNodeId) return null;
        return traceStorageConfiguration(selectedPromptNodeId);
    }, [selectedPromptNodeId]);
    
    // Get active session name from prompt node
    const activeSessionName = useMemo(() => {
        if (!selectedPromptNodeId || !activeSession) return '';
        const promptNode = nodes.find(n => n.id === selectedPromptNodeId);
        const sessionVar = promptNode?.variables?.find(v => v.handle === 'session');
        
        if (sessionVar?.value && Array.isArray(sessionVar.value)) {
            const sessionVariables = sessionVar.value as NodeVariable[];
            const sessionObj = sessionVariables.find(v => v.handle === activeSession);
            return sessionObj?.value as string || '';
        }
        return '';
    }, [selectedPromptNodeId, activeSession, nodes]);

    // ✅ session activeren zodra we ‘m kennen (of fallback op nodeId)
    const setActiveSession = useChatViewStore(s => s.setActiveSession);
    useEffect(() => {
        const sessionId = sid ?? selectedPromptNodeId ?? null;
        if (sessionId) setActiveSession(sessionId);
    }, [sid, selectedPromptNodeId, setActiveSession]);

    // fallback selectie op basis van actuele promptNodes
    useEffect(() => {
        ensurePromptSelected();
    }, [promptNodes.length, ensurePromptSelected]);

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
        <div className="flex flex-col h-full">
            <ChatTabs
                promptNodes={promptNodes}
                selectedPromptNodeId={selectedPromptNodeId}
                multipleChats={multipleChats}
            />
            
            {/* Session/User Management with AI Act Compliance Indicator */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-white/10">
                <SessionUserManager
                    promptNodeId={selectedPromptNodeId}
                    hasStorage={hasStorage}
                    showTransparency={showTransparency}
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
                onShowTransparency={() => setShowTransparency(!showTransparency)}
                />
                <AIComplianceIndicator />
            </div>
            
            {/* Team Member Activity Indicators */}
            <TeamMemberIndicators />
            
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
            
            {/* Conditional rendering: Transparency Monitor or Chat Interface */}
            {showTransparency ? (
                storageConfig && activeSession && (
                    <TransparencyMonitor
                        projectId={activeProjectId}
                        sessionId={activeSession}
                        sessionName={activeSessionName}
                        storageConfig={storageConfig}
                        userId={activeUser || undefined}
                        onClose={() => setShowTransparency(false)}
                    />
                )
            ) : (
                <>
                    <Messages />
                    <PromptField
                        promptNodes={promptNodes}
                        selectedPromptNodeId={selectedPromptNodeId}
                    />
                </>
            )}
        </div>
    );
};

export default Chat;