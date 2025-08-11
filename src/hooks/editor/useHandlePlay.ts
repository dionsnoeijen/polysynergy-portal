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
    const isSaving = useEditorStore((state) => state.isSaving);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    return async (e: React.MouseEvent, nodeId: string, subStage: string = 'mock') => {
        e.preventDefault();
        e.stopPropagation();

        if (!activeVersionId) return;

        try {
            // Wait for any pending saves to complete before starting execution
            if (isSaving) {
                setIsExecuting('Saving changes...');
                
                // Poll until saving is complete with timeout protection
                const maxWaitTime = 10000; // 10 seconds max
                const startTime = Date.now();
                
                while (useEditorStore.getState().isSaving && (Date.now() - startTime) < maxWaitTime) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                // If still saving after timeout, log warning but continue
                if (useEditorStore.getState().isSaving) {
                    console.warn('Execution started before save completed - potential race condition');
                }
            }

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