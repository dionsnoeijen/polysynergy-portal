// hooks/useSmartWebSocketListener.ts (jouw bestand)
import {useEffect, useState} from 'react';
import useNodesStore from "@/stores/nodesStore";
import useMockStore, {MockNode} from '@/stores/mockStore';
import {getConnectionExecutionDetails} from "@/api/executionApi";
import useEditorStore from "@/stores/editorStore";
import {websocketStatusStore} from '@/hooks/editor/useHandlePlay';
import globalWebSocketSingleton from '@/utils/GlobalWebSocketManager';
import {ConnectionStatus} from '@/utils/WebSocketManager';

// ⬇️ NIEUW
import useChatViewStore from '@/stores/chatViewStore';

type ExecutionMessage = {
    node_id?: string;
    event: 'run_start' | 'start_node' | 'end_node' | 'run_end' | "start_tool" | "end_tool" | "RunContent" | "TeamRunContent" | "TeamToolCallCompleted";
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
const processedEvents = new Set<string>();
const pendingAnimations = new Map<string, NodeJS.Timeout>();

// Tool execution timing tracker
const toolExecutionTracker = new Map<string, { startTime: number; startEvent: any }>();

// Tool visualization tracker - ensures minimum display time
const toolVisualizationTracker = new Map<string, { timeoutId: NodeJS.Timeout; displayStartTime: number }>();

export function useSmartWebSocketListener(flowId: string) {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!flowId) return;

        const handleWebSocketMessage = async (event: MessageEvent) => {
            const data = typeof event.data === 'string' ? event.data.trim() : '';
            if (!data || (data[0] !== '{' && data[0] !== '[')) return;

            let message: ExecutionMessage;
            try {
                message = JSON.parse(data);
            } catch {
                return;
            }

            const editorStore = useEditorStore.getState();
            const nodesStore = useNodesStore.getState();
            const mockStore = useMockStore.getState();

            // ⬇️ chat-view store ophalen
            const chatView = useChatViewStore.getState();

            const eventType = message.event;
            let node_id = message.node_id;

            // ---- STREAM CONTENT ----
            if ((eventType === "RunContent" || eventType === "TeamRunContent")
                && message.content) {
                const sessionId = chatView.getActiveSessionId();
                if (sessionId && message.content) {
                    const tsMs =
                        typeof message.microtime === "number" ? Math.round(message.microtime * 1000) : Date.now();

                    chatView.appendAgentChunk(
                        sessionId,
                        message.node_id,
                        message.content,
                        tsMs,
                        message.sequence_id,
                        message.run_id ?? null
                    );
                }
            }

            // ---- RUN START ----
            if (eventType === 'run_start') {
                cleanupExecutionGlow();
                return;
            }

            // ---- TOOLS UI ----
            if (eventType === 'start_tool') {
                const startTime = performance.now();
                const trackingKey = `${node_id}-${message.run_id}`;
                
                // Check if we already have a visualization running for this tool
                const existingViz = toolVisualizationTracker.get(trackingKey);
                if (existingViz) {
                    return;
                }
                
                // Store start time for duration calculation
                toolExecutionTracker.set(trackingKey, {
                    startTime,
                    startEvent: message
                });
                
                const element = document.querySelector(`[data-node-id="${node_id}"]`);
                if (element) {
                    element.classList.add('executing-tool');
                    
                    // Store visualization info for minimum display time
                    toolVisualizationTracker.set(trackingKey, {
                        timeoutId: null as any, // Will be set when end_tool arrives
                        displayStartTime: performance.now()
                    });
                } else {
                    console.warn('⚠️ Element not found for node_id:', node_id);
                }
                return;
            }
            
            if (eventType === 'end_tool') {
                const endTime = performance.now();
                const trackingKey = `${node_id}-${message.run_id}`;
                const startData = toolExecutionTracker.get(trackingKey);
                const vizData = toolVisualizationTracker.get(trackingKey);

                let duration = 'unknown';
                if (startData) {
                    const durationMs = endTime - startData.startTime;
                    duration = `${durationMs.toFixed(2)}ms`;
                    toolExecutionTracker.delete(trackingKey);
                }

                // Show warning if tool executed too quickly
                if (startData && (endTime - startData.startTime) < 50) {
                    console.warn('⚡ VERY FAST TOOL EXECUTION - Duration:', duration);
                }

                // Handle visualization with minimum display time
                if (vizData) {
                    const MINIMUM_DISPLAY_TIME = 2000; // 2 seconds minimum
                    const displayTimeElapsed = endTime - vizData.displayStartTime;
                    const remainingDisplayTime = Math.max(0, MINIMUM_DISPLAY_TIME - displayTimeElapsed);

                    const cleanup = () => {
                        const element = document.querySelector(`[data-node-id="${node_id}"]`);
                        if (element) {
                            element.classList.remove('executing-tool');
                        }
                        toolVisualizationTracker.delete(trackingKey);
                    };

                    if (remainingDisplayTime > 0) {
                        // Need to wait more to reach minimum display time
                        const timeoutId = setTimeout(cleanup, remainingDisplayTime);
                        toolVisualizationTracker.set(trackingKey, {
                            ...vizData,
                            timeoutId
                        });
                    } else {
                        // Already displayed long enough, cleanup immediately
                        cleanup();
                    }
                } else {
                    console.warn('⚠️ END_TOOL received without corresponding START_TOOL visualization');
                }
                return;
            }

            // ---- RUN END ----
            if (eventType === 'run_end') {
                const sessionId = chatView.getActiveSessionId();
                if (sessionId) {
                    chatView.finalizeAgentMessage(sessionId);
                }

                setTimeout(async () => {
                    // Cancel all pending animation timeouts
                    pendingAnimations.forEach((timeoutId) => clearTimeout(timeoutId));
                    pendingAnimations.clear();
                    
                    // Remove all execution-related classes from all nodes
                    document.querySelectorAll('[data-node-id]').forEach((el) => {
                        el.classList.remove('executing', 'executing-tool');
                        el.classList.forEach((cls) => {
                            if (cls.startsWith('executed-')) el.classList.remove(cls);
                        });
                    });
                    groupStates.clear();
                    nodeExecutionState.clear();
                    processedEvents.clear();

                    const activeVersionId = editorStore.activeVersionId as string;
                    const data = await getConnectionExecutionDetails(activeVersionId, message.run_id as string);
                    mockStore.setMockConnections(data);
                    mockStore.setHasMockData(true);
                }, 100);
                return;
            }

            // ---- FILTER INVALID EVENTS ----
            // Skip events with undefined status or order (spurious events)
            if ((eventType === 'end_node' && !message.status) || message.order === undefined) {
                return;
            }

            // ---- NODE GLOW / MOCK ----
            if (!node_id || !message.run_id) return;

            const isViewingHistoricalRun = editorStore.isViewingHistoricalRun;
            const selectedRunId = editorStore.selectedRunId;
            const forCurrentView = !isViewingHistoricalRun && (!selectedRunId || message.run_id === selectedRunId);

            let el = document.querySelector(`[data-node-id="${node_id}"]`) as HTMLElement | null;
            const nodeFlowNode = nodesStore.getNode(node_id);
            const type = typeof nodeFlowNode?.path === 'undefined' ? 'GroupNode' : nodeFlowNode?.path.split(".").pop();

            if ((eventType === 'start_node' || eventType === 'end_node') && forCurrentView) {
                // Create unique event ID to prevent processing duplicates
                const eventId = `${eventType}-${node_id}-${message.run_id}-${message.order}`;
                if (processedEvents.has(eventId)) {
                    return;
                }
                processedEvents.add(eventId);

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
                        // Ensure the blue bounce animation is visible for at least 500ms
                        const timeoutId = setTimeout(() => {
                            el.classList.remove('executing');
                            el.classList.add(`executed-${state.status}`);
                            pendingAnimations.delete(node_id);
                        }, 500);
                        pendingAnimations.set(node_id, timeoutId);
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
            },
            handleWebSocketMessage
        );
        return unsubscribe;
    }, [flowId]);

    useEffect(() => {
        websocketStatusStore.updateStatus(isConnected, connectionStatus);
    }, [isConnected, connectionStatus]);

    useEffect(() => {
        if (!flowId) return;
        cleanupExecutionGlow();
        return cleanupExecutionGlow;
    }, [flowId]);

    function cleanupExecutionGlow() {
        // Cancel all pending animation timeouts
        pendingAnimations.forEach((timeoutId) => clearTimeout(timeoutId));
        pendingAnimations.clear();
        
        document.querySelectorAll('[data-node-id]').forEach((el) => {
            el.classList.remove('executing', 'executing-tool');
            el.classList.forEach((cls) => {
                if (cls.startsWith('executed-')) el.classList.remove(cls);
            });
        });
        groupStates.clear();
        nodeExecutionState.clear();
        processedEvents.clear();
    }

    return {connectionStatus, isConnected};
}