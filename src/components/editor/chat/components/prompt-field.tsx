import React, {useState} from "react";
import {ArrowUpIcon} from "@heroicons/react/24/outline";
import {PromptNodeInfo} from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import useEditorStore from "@/stores/editorStore";
import {useHandlePlay} from "@/hooks/editor/useHandlePlay";
import useChatViewStore from "@/stores/chatViewStore";

interface PromptFieldProps {
    promptNodes: PromptNodeInfo[];
    selectedPromptNodeId: string;
}

const PromptField: React.FC<PromptFieldProps> = ({
    promptNodes,
    selectedPromptNodeId,
}) => {
    const [input, setInput] = useState("");
    const forceSave = useEditorStore((s) => s.forceSave);
    const selectedPromptNode = promptNodes.find((n) => n.id === selectedPromptNodeId);
    const updateNodeVariable = useNodesStore((s) => s.updateNodeVariable);
    const handlePlay = useHandlePlay();

    // session-based api
    const activeSessionId = useChatViewStore((s) => s.activeSessionId);
    const setActiveSession = useChatViewStore((s) => s.setActiveSession);
    const appendUser = useChatViewStore((s) => s.appendUser);

    const handleSend = async () => {
        if (!input.trim() || !selectedPromptNodeId) return;
        const userInput = input;
        setInput("");

        // 1) Zorg dat er een sessionId is (fallback op nodeId)
        const sessionId = activeSessionId ?? selectedPromptNodeId;
        if (!activeSessionId) setActiveSession(sessionId);

        // 2) Toon prompt meteen in de chat (session-based)
        appendUser(sessionId, userInput);

        try {
            // 3) Schrijf prompt naar node + save
            updateNodeVariable(selectedPromptNodeId, "prompt", userInput);
            if (forceSave) await forceSave();

            // 4) Start de run (WS listener voegt agent-chunks toe aan de actieve sessie)
            const syntheticEvent = {
                preventDefault() {},
                stopPropagation() {},
            } as React.MouseEvent;
            await handlePlay(syntheticEvent, selectedPromptNodeId, "mock");

            window.dispatchEvent(new CustomEvent("restart-log-polling"));
        } catch (e) {
            console.error("send failed", e);
            // evt. rollback toevoegen als je wilt
        }
    };

    return (
        <div className="border-t border-sky-500/50 dark:border-white/10 p-4">
            <div className="relative max-w-3xl mx-auto">
            <textarea
                className="w-full resize-none border border-sky-500/50 dark:border-white/20 rounded-md p-3 pr-12 min-h-[40px] max-h-[120px] text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:border-sky-500 dark:focus:border-white/40 transition-colors"
                rows={1}
                value={input}
                placeholder={`Prompt${selectedPromptNode ? ` for ${selectedPromptNode.name}` : ""}...`}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
            />
                <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-white p-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={handleSend}
                    disabled={!selectedPromptNodeId}
                    title="Send prompt and run workflow"
                >
                    <ArrowUpIcon className="h-4 w-4"/>
                </button>
            </div>
        </div>
    );
};

export default PromptField;