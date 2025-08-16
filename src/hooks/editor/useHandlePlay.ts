import { runMockApi } from "@/api/runApi";
import useEditorStore from "@/stores/editorStore";
import useMockStore from "@/stores/mockStore";
import useNodesStore from "@/stores/nodesStore";
import { NodeVariable } from "@/types/types";
import React from "react";
import {getNodeExecutionDetails} from "@/api/executionApi";
import useListenerStore from "@/stores/listenerStore";

export const useHandlePlay = () => {
    const setMockResultForNode = useMockStore((state) => state.setMockResultForNode);
    const clearMockStore = useMockStore((state) => state.clearMockStore);
    const activeVersionId = useEditorStore((state) => state.activeVersionId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const setIsExecuting = useEditorStore((state) => state.setIsExecuting);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    return async (e: React.MouseEvent, nodeId: string, subStage: string = 'mock') => {
        e.preventDefault();
        e.stopPropagation();

        if (!activeVersionId) return;

        try {
            clearMockStore();
            setIsExecuting('Running...');

            const response = await runMockApi(
                activeProjectId,
                activeVersionId,
                nodeId,
                'mock',
                subStage
            );
            const setListenerActive =
                useListenerStore.getState().setListenerState;
            setListenerActive(activeVersionId, true);
            const data = await response.json();
            
            // Handle error responses where result might be undefined
            if (!data.result) {
                console.error('Execution failed:', data);
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