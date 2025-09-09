import React, {useEffect} from "react";
import useNodesStore from "@/stores/nodesStore";
import useChatViewStore from "@/stores/chatViewStore";
import PromptField from "@/components/editor/chat/components/prompt-field";
import ChatTabs from "@/components/editor/chat/components/chat-tabs";
import Messages from "@/components/editor/chat/components/messages";

const Chat: React.FC = () => {
    const getPromptMeta = useNodesStore(s => s.getPromptMeta);
    const getLiveContextForPrompt = useNodesStore(s => s.getLiveContextForPrompt);
    const ensurePromptSelected = useNodesStore(s => s.ensurePromptSelected);
    const selectedPromptNodeId = useNodesStore(s => s.selectedPromptNodeId);

    const {promptNodes, multipleChats} = getPromptMeta();
    const {storageNow, sid, uid, agentNodeId, hasMemory} =
        getLiveContextForPrompt(selectedPromptNodeId);

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