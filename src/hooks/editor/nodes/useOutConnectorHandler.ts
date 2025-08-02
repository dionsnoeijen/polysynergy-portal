import React, { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { globalToLocal } from '@/utils/positionUtils';
import { updateConnectionsDirectly } from '@/utils/updateConnectionsDirectly';
import useConnectionsStore from '@/stores/connectionsStore';
import useEditorStore from '@/stores/editorStore';
import useNodesStore from '@/stores/nodesStore';
import { useConnectorVisualFeedback } from './useConnectorVisualFeedback';
import { useConnectionTypeValidation } from './useConnectionTypeValidation';

export const useOutConnectorHandler = (
    nodeId: string,
    isGroup: boolean = false,
    isIn: boolean = false
) => {
    const getConnection = useConnectionsStore((state) => state.getConnection);
    const addConnection = useConnectionsStore((state) => state.addConnection);
    const removeConnectionById = useConnectionsStore((state) => state.removeConnectionById);
    const updateConnection = useConnectionsStore((state) => state.updateConnection);
    const setIsDrawingConnection = useEditorStore((state) => state.setIsDrawingConnection);
    const openedGroup = useNodesStore((state) => state.openedGroup);

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
                    connection.targetHandle = targetHandle;
                    connection.targetNodeId = targetNodeId;
                    connection.isInGroup = openedGroup as string;
                    
                    if (nodeGroupTarget && targetGroupId && groupId) {
                        connection.sourceGroupId = groupId;
                        connection.targetGroupId = targetGroupId;
                    }
                    if (!nodeGroupTarget && groupId) {
                        connection.sourceGroupId = groupId;
                    }
                    if (targetGroupId && groupId === null) {
                        connection.targetGroupId = targetGroupId;
                    }
                    
                    const updatedConnection = updateConnectionsDirectly([connection]);
                    updatedConnection.forEach((upd) => {
                        updateConnection({ ...connection, ...upd });
                    });
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