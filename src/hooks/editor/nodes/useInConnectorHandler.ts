import React from 'react';
import { globalToLocal } from '@/utils/positionUtils';
import { updateConnectionsDirectly } from '@/utils/updateConnectionsDirectly';
import { FlowState, NodeEnabledConnector } from '@/types/types';
import useConnectionsStore from '@/stores/connectionsStore';
import useEditorStore from '@/stores/editorStore';
import useNodesStore from '@/stores/nodesStore';
import { useConnectorVisualFeedback } from './useConnectorVisualFeedback';
import { useTargetResolver } from './useTargetResolver';

export const useInConnectorHandler = (nodeId: string) => {
    const getConnection = useConnectionsStore((state) => state.getConnection);
    const removeConnectionById = useConnectionsStore((state) => state.removeConnectionById);
    const findInConnectionsByNodeIdAndHandle = useConnectionsStore((state) => state.findInConnectionsByNodeIdAndHandle);
    const updateConnection = useConnectionsStore((state) => state.updateConnection);
    const setIsDrawingConnection = useEditorStore((state) => state.setIsDrawingConnection);
    const setNodeFlowState = useNodesStore((state) => state.setNodeFlowState);

    const { dimConnectors, undimConnectors, setActiveVariableType } = useConnectorVisualFeedback();
    const { resolveTargetMeta } = useTargetResolver();

    const handleMouseDownOnInConnector = (e: React.MouseEvent) => {
        e.stopPropagation();

        const handle = (e.currentTarget as HTMLElement).getAttribute("data-handle") as string;
        const groupId = (e.currentTarget as HTMLElement).getAttribute("data-group-id") as string;

        const id = groupId ?? nodeId;
        const existingConnections = findInConnectionsByNodeIdAndHandle(id, handle as string);

        if (existingConnections.length === 0) {
            return;
        }

        const existingConnection = existingConnections[0];
        if (existingConnection.targetHandle === NodeEnabledConnector.Node) {
            if (existingConnection.targetNodeId) {
                setNodeFlowState(existingConnection.targetNodeId, FlowState.Enabled);
            }
        }

        const variableType = (e.currentTarget as HTMLElement).getAttribute('data-variable-type');
        setActiveVariableType(variableType);
        dimConnectors();

        const updatedConnection = {
            ...existingConnection,
            targetNodeId: undefined,
            targetHandle: undefined,
        };
        updateConnection(updatedConnection);
        setIsDrawingConnection(existingConnection.id);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const position = globalToLocal(moveEvent.clientX, moveEvent.clientY);
            updateConnectionsDirectly([existingConnection], position);
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);

            const target = (upEvent.target as HTMLElement).closest('[data-type="in"]') as HTMLElement;

            undimConnectors();

            if (target) {
                const connection = getConnection(existingConnection.id);
                if (!connection) return;

                const { targetNodeId, targetHandle, targetGroupId } = resolveTargetMeta(target);

                if (targetNodeId === connection.sourceNodeId) {
                    removeConnectionById(connection.id);
                    setIsDrawingConnection("");
                    return;
                }

                Object.assign(connection, {
                    targetNodeId,
                    targetHandle,
                    targetGroupId,
                });

                const updatedConnection = updateConnectionsDirectly([connection]);
                updatedConnection.forEach((upd) => {
                    updateConnection({ ...connection, ...upd });
                });
            } else {
                removeConnectionById(existingConnection.id);
            }

            setIsDrawingConnection("");
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    return {
        handleMouseDownOnInConnector
    };
};