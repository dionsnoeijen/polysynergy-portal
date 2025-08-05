import React, { useEffect, useRef } from "react";
import useChatStore from "@/stores/chatStore";

type Props = {
    nodeId: string;
};

const NodeChatBubble: React.FC<Props> = ({ nodeId }) => {
    const runId = useChatStore((state) => state.activeRunId);
    const messagesByRun = useChatStore((state) => state.messagesByRun);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const messages = runId ? messagesByRun[runId] || [] : [];

    const relevantMessages = messages.filter(
        (msg) => msg.sender === "agent" && msg.node_id === nodeId
    );

    const text = relevantMessages.map((msg) => msg.text).join("");

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }, [text]);

    if (!runId || !text.trim()) return null;

    return (
        <div className="absolute top-0 right-[-620px]" style={{zIndex: 99999}}>
            <div className="absolute left-[-8px] top-3">
                <div className="absolute w-0 h-0 border-t-[7px] border-b-[7px] border-r-[9px] border-t-transparent border-b-transparent border-r-sky-600 dark:border-r-sky-600" />
                <div className="absolute top-[1px] left-[1px] w-0 h-0 border-t-[6px] border-b-[6px] border-r-[8px] border-t-transparent border-b-transparent border-r-white dark:border-r-neutral-800" />
            </div>

            <div className="bg-white dark:bg-neutral-800/80 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 rounded-xl shadow border border-slate-300 dark:border-sky-600 max-w-[600px] whitespace-pre-wrap max-h-[240px] overflow-hidden">
                <div
                    ref={scrollContainerRef}
                    className="overflow-y-auto max-h-[200px] pr-1"
                    onWheel={(e) => e.stopPropagation()}
                >
                    {text}
                </div>
            </div>
        </div>
    );
};

export default NodeChatBubble;