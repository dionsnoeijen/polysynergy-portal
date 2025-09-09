import React, {useEffect, useMemo} from "react";
import useNodesStore from "@/stores/nodesStore";
import useChatViewStore from "@/stores/chatViewStore";
import PromptField from "@/components/editor/chat/components/prompt-field";
import ChatTabs from "@/components/editor/chat/components/chat-tabs";
import Messages from "@/components/editor/chat/components/messages";

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
            <Messages />
            <PromptField
                promptNodes={promptNodes}
                selectedPromptNodeId={selectedPromptNodeId}
            />
        </div>
    );
};

export default Chat;