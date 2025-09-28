import { runMockApi, startExecutionApi } from "@/api/runApi";
import useEditorStore from "@/stores/editorStore";
import useMockStore from "@/stores/mockStore";
import useNodesStore from "@/stores/nodesStore";
import { useRunsStore } from "@/stores/runsStore";
// import { NodeVariable } from "@/types/types";
import React from "react";
import {getNodeExecutionDetails} from "@/api/executionApi";
import useListenerStore from "@/stores/listenerStore";
import config from "@/config";
import { getIdToken } from "@/api/auth/authToken";

// Create a WebSocket status store to share status across hooks
const websocketStatusStore = {
    isConnected: false,
    connectionStatus: 'disconnected',
    updateStatus: (isConnected: boolean, connectionStatus: string) => {
        websocketStatusStore.isConnected = isConnected;
        websocketStatusStore.connectionStatus = connectionStatus;
    }
};

// Export the status store so WebSocket listener can update it
export { websocketStatusStore };

export const useHandlePlay = () => {
    const setMockResultForNode = useMockStore((state) => state.setMockResultForNode);
    const clearMockStore = useMockStore((state) => state.clearMockStore);
    const activeVersionId = useEditorStore((state) => state.activeVersionId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const setIsExecuting = useEditorStore((state) => state.setIsExecuting);
    // const setBottomBarView = useEditorStore((state) => state.setBottomBarView);
    // const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    return async (e: React.MouseEvent, nodeId: string, subStage: string = 'mock') => {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('switch-to-output-tab'));
        
        // Check if the node exists in the store
        const nodeExists = useNodesStore.getState().getNode(nodeId);
        
        if (!nodeExists) {
            console.error('PLAY ERROR - Node not found:', nodeId);
            return;
        }

        if (!activeVersionId) return;

        // TEMPORARY: Disable WebSocket verification to fix connection loop first
        if (!websocketStatusStore.isConnected) {
            alert(`WebSocket not ready! Status: ${websocketStatusStore.connectionStatus}. Cannot execute without live connection.`);
        }

        // Declare flag at function scope so finally block can access it
        let useFireAndForget = false;
        
        try {
            clearMockStore();
            console.log('🔒 [useHandlePlay] Setting isExecuting to Running...');
            setIsExecuting('Running...');

            const setListenerActive = useListenerStore.getState().setListenerState;
            
            try {
                const activateResult = await fetch(
                    `${config.LOCAL_API_URL}/listeners/${activeVersionId}/activate/`,
                    {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${getIdToken()}`,
                        },
                    }
                );
                
                await activateResult.json();
                if (!activateResult.ok) {
                    alert('Failed to activate WebSocket listener on backend. Execution may not show live feedback.');
                }
                
                // Update frontend state
                setListenerActive(activeVersionId, true);
                
            } catch (error) {
                console.log(error);
                alert('Error activating WebSocket listener. Execution may not show live feedback.');
            }

            // Try new fire-and-forget API first
            try {
                console.log('🚀 Attempting new fire-and-forget execution...');
                console.log('🔍 [DEBUG] Execution params:', {
                    activeProjectId,
                    activeVersionId,
                    nodeId,
                    stage: 'mock',
                    subStage
                });

                const executionResult = await startExecutionApi(
                    activeProjectId,
                    activeVersionId,
                    nodeId,
                    'mock',
                    subStage
                );

                console.log('🚀 EXECUTION STARTED (fire-and-forget):', executionResult);
                console.log('🔍 [DEBUG] Execution result details:', {
                    run_id: executionResult.run_id,
                    status: executionResult.status,
                    fullResult: executionResult
                });
                console.log('✅ Real-time updates will come via WebSocket');
                
                // Store the run_id to track this specific execution
                const runId = executionResult.run_id;
                console.log('🔍 [DEBUG] Processing run_id:', runId);

                if (runId) {
                    // Store run_id in runs store to track the active execution
                    useRunsStore.getState().setActiveRunId(runId);
                    console.log('🔒 Editor locked for run_id:', runId);
                    console.log('🔍 [DEBUG] Active run_id set in store:', useRunsStore.getState().activeRunId);

                    // Add the new run to the runs store
                    const newRun = {
                        run_id: runId,
                        timestamp: new Date().toISOString(),
                        status: 'running' as const,
                        startTime: Date.now(),
                        lastEventTime: Date.now()
                    };
                    useRunsStore.getState().addNewRun(newRun);
                    console.log('🔍 [DEBUG] New run added to store:', newRun);
                }
                
                // Flag that we used fire-and-forget so finally block doesn't clear state
                useFireAndForget = true;
                console.log('🔒 Fire-and-forget successful - editor will stay locked until WebSocket run_end');
                return; // Early return - finally block will check useFireAndForget flag
                
            } catch (startError) {
                console.warn('⚠️ New execution API failed, falling back to blocking method:', startError);
                
                // Fallback to old blocking method
                const response = await runMockApi(
                    activeProjectId,
                    activeVersionId,
                    nodeId,
                    'mock',
                    subStage
                );
                
                const data = await response.json();
                console.log('🚀 EXECUTION API DATA (fallback):', data);
                
                // Handle error responses where result might be undefined
                if (!data.result) {
                    console.error('PLAY ERROR - Execution failed, no result:', data);
                    return;
                }
                
                const result = data.result.body ? JSON.parse(data.result.body) : data.result;

                const lastNode = result.nodes_order[result.nodes_order.length - 1];
                const executeResult = await getNodeExecutionDetails(
                    activeVersionId as string,
                    result.run_id,
                    lastNode.id,
                    lastNode.order,
                    'mock',
                    subStage
                );

                setMockResultForNode(nodeId, executeResult);
            }
        } catch (err) {
            console.error("Play failed", err);
            console.log('🔓 [useHandlePlay] Error - clearing isExecuting');
            setIsExecuting(null);
        } finally {
            // Only clear execution state if we didn't use fire-and-forget
            if (!useFireAndForget) {
                console.log('🔓 [useHandlePlay] Finally block - clearing isExecuting (fallback method only)');
                setIsExecuting(null);
            } else {
                console.log('⏸️ [useHandlePlay] Finally block - NOT clearing isExecuting (fire-and-forget mode)');
            }
        }
    };
};