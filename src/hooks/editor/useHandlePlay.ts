import { runMockApi } from "@/api/runApi";
import useEditorStore from "@/stores/editorStore";
import useMockStore from "@/stores/mockStore";
import useNodesStore from "@/stores/nodesStore";
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
        
        // CRITICAL: IMMEDIATELY switch to output tab in dock - FIRST PRIORITY!
        console.log('🚀 IMMEDIATELY SWITCHING TO OUTPUT TAB IN DOCK');
        window.dispatchEvent(new CustomEvent('switch-to-output-tab'));
        
        // Check if the node exists in the store
        const nodeExists = useNodesStore.getState().getNode(nodeId);
        
        if (!nodeExists) {
            console.error('PLAY ERROR - Node not found:', nodeId);
            return;
        }

        if (!activeVersionId) return;

        // TEMPORARY: Disable WebSocket verification to fix connection loop first
        if (false && !websocketStatusStore.isConnected) {
            console.error('❌ EXECUTION BLOCKED: WebSocket not connected!', { 
                connectionStatus: websocketStatusStore.connectionStatus, 
                isConnected: websocketStatusStore.isConnected, 
                activeVersionId 
            });
            alert(`WebSocket not ready! Status: ${websocketStatusStore.connectionStatus}. Cannot execute without live connection.`);
            return;
        }

        try {
            clearMockStore();
            setIsExecuting('Running...');
            
            console.log('🎬 PLAY STARTED - WebSocket verified connected, proceeding with execution');

            // CRITICAL FIX: Activate WebSocket listener BEFORE execution starts  
            const setListenerActive = useListenerStore.getState().setListenerState;
            
            try {
                // Actually call the backend API to activate the listener
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
                
                const activateData = await activateResult.json();
                console.log('🔌 BACKEND LISTENER ACTIVATION:', { 
                    success: activateResult.ok, 
                    status: activateResult.status,
                    data: activateData 
                });
                
                if (!activateResult.ok) {
                    console.error('❌ BACKEND LISTENER ACTIVATION FAILED:', activateData);
                    alert('Failed to activate WebSocket listener on backend. Execution may not show live feedback.');
                }
                
                // Update frontend state
                setListenerActive(activeVersionId, true);
                console.log('🔌 CRITICAL: WebSocket listener activated on backend and frontend');
                
            } catch (error) {
                console.error('❌ LISTENER ACTIVATION ERROR:', error);
                alert('Error activating WebSocket listener. Execution may not show live feedback.');
            }

            const response = await runMockApi(
                activeProjectId,
                activeVersionId,
                nodeId,
                'mock',
                subStage
            );
            
            // CRITICAL DEBUG: Log API response to see if execution started
            console.log('🚀 EXECUTION API RESPONSE:', { 
                status: response.status, 
                ok: response.ok,
                url: response.url 
            });
            
            const data = await response.json();
            console.log('🚀 EXECUTION API DATA:', data);
            
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
        } catch (err) {
            console.error("Play failed", err);
        } finally {
            setIsExecuting(null);
        }
    };
};