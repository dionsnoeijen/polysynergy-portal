import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useChatStore from "@/stores/chatStore";

type Props = {
    nodeId: string;
};

const NodeChatBubble: React.FC<Props> = ({ nodeId }) => {
    const runId = useChatStore((state) => state.activeRunId);
    const messagesByRun = useChatStore((state) => state.messagesByRun);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [mounted, setMounted] = useState(false);

    const messages = runId ? messagesByRun[runId] || [] : [];

    const relevantMessages = messages.filter(
        (msg) => msg.sender === "agent" && msg.node_id === nodeId
    );

    const text = relevantMessages.map((msg) => msg.text).join("");

    // Handle mounting
    useEffect(() => {
        setMounted(true);
    }, []);

    // Update position when text changes or on mount
    useEffect(() => {
        const updatePosition = () => {
            const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (nodeElement) {
                const rect = nodeElement.getBoundingClientRect();
                setPosition({
                    x: rect.right + 20,
                    y: rect.top
                });
            }
        };

        if (text.trim()) {
            updatePosition();
            // Update position on scroll/resize
            const handleUpdate = () => updatePosition();
            window.addEventListener('scroll', handleUpdate);
            window.addEventListener('resize', handleUpdate);
            
            return () => {
                window.removeEventListener('scroll', handleUpdate);
                window.removeEventListener('resize', handleUpdate);
            };
        }
    }, [text, nodeId]);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }, [text]);

    if (!runId || !text.trim() || !mounted) return null;

    const bubbleContent = (
        <div 
            className="fixed z-[9999] pointer-events-auto"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
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

    return createPortal(bubbleContent, document.body);
};

export default NodeChatBubble;