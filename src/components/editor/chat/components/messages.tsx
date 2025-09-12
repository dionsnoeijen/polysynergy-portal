import React, {useCallback, useEffect, useMemo, useRef} from "react";
import useChatViewStore, {ChatViewMessage} from "@/stores/chatViewStore";
import useNodesStore from "@/stores/nodesStore";
import PromptRow from "./prompt-row";
import NodeResponseCard from "@/components/editor/chat/components/node-response-card";
import {getAgentMetaFromNode} from "@/utils/chatHistoryUtils";

const EMPTY: ReadonlyArray<ChatViewMessage> = Object.freeze([]);

type AgentGroupItem = {
    type: "agent_group";
    nodeId: string | null;
    messages: ChatViewMessage[];
    runBatch: number; // ⬅ voor stabiele keys per run
};
type UserItem = { type: "user"; message: ChatViewMessage; runBatch: number };
type RenderItem = AgentGroupItem | UserItem;

const Messages: React.FC = () => {
    const activeSessionId = useChatViewStore((s) => s.activeSessionId);

    const messages = useChatViewStore(
        useCallback(
            (s) => (activeSessionId ? s.messagesBySession[activeSessionId] ?? EMPTY : EMPTY),
            [activeSessionId]
        )
    );

    const getNode = useNodesStore((s) => s.getNode);

    const grouped: RenderItem[] = useMemo(() => {
        if (!messages.length) return [];

        const out: RenderItem[] = [];

        // Per "run" bijhouden naar welke index elke node-groep wijst.
        // Reset bij runstart.
        let runBatch = 0;
        let currentRunId: string | null = null;
        let groupIndexByNode = new Map<string | null, number>();

        const startNewRun = (nextRunId: string | null) => {
            runBatch += 1;
            currentRunId = nextRunId ?? null;
            groupIndexByNode = new Map();
        };

        for (const m of messages) {
            // Run-bounds:
            if (m.sender === "user") {
                startNewRun(m.run_id ?? null);
                out.push({type: "user", message: m, runBatch});
                continue;
            }
            if (currentRunId !== null && m.run_id != null && m.run_id !== currentRunId) {
                // extra safeguard: als agent-chunk een nieuwe run_id draagt
                startNewRun(m.run_id);
            }

            // Agent: groepeer per node binnen huidige run
            const nodeId = m.node_id ?? null;
            if (groupIndexByNode.has(nodeId)) {
                const idx = groupIndexByNode.get(nodeId)!;
                (out[idx] as AgentGroupItem).messages.push(m);
            } else {
                groupIndexByNode.set(nodeId, out.length);
                out.push({type: "agent_group", nodeId, messages: [m], runBatch});
            }
        }

        return out;
    }, [messages]);

    const bottomRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (bottomRef.current) bottomRef.current.scrollIntoView({behavior: "smooth"});
    }, [grouped.length, messages.length]);

    return (
        <div className="flex-1 overflow-auto p-4 space-y-3">
            <div className="mx-auto w-full max-w-[1100px] space-y-3">
            {grouped.map((item, idx) => {
                if (item.type === "user") {
                    const {message} = item;
                    return <PromptRow key={`user-${item.runBatch}-${message.id}`} message={message}/>;
                }

                const {nodeId, messages: groupMsgs, runBatch} = item;
                const node = nodeId ? getNode?.(nodeId) : null;
                const {agentName, agentAvatar} = getAgentMetaFromNode(node);

                const combinedText = groupMsgs.map((m) => m.text).join("");

                // Key is nu uniek per runBatch + nodeId; geen "gissen"
                const first = groupMsgs[0];
                const groupKey = `group-${runBatch}-${nodeId ?? "null"}-${first?.id ?? idx}`;
                
                // Get run_id from first message in the group
                const runId = first?.run_id || null;

                return (
                    <NodeResponseCard
                        key={groupKey}
                        nodeName={agentName}
                        agentAvatar={agentAvatar}
                        text={combinedText}
                        runId={runId}
                    />
                );
            })}
            </div>
            <div ref={bottomRef}/>
        </div>
    );
};

export default Messages;