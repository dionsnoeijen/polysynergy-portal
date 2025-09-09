import React, {useEffect, useRef, useState, useCallback} from "react";
import {PromptNodeInfo} from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import useChatViewStore from "@/stores/chatViewStore";
import useEditorStore from "@/stores/editorStore";

interface ChatTabsProps {
    promptNodes: PromptNodeInfo[];
    selectedPromptNodeId: string;
    multipleChats: boolean;
}

const ChatTabs: React.FC<ChatTabsProps> = ({
    promptNodes,
    selectedPromptNodeId,
    multipleChats,
}) => {
    const activeProjectId = useEditorStore((s) => s.activeProjectId);
    const setSelectedPromptNodeId = useNodesStore((s) => s.setSelectedPromptNodeId);
    const getLiveContextForPrompt = useNodesStore((s) => s.getLiveContextForPrompt);
    const syncSessionFromBackend = useChatViewStore((s) => s.syncSessionFromBackend);
    const setActiveSession = useChatViewStore((s) => s.setActiveSession);

    const [loading, setLoading] = useState(false);

    // Houd bij welke sessie momenteel een sync request loopt, zodat we niet dubbel schieten.
    const inflightKeyRef = useRef<string | null>(null);

    // Bij tab-click: selecteer de prompt node. De useEffect hieronder doet de rest (setActiveSession + sync).
    const onTabClick = useCallback(
        (nodeId: string) => {
            if (nodeId !== selectedPromptNodeId) {
                setSelectedPromptNodeId(nodeId);
            }
        },
        [selectedPromptNodeId, setSelectedPromptNodeId]
    );

    useEffect(() => {
        if (!selectedPromptNodeId || !activeProjectId) return;

        const {storageNow, sid, uid, hasMemory: tabHasMemory} =
            getLiveContextForPrompt(selectedPromptNodeId);

        if (sid) setActiveSession(sid);

        if (!tabHasMemory || !storageNow || !sid) return;

        const inflightKey = `${activeProjectId}:${sid}`;
        if (inflightKeyRef.current === inflightKey) return;

        inflightKeyRef.current = inflightKey;
        setLoading(true);
        (async () => {
            try {
                await syncSessionFromBackend({
                    projectId: activeProjectId,
                    storageConfig: storageNow,
                    sessionId: sid,
                    userId: uid as string | undefined,
                    limit: 200,
                });
            } catch (e) {
                // Niet fataal; UI blijft lokale stream tonen.
                console.warn("[tabs-sync] failed:", e);
            } finally {
                setLoading(false);
                // Alleen resetten als dezelfde key nog geldt
                if (inflightKeyRef.current === inflightKey) {
                    inflightKeyRef.current = null;
                }
            }
        })();
    }, [selectedPromptNodeId, activeProjectId, getLiveContextForPrompt, setActiveSession, syncSessionFromBackend]);

    if (!multipleChats) return null;

    return (
        <div className="border-b border-gray-200 dark:border-white/10">
            <div className="flex justify-between items-center">
                <div className="flex">
                    {promptNodes.map((node) => (
                        <button
                            key={node.id}
                            onClick={() => onTabClick(node.id)}
                            className={`relative px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                selectedPromptNodeId === node.id
                                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                        >
                            {node.name}
                            {/* Optioneel: kleine loader dot onder de actieve tab terwijl er gesynct wordt */}
                            {loading && selectedPromptNodeId === node.id && (
                                <span
                                    className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"/>
                            )}
                        </button>
                    ))}
                </div>
                {/* Geen refresh-knop meer */}
            </div>
        </div>
    );
};

export default ChatTabs;