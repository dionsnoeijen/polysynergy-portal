import React, { useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { globalToLocal } from '@/utils/positionUtils';
import { updateConnectionsDirectly } from '@/utils/updateConnectionsDirectly';
import useConnectionsStore from '@/stores/connectionsStore';
import useEditorStore from '@/stores/editorStore';
import useNodesStore from '@/stores/nodesStore';
import { useConnectorVisualFeedback } from './useConnectorVisualFeedback';
import { useConnectionTypeValidation } from './useConnectionTypeValidation';
import { connectionHistoryActions } from '@/stores/history';

export const useOutConnectorHandler = (
    nodeId: string,
    isGroup: boolean = false,
    isIn: boolean = false
) => {
    // PERFORMANCE: Use getState() pattern to avoid store subscriptions
    const getConnection = useCallback((id: string) => useConnectionsStore.getState().getConnection(id), []);
    const addConnection = useCallback((connection: any) => useConnectionsStore.getState().addConnection(connection), []);
    const removeConnectionById = useCallback((id: string) => useConnectionsStore.getState().removeConnectionById(id), []);
    const setIsDrawingConnection = useCallback((id: string) => useEditorStore.getState().setIsDrawingConnection(id), []);
    const getOpenedGroup = useCallback(() => useNodesStore.getState().openedGroup, []);

    const startedFromGroup = useRef(false);
    const { dimConnectors, undimConnectors, setActiveVariableType, getActiveVariableType, animateConnector } = useConnectorVisualFeedback();
    const { validateVariableTypeMatch } = useConnectionTypeValidation();

    const handleMouseDownOnOutConnector = (e: React.MouseEvent) => {
        e.stopPropagation();

        const handle = (e.currentTarget as HTMLElement).getAttribute("data-handle") as string;
        const groupId = (e.currentTarget as HTMLElement).getAttribute("data-group-id") as string;

        const variableType = (e.currentTarget as HTMLElement).getAttribute('data-variable-type');
        setActiveVariableType(variableType);
        if (variableType) {
            dimConnectors();
        }

        if (!isGroup && isIn) return;

        startedFromGroup.current = isGroup;

        const id = uuidv4();
        const connection = addConnection({
            id,
            sourceNodeId: nodeId,
            sourceHandle: handle as string,
        });

        if (!connection) return;

        setIsDrawingConnection(connection.id);
        const position = globalToLocal(e.clientX, e.clientY);
        updateConnectionsDirectly([connection], position);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const position = globalToLocal(moveEvent.clientX, moveEvent.clientY);
            updateConnectionsDirectly([connection], position);
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);

            const target = (upEvent.target as HTMLElement).closest('[data-type="in"], [data-type="out"]') as HTMLElement;

            undimConnectors();

            if (target) {
                const targetNodeId = target.getAttribute("data-node-id") as string ?? target.getAttribute("data-group-id") as string;
                const targetHandle = target.getAttribute("data-handle") as string;
                const targetGroupId = (target as HTMLElement).getAttribute("data-group-id") as string;

                const connection = getConnection(id);
                if (connection && targetNodeId === connection.sourceNodeId) {
                    removeConnectionById(id);
                    setIsDrawingConnection("");
                    return;
                }

                const nodeGroupTarget = target.closest('[data-type="closed-group"]');

                const targetVariableType = target.getAttribute('data-variable-type');
                const activeVariableType = getActiveVariableType();

                if (!validateVariableTypeMatch(targetVariableType, activeVariableType)) {
                    removeConnectionById(id);
                    setActiveVariableType(null);
                    return;
                }

                if (targetHandle === "collapsed") {
                    removeConnectionById(id);
                    setIsDrawingConnection("");
                    return;
                }

                animateConnector(target);

                if (connection) {
                    // First, remove the temporary connection
                    removeConnectionById(id);

                    // Create the final connection with all properties
                    const finalConnection = {
                        ...connection,
                        targetHandle: targetHandle,
                        targetNodeId: targetNodeId,
                        isInGroup: getOpenedGroup() as string,
                        sourceGroupId: (nodeGroupTarget && targetGroupId && groupId) ? groupId :
                                      (!nodeGroupTarget && groupId) ? groupId :
                                      (targetGroupId && groupId === null) ? undefined : connection.sourceGroupId,
                        targetGroupId: (nodeGroupTarget && targetGroupId && groupId) ? targetGroupId :
                                      (targetGroupId && groupId === null) ? targetGroupId : connection.targetGroupId
                    };

                    // Add the final connection with history
                    connectionHistoryActions.addConnectionWithHistory(finalConnection);
                }
            } else {
                removeConnectionById(id);
            }

            setIsDrawingConnection("");
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    return {
        handleMouseDownOnOutConnector
    };
};