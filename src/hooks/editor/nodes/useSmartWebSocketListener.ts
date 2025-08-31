import {useEffect, useState} from 'react';
import useNodesStore from "@/stores/nodesStore";
import useMockStore, {MockNode} from '@/stores/mockStore';
import {getConnectionExecutionDetails} from "@/api/executionApi";
import useEditorStore from "@/stores/editorStore";
import useChatStore from '@/stores/chatStore';
import {websocketStatusStore} from '@/hooks/editor/useHandlePlay';
import globalWebSocketSingleton from '@/utils/GlobalWebSocketManager';
import {ConnectionStatus} from '@/utils/WebSocketManager';

type ExecutionMessage = {
    node_id?: string;
    event: 'run_start' | 'start_node' | 'end_node' | 'run_end' | "start_tool" | "end_tool" | "RunResponseContent" | "TeamRunResponseContent" | "TeamToolCallCompleted";
    status?: 'success' | 'killed' | 'error';
    order?: number;
    run_id?: string;
    content?: string;
    sequence_id?: number;
    microtime?: number;
    message_id?: string;
};

const groupStates = new Map<string, { count: number, remaining: number }>();
const nodeExecutionState = new Map<string, { started: boolean; ended: boolean; status?: string }>();

export function useSmartWebSocketListener(flowId: string) {

    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!flowId) return;

        const handleWebSocketMessage = (event: MessageEvent) => {
            // (optioneel) defensief parsen als je soms non-JSON ontvangt
            const data = typeof event.data === 'string' ? event.data.trim() : '';
            if (!data || (data[0] !== '{' && data[0] !== '[')) return;
            let message: ExecutionMessage;
            try {
                message = JSON.parse(data);
            } catch {
                return;
            }

            const chatStore = useChatStore.getState();
            const editorStore = useEditorStore.getState();
            const nodesStore = useNodesStore.getState();
            const mockStore = useMockStore.getState();

            const eventType = message.event;
            let node_id = message.node_id;

            if ((eventType === 'RunResponseContent' || eventType === 'TeamRunResponseContent') && message.content && message.run_id) {
                chatStore.addAgentMessage(message.content, message.run_id, node_id, message.sequence_id, message.microtime);
                chatStore.sortMessages(message.run_id);
            }

            if (eventType === 'run_start') {
                cleanupExecutionGlow();
                const realRunId = message.run_id as string;
                const currentActiveRunId = chatStore.activeRunId;
                if (currentActiveRunId && currentActiveRunId.startsWith('pending-')) {
                    const pending = chatStore.messagesByRun[currentActiveRunId] || [];
                    pending.forEach(m => {
                        if (m.sender === 'user') chatStore.addUserMessageWithTimestamp(m.text, realRunId, m.timestamp, m.sequence);
                    });
                    chatStore.clearChatStore(currentActiveRunId);
                }
                chatStore.setActiveRunId(realRunId);
                return;
            }

            if (eventType === 'start_tool') {
                console.log('START TOOL');
                document.querySelector(`[data-node-id="${node_id}"]`)?.classList.add('executing-tool');
                return;
            }
            if (eventType === 'end_tool') {
                setTimeout(() => document.querySelector(`[data-node-id="${node_id}"]`)?.classList.remove('executing-tool'), 5000);
                return;
            }

            if (eventType === 'run_end') {
                if (message.run_id) chatStore.fireRunCompleted(message.run_id);
                setTimeout(async () => {
                    document.querySelectorAll('[data-node-id].executing').forEach((el) => el.classList.remove('executing', 'executed-success', 'executed-killed'));
                    groupStates.clear();
                    nodeExecutionState.clear();
                    const activeVersionId = editorStore.activeVersionId as string;
                    const data = await getConnectionExecutionDetails(activeVersionId, message.run_id as string);
                    mockStore.setMockConnections(data);
                    mockStore.setHasMockData(true);
                }, 100);
                return;
            }

            if (!node_id || !message.run_id) return;

            const isViewingHistoricalRun = editorStore.isViewingHistoricalRun;
            const selectedRunId = editorStore.selectedRunId;
            const forCurrentView = !isViewingHistoricalRun && (!selectedRunId || message.run_id === selectedRunId);

            let el = document.querySelector(`[data-node-id="${node_id}"]`) as HTMLElement | null;
            const nodeFlowNode = nodesStore.getNode(node_id);
            const type = typeof nodeFlowNode?.path === 'undefined' ? 'GroupNode' : nodeFlowNode?.path.split(".").pop();

            if ((eventType === 'start_node' || eventType === 'end_node') && forCurrentView) {
                mockStore.addOrUpdateMockNode({
                    id: `${node_id}-${message.order || 0}`,
                    handle: nodeFlowNode?.handle,
                    runId: message.run_id,
                    killed: message.status === 'killed',
                    type,
                    started: eventType === 'start_node',
                    variables: {},
                    status: eventType === 'start_node' ? 'executing' : (message.status || 'killed'),
                } as MockNode);
            }

            if (!el) {
                if (forCurrentView) {
                    const groupInfo = nodesStore.findNearestVisibleGroupWithCount?.(node_id);
                    if (!groupInfo) return;
                    node_id = groupInfo.groupId;
                    el = document.querySelector(`[data-node-id="${node_id}"]`) as HTMLElement | null;
                    if (!el) return;

                    const {groupId} = groupInfo;
                    const current = groupStates.get(groupId) || {count: groupInfo.count, remaining: 0};
                    if (eventType === 'start_node') {
                        current.remaining += 1;
                        groupStates.set(groupId, current);
                        if (current.remaining === 1) el.classList.add('executing');
                    } else {
                        current.remaining = Math.max(0, current.remaining - 1);
                        if (current.remaining === 0) {
                            el.classList.remove('executing');
                            el.classList.add(`executed-${message.status || 'killed'}`);
                            groupStates.delete(groupId);
                        } else groupStates.set(groupId, current);
                    }
                }
                return;
            }

            if (forCurrentView) {
                const state = nodeExecutionState.get(node_id) || {
                    started: false,
                    ended: false as boolean,
                    status: 'success' as string | undefined
                };
                if (eventType === 'start_node') {
                    state.started = true;
                    nodeExecutionState.set(node_id, state);
                    el.classList.add('executing');
                    if (state.ended) {
                        el.classList.remove('executing');
                        el.classList.add(`executed-${state.status || 'success'}`);
                        nodeExecutionState.delete(node_id);
                    }
                } else {
                    state.ended = true;
                    state.status = message.status || 'success';
                    nodeExecutionState.set(node_id, state);
                    if (state.started) {
                        el.classList.remove('executing');
                        el.classList.add(`executed-${state.status}`);
                        nodeExecutionState.delete(node_id);
                    }
                }
            }
        };

        const unsubscribe = globalWebSocketSingleton.subscribe(
            flowId,
            (status, connected) => {
                setConnectionStatus(status);
                setIsConnected(connected);
                console.log('🔌 GLOBAL SINGLETON STATUS UPDATE:', {flowId, status, connected});
            },
            handleWebSocketMessage
        );
        return unsubscribe;
    }, [flowId]); // ✅ alleen flowId

    useEffect(() => {
        websocketStatusStore.updateStatus(isConnected, connectionStatus);
    }, [isConnected, connectionStatus]);

    useEffect(() => {
        if (!flowId) return;
        cleanupExecutionGlow();
        return cleanupExecutionGlow;
    }, [flowId]);

    function cleanupExecutionGlow() {
        document.querySelectorAll('[data-node-id]').forEach((el) => {
            el.classList.remove('executing', 'executing-tool');
            el.classList.forEach((cls) => {
                if (cls.startsWith('executed-')) el.classList.remove(cls);
            });
        });
        groupStates.clear();
        nodeExecutionState.clear();
    }

    return {connectionStatus, isConnected};
}