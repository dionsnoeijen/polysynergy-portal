import React, {useEffect, useMemo} from "react";
import useNodesStore from "@/stores/nodesStore";
import useChatViewStore from "@/stores/chatViewStore";
import PromptField from "@/components/editor/chat/components/prompt-field";
import ChatTabs from "@/components/editor/chat/components/chat-tabs";
import Messages from "@/components/editor/chat/components/messages";
import SessionUserManager from "@/components/editor/chat/components/session-user-manager";
import {traceStorageConfiguration} from "@/utils/chatHistoryUtils";

const PROMPT_NODE_PATH = 'polysynergy_nodes.play.prompt.Prompt';

const Chat: React.FC = () => {
    // Select stable primitive data from store
    const nodes = useNodesStore(s => s.nodes);
    
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

    // Check for storage configuration - essential for session/user management
    const hasStorage = useMemo(() => {
        if (!selectedPromptNodeId) return false;
        return !!traceStorageConfiguration(selectedPromptNodeId);
    }, [selectedPromptNodeId]);

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
            
            {/* Session/User Management */}
            <SessionUserManager
                promptNodeId={selectedPromptNodeId}
                hasStorage={hasStorage}
            />
            
            {/* Storage Warning */}
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
                                Sessions and user data won't persist without a storage connection. Connect a storage node to enable session management.
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <Messages />
            <PromptField
                promptNodes={promptNodes}
                selectedPromptNodeId={selectedPromptNodeId}
            />
        </div>
    );
};

export default Chat;