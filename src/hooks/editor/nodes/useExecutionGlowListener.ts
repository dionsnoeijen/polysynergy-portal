import { useEffect } from 'react';
import useNodesStore from "@/stores/nodesStore";
import useMockStore, { MockNode } from '@/stores/mockStore';
import {getConnectionExecutionDetails} from "@/api/executionApi";
import useEditorStore from "@/stores/editorStore";

type ExecutionMessage = {
    node_id?: string;
    event: 'run_start' | 'start_node' | 'end_node' | 'run_end';
    status?: 'success' | 'killed' | 'error';
    order?: number;
    run_id?: string;
};

const groupStates = new Map<string, { count: number, remaining: number }>();
const nodeExecutionState = new Map<string, { started: boolean; ended: boolean; status?: string }>();

export function useExecutionGlowListener(flowId: string) {
    const getNode = useNodesStore((state) => state.getNode);
    const addOrUpdateMockNode = useMockStore((state) => state.addOrUpdateMockNode);
    const setMockConnections = useMockStore((state) => state.setMockConnections);
    const setHasMockData = useMockStore((state) => state.setHasMockData);

    useEffect(() => {
        cleanupExecutionGlow();
        if (!flowId) return;

        const socket = new WebSocket(`ws://localhost:8090/ws/v1/execution/${flowId}`);

        socket.onmessage = (event) => {
            const message: ExecutionMessage = JSON.parse(event.data);

            console.log("Execution message received:", message);

            const eventType = message.event;
            let node_id = message.node_id;

            if (eventType === 'run_start') {
                cleanupExecutionGlow();
                return;
            }

            if (eventType === 'run_end') {
                setTimeout(async () => {
                    const executingEls = document.querySelectorAll('[data-node-id].executing');
                    executingEls.forEach((el) => {
                        el.classList.remove('executing', 'executed-success', 'executed-killed');
                    });
                    groupStates.clear();
                    nodeExecutionState.clear();

                    const activeVersionId = useEditorStore.getState().activeVersionId;
                    const data = await getConnectionExecutionDetails(
                        activeVersionId as string,
                        message.run_id as string
                    );
                    setMockConnections(data);
                    setHasMockData(true);
                }, 100);
                return;
            }

            if (!node_id || !message.run_id) return;

            let el = document.querySelector(`[data-node-id="${node_id}"]`) as HTMLElement;
            const nodeFlowNode = getNode(node_id);
            const type = typeof nodeFlowNode?.path === 'undefined'
                ? 'GroupNode'
                : nodeFlowNode?.path.split(".").pop();

            addOrUpdateMockNode({
                id: `${node_id}-${message.order || 0}`,
                handle: nodeFlowNode?.handle,
                runId: message.run_id,
                killed: message.status === 'killed',
                type,
                started: eventType === 'start_node',
                variables: {},
                status:
                    eventType === 'start_node'
                        ? 'executing'
                        : eventType === 'end_node'
                            ? message.status || 'killed'
                            : undefined,
            } as MockNode);

            // Group fallback...
            if (!el) {
                const groupInfo = useNodesStore.getState().findNearestVisibleGroupWithCount?.(node_id);
                if (!groupInfo) return;

                node_id = groupInfo.groupId;
                el = document.querySelector(`[data-node-id="${node_id}"]`) as HTMLElement;
                if (!el) return;

                const { groupId, count } = groupInfo;
                const current = groupStates.get(groupId) || { count, remaining: 0 };

                if (eventType === 'start_node') {
                    current.remaining += 1;
                    groupStates.set(groupId, current);
                    if (current.remaining === 1) el.classList.add('executing');
                } else if (eventType === 'end_node') {
                    current.remaining = Math.max(0, current.remaining - 1);
                    if (current.remaining === 0) {
                        el.classList.remove('executing');
                        el.classList.add(`executed-${message.status || 'killed'}`);
                        groupStates.delete(groupId);
                    } else {
                        groupStates.set(groupId, current);
                    }
                }
                return;
            }

            // Individual node
            const state = nodeExecutionState.get(node_id) || { started: false, ended: false };

            if (eventType === 'start_node') {
                state.started = true;
                nodeExecutionState.set(node_id, state);
                el.classList.add('executing');
                if (state.ended) {
                    el.classList.remove('executing');
                    el.classList.add(`executed-${state.status || 'success'}`);
                    nodeExecutionState.delete(node_id);
                }
            } else if (eventType === 'end_node') {
                state.ended = true;
                state.status = message.status || 'success';
                nodeExecutionState.set(node_id, state);
                if (state.started) {
                    el.classList.remove('executing');
                    el.classList.add(`executed-${state.status}`);
                    nodeExecutionState.delete(node_id);
                }
            }
        };

        function cleanupExecutionGlow() {
            const elements = document.querySelectorAll('[data-node-id]');
            elements.forEach((el) => {
                el.classList.remove('executing');
                el.classList.forEach((cls) => {
                    if (cls.startsWith('executed-')) el.classList.remove(cls);
                });
            });
            groupStates.clear();
            nodeExecutionState.clear();
        }

        return () => {
            socket.close();
            groupStates.clear();
            nodeExecutionState.clear();
            cleanupExecutionGlow();
        };
    }, [flowId]);
}