import {useEffect} from 'react';
import useNodesStore from "@/stores/nodesStore";
import useMockStore, {MockNode} from '@/stores/mockStore';
import {getConnectionExecutionDetails, getNodeExecutionDetails} from "@/api/executionApi";
import useEditorStore from "@/stores/editorStore";
import useChatStore from '@/stores/chatStore';
import { NodeVariable } from "@/types/types";
import config from "@/config";
import { useSmartWebSocket } from '@/hooks/editor/useSmartWebSocket';
import { getIdToken } from "@/api/auth/authToken";
import { shouldUpdateVariableFromExecution, getUpdatableVariableHandles } from '@/utils/imageNodeUtils';

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
    const getNode = useNodesStore((state) => state.getNode);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);
    const addOrUpdateMockNode = useMockStore((state) => state.addOrUpdateMockNode);
    const setMockConnections = useMockStore((state) => state.setMockConnections);
    const setHasMockData = useMockStore((state) => state.setHasMockData);
    const setMockResultForNode = useMockStore((state) => state.setMockResultForNode);
    const addAgentMessage = useChatStore((state) => state.addAgentMessage);
    const fireRunCompleted = useChatStore((state) => state.fireRunCompleted);

    const websocketUrl = flowId ? `${config.WEBSOCKET_URL}/execution/${flowId}` : '';

    const { 
        connectionStatus, 
        isConnected, 
        onMessage 
    } = useSmartWebSocket(websocketUrl, {
        enabled: !!flowId,
        autoConnect: true,
        heartbeatInterval: 30000, // 30 seconds
        pingTimeout: 5000,       // 5 seconds
        maxReconnectAttempts: 10,
        maxBackoffDelay: 30000   // 30 seconds max delay
    });

    useEffect(() => {
        if (!flowId) return;

        cleanupExecutionGlow();

        const unsubscribe = onMessage((event) => {
            const message: ExecutionMessage = JSON.parse(event.data);
            const eventType = message.event;
            let node_id = message.node_id;

            if ((
                message.event === 'RunResponseContent' ||
                message.event === 'TeamRunResponseContent') && message.content) {
                const {run_id, content, sequence_id, microtime} = message;
                if (!run_id) return;

                // Removed excessive chunk logging - was causing console spam
                
                // Add the message with enhanced ordering info
                addAgentMessage(content, run_id, node_id, sequence_id, microtime);
                
                // Sort messages to maintain order
                useChatStore.getState().sortMessages(run_id);
            }

            if (message.event === 'TeamToolCallCompleted') {
                console.log(message);
            }

            if (eventType === 'run_start') {
                cleanupExecutionGlow();
                useChatStore.getState().setActiveRunId(message.run_id as string);
                // Don't clear the chat store - keep existing messages visible
                return;
            }

            if (eventType === 'start_tool') {
                console.log(`Tool started: ${node_id}`);
                const toolEl = document.querySelector(`[data-node-id="${node_id}"]`);
                console.log(`Tool el: ${toolEl}`);
                if (toolEl) toolEl.classList.add('executing-tool');
            }

            if (eventType === 'end_tool') {
                console.log(`Tool ended: ${node_id}`);
                setTimeout(() => {
                    const toolEl = document.querySelector(`[data-node-id="${node_id}"]`);
                    if (toolEl) {
                        toolEl.classList.remove('executing-tool');
                    }
                }, 5000);
            }

            if (eventType === 'run_end') {
                // Fire run completion event for chat history reload
                if (message.run_id) {
                    console.log(`Firing run completion event for run: ${message.run_id}`);
                    fireRunCompleted(message.run_id);
                }
                
                setTimeout(async () => {
                    const executingEls = document.querySelectorAll('[data-node-id].executing');
                    executingEls.forEach((el) => {
                        el.classList.remove('executing', 'executed-success', 'executed-killed');
                    });
                    groupStates.clear();
                    nodeExecutionState.clear();

                    const activeVersionId = useEditorStore.getState().activeVersionId;
                    
                    // Get connection data
                    const data = await getConnectionExecutionDetails(
                        activeVersionId as string,
                        message.run_id as string
                    );
                    setMockConnections(data);
                    setHasMockData(true);
                    
                    // Store the final mock nodes state for perfect recreation
                    const currentMockNodes = useMockStore.getState().mockNodes;
                    if (currentMockNodes.length > 0) {
                        try {
                            const activeProjectId = useEditorStore.getState().activeProjectId;
                            
                            // Fix the mock nodes state for proper visual recreation
                            const fixedMockNodes = currentMockNodes.map(node => ({
                                ...node,
                                started: true, // Ensure all completed nodes show as started for visual states
                            }));
                            
                            // Call API to store mock nodes state
                            // const response = 
                            await fetch(`${config.LOCAL_API_URL}/execution/${activeVersionId}/${message.run_id}/mock-nodes/?project_id=${activeProjectId}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${getIdToken()}`,
                                },
                                body: JSON.stringify({ mock_nodes: fixedMockNodes })
                            });
                        } catch (error) {
                            console.error('Failed to store mock nodes state:', error);
                        }
                    }
                }, 100);
                return;
            }

            if (!node_id || !message.run_id) return;

            let el = document.querySelector(`[data-node-id="${node_id}"]`) as HTMLElement;
            const nodeFlowNode = getNode(node_id);
            const type = typeof nodeFlowNode?.path === 'undefined'
                ? 'GroupNode'
                : nodeFlowNode?.path.split(".").pop();

            if (eventType === 'start_node' || eventType === 'end_node') {
                // Check if we're currently viewing a historical run to avoid interference
                const isViewingHistoricalRun = useEditorStore.getState().isViewingHistoricalRun;
                const selectedRunId = useEditorStore.getState().selectedRunId;
                
                // Only process if not viewing historical AND this event is for the currently selected run
                if (!isViewingHistoricalRun && (!selectedRunId || message.run_id === selectedRunId)) {
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
                }
            }

            // Group fallback - also protect from historical run interference
            if (!el) {
                // Check if we're currently viewing a historical run to avoid interference
                const isViewingHistoricalRun = useEditorStore.getState().isViewingHistoricalRun;
                const selectedRunId = useEditorStore.getState().selectedRunId;
                
                // Only process group fallback if not viewing historical AND this event is for current run
                if (!isViewingHistoricalRun && (!selectedRunId || message.run_id === selectedRunId)) {
                    const groupInfo = useNodesStore.getState().findNearestVisibleGroupWithCount?.(node_id);
                    if (!groupInfo) return;

                    node_id = groupInfo.groupId;
                    el = document.querySelector(`[data-node-id="${node_id}"]`) as HTMLElement;
                    if (!el) return;

                    const {groupId, count} = groupInfo;
                    const current = groupStates.get(groupId) || {count, remaining: 0};

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
                }
                return;
            }

            // Individual node - only apply visual changes if not viewing historical run
            const isViewingHistoricalRun = useEditorStore.getState().isViewingHistoricalRun;
            const selectedRunId = useEditorStore.getState().selectedRunId;
            
            // Only apply visual changes if not viewing historical AND this event is for current run
            if (!isViewingHistoricalRun && (!selectedRunId || message.run_id === selectedRunId)) {
                const state = nodeExecutionState.get(node_id) || {started: false, ended: false};

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
            }
            
            // Fetch and sync execution results for this node
            if (message.status === 'success' && message.run_id) {
                const activeVersionId = useEditorStore.getState().activeVersionId;
                if (activeVersionId) {
                    getNodeExecutionDetails(
                        activeVersionId,
                        message.run_id,
                        node_id,
                        message.order || 0,
                        'mock',
                        'mock'
                    ).then(executeResult => {
                        setMockResultForNode(node_id, executeResult);
                        
                        // Selective sync: only sync execution results for image nodes and image-type variables
                        // This prevents type errors like "Can't configure: 'values' existing type is: str, not a dict!"
                        if (executeResult?.variables) {
                            const currentNode = getNode(node_id);
                            if (currentNode) {
                                // Get list of variable handles that should be updated (only image variables in image nodes)
                                const updatableHandles = getUpdatableVariableHandles(currentNode, executeResult.variables);
                                
                                if (updatableHandles.length > 0) {
                                    console.log(`Found ${updatableHandles.length} image variable(s) to update for image node ${node_id}:`, updatableHandles);
                                    
                                    // Only update variables that are meant to hold image data
                                    updatableHandles.forEach(variableHandle => {
                                        const value = executeResult.variables[variableHandle];
                                        const variable = currentNode.variables.find(v => v.handle === variableHandle);
                                        
                                        if (variable && shouldUpdateVariableFromExecution(currentNode, variable, value)) {
                                            console.log(`Updating image variable '${variableHandle}' with image data for node ${node_id}`);
                                            updateNodeVariable(node_id, variableHandle, value as string | number | boolean | string[] | NodeVariable[] | null);
                                        }
                                    });
                                } else {
                                    console.log(`No image variables to update for node ${node_id} (${currentNode.path || currentNode.category || 'unknown'})`);
                                }
                            } else {
                                console.warn(`Node ${node_id} not found when trying to update variables from execution results`);
                            }
                        }
                    }).catch(err => {
                        console.error(`Failed to fetch execution details for node ${node_id}:`, err);
                    });
                }
            }
        });

        return () => {
            unsubscribe();
            groupStates.clear();
            nodeExecutionState.clear();
            cleanupExecutionGlow();
        };
    }, [flowId, onMessage, getNode, updateNodeVariable, addOrUpdateMockNode, setMockConnections, setHasMockData, setMockResultForNode, addAgentMessage, fireRunCompleted]);

    function cleanupExecutionGlow() {
        const elements = document.querySelectorAll('[data-node-id]');
        elements.forEach((el) => {
            el.classList.remove('executing');
            el.classList.remove('executing-tool');
            el.classList.forEach((cls) => {
                if (cls.startsWith('executed-')) el.classList.remove(cls);
            });
        });
        groupStates.clear();
        nodeExecutionState.clear();
    }

    return {
        connectionStatus,
        isConnected
    };
}