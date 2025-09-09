import React, {useEffect, useRef, useCallback, useMemo} from "react";
import useChatViewStore, {ChatViewMessage} from "@/stores/chatViewStore";

type Props = { nodeId: string };

const EMPTY: ReadonlyArray<ChatViewMessage> = Object.freeze([]);

const NodeChatBubble: React.FC<Props> = ({nodeId}) => {
    const activeSessionId = useChatViewStore((s) => s.activeSessionId);

    const sessionMessages = useChatViewStore(
        useCallback(
            (s) => (activeSessionId ? s.messagesBySession[activeSessionId] ?? EMPTY : EMPTY),
            [activeSessionId]
        )
    );

    // 1) Vind de meest recente run_id voor deze node
    const latestForNode = useMemo(() => {
        for (let i = sessionMessages.length - 1; i >= 0; i--) {
            const m = sessionMessages[i];
            if (m.sender === "agent" && m.node_id === nodeId) return m;
        }
        return null as ChatViewMessage | null;
    }, [sessionMessages, nodeId]);

    // 2) Aggregeer ALLE berichten van dit nodeId binnen diezelfde run_id (zodat interleaved chunks toch samenkomen)
    const aggregateText = useMemo(() => {
        if (!latestForNode) return "";
        const runId = latestForNode.run_id ?? null;

        let out = "";
        for (let i = 0; i < sessionMessages.length; i++) {
            const m = sessionMessages[i];
            if (m.sender !== "agent") continue;
            if (m.node_id !== nodeId) continue;

            // zelfde run samenvoegen; als je agressiever wil samenvoegen, haal deze check weg
            if ((m.run_id ?? null) === runId) out += m.text ?? "";
        }
        return out;
    }, [sessionMessages, latestForNode, nodeId]);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // 3) Scroll mee op groei van de geaggregeerde tekst
    useEffect(() => {
        if (!latestForNode) return;
        const el = scrollContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [aggregateText.length]); // <- lengte i.p.v. alleen id/text van het laatste item

    if (!activeSessionId || !latestForNode || !aggregateText) return null;

    return (
        <div className="relative" style={{zIndex: 999999}}>
            <div className="absolute top-0 right-[-420px]" style={{zIndex: 999999}}>
                {/* Tail */}
                <div className="absolute left-[-8px] top-3">
                    <div
                        className="absolute w-0 h-0 border-t-[7px] border-b-[7px] border-r-[9px] border-t-transparent border-b-transparent border-r-sky-600 dark:border-r-sky-600"/>
                    <div
                        className="absolute top-[1px] left-[1px] w-0 h-0 border-t-[6px] border-b-[6px] border-r-[8px] border-t-transparent border-b-transparent border-r-white dark:border-r-neutral-800"/>
                </div>

                <div
                    className="bg-white dark:bg-neutral-800/80 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 rounded-xl shadow border border-slate-300 dark:border-sky-600 max-w-[400px] whitespace-pre-wrap"
                    // let op: geen overflow-hidden hier
                >
                    <div
                        ref={scrollContainerRef}
                        className="overflow-y-auto max-h-[200px] pr-1 space-y-2"
                        onWheel={(e) => e.stopPropagation()}
                    >
                        <div className="text-gray-900 dark:text-gray-100 text-xs">
                            {aggregateText}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NodeChatBubble;