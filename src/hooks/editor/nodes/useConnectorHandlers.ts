import React, {useRef} from "react";
import {calculateConnectorPosition, globalToLocal} from "@/utils/positionUtils";
import {v4 as uuidv4} from "uuid";
import useConnectionsStore from "@/stores/connectionsStore";
import useEditorStore from "@/stores/editorStore";
import {updateConnectionsDirectly} from "@/utils/updateConnectionsDirectly";
import {FlowState, NodeEnabledConnector} from "@/types/types";
import useNodesStore from "@/stores/nodesStore";

export const useConnectorHandlers = (
    isIn: boolean = false,
    isOut: boolean = false,
    nodeId: string,
    isGroup: boolean = false,
    disabled: boolean = false
) => {
    const {
        getConnection,
        addConnection,
        removeConnectionById,
        findInConnectionsByNodeIdAndHandle,
        updateConnection,
    } = useConnectionsStore();
    const {
        setIsDrawingConnection,
        openGroup,
    } = useEditorStore();
    const {
        setNodeFlowState
    } = useNodesStore();

    const startedFromGroup = useRef(false);
    const activeConnectorVariableTypeRef = useRef<string | null>(null);

    const dimConnectors = () => {
        const activeTypes = Array.isArray(activeConnectorVariableTypeRef.current)
            ? activeConnectorVariableTypeRef.current
            : [activeConnectorVariableTypeRef.current];

        const invalidInConnectors = [...document.querySelectorAll(`[data-type="in"][data-node-id]`)]
            .filter((el) => {
                const nodeTypes = (el.getAttribute("data-variable-type") || "").split(",");
                return !nodeTypes.some(type => activeTypes.includes(type));
            });

        const allOutConnectors = document.querySelectorAll(`[data-type="out"][data-node-id]`);

        allOutConnectors.forEach((connector) => {
            (connector as HTMLElement).style.opacity = '0.5';
        });

        invalidInConnectors.forEach((connector) => {
            (connector as HTMLElement).style.opacity = '0.5';
        });
    };

    const undimCommectors = () => {
        const connectors = document.querySelectorAll(`[data-type="in"], [data-type="out"]`);
        connectors.forEach((connector) => {
            (connector as HTMLElement).style.opacity = "";
        });
    };

    const handleMouseDownOnInConnector = (e: React.MouseEvent) => {
        e.stopPropagation();

        const handle = (e.currentTarget as HTMLElement).getAttribute("data-handle") as string;
        const groupId = (e.currentTarget as HTMLElement).getAttribute("data-group-id") as string;

        const id = groupId ?? nodeId;
        const existingConnections = findInConnectionsByNodeIdAndHandle(
            id,
            handle as string
        );

        if (existingConnections.length === 0) {
            return;
        }

        const existingConnection = existingConnections[0];
        if (existingConnection.targetHandle === NodeEnabledConnector.Node) {
            if (existingConnection.targetNodeId) {
                setNodeFlowState(existingConnection.targetNodeId, FlowState.Enabled);
            }
        }

        activeConnectorVariableTypeRef.current = (e.currentTarget as HTMLElement).getAttribute('data-variable-type');
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

            const target = (upEvent.target as HTMLElement).closest(
                '[data-type="in"]'
            ) as HTMLElement;

            undimCommectors();

            if (target) {
                const targetNodeId = !isGroup ?
                    target.getAttribute("data-node-id") as string :
                    target.getAttribute("data-group-id") as string;
                // Check: target mag niet gelijk zijn aan de source
                if (targetNodeId === existingConnection.sourceNodeId) {
                    removeConnectionById(existingConnection.id);
                    setIsDrawingConnection("");
                    return;
                }
                const targetHandle = target.getAttribute("data-handle") as string;

                const nodeGroupTarget = target.closest('[data-type="closed-group"]');
                const connection = getConnection(existingConnection.id);

                if (connection) {
                    connection.targetHandle = targetHandle;
                    connection.targetNodeId = targetNodeId;
                    if (nodeGroupTarget) {
                        connection.targetGroupId = nodeGroupTarget.getAttribute("data-node-id") as string;
                    }
                    const updatedConnection = updateConnectionsDirectly([connection]);
                    updatedConnection.forEach((upd) => {
                        updateConnection({...connection, ...upd});
                    });
                }
            } else {
                removeConnectionById(existingConnection.id);
            }

            setIsDrawingConnection("");
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseDownOnOutConnector = (e: React.MouseEvent) => {
        e.stopPropagation();

        const handle = (e.currentTarget as HTMLElement)
            .getAttribute("data-handle") as string;

        const groupId = (e.currentTarget as HTMLElement)
            .getAttribute("data-group-id") as string;

        activeConnectorVariableTypeRef.current = (e.currentTarget as HTMLElement).getAttribute('data-variable-type');
        if (activeConnectorVariableTypeRef.current) {
            dimConnectors();
        }

        if (!isGroup && isIn) return;

        startedFromGroup.current = isGroup;

        const {x, y} = calculateConnectorPosition(
            e.currentTarget as HTMLElement,
        );

        const id = uuidv4();
        const connection = addConnection({
            id,
            startX: x,
            startY: y,
            endX: x,
            endY: y,
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

            const target = (upEvent.target as HTMLElement).closest(
                '[data-type="in"], [data-type="out"]'
            ) as HTMLElement;

            undimCommectors();

            if (target) {
                const targetNodeId =
                    target.getAttribute("data-node-id") as string ??
                    target.getAttribute("data-group-id") as string;
                const targetHandle = target.getAttribute("data-handle") as string;
                const targetGroupId = (target as HTMLElement)
                    .getAttribute("data-group-id") as string;

                const connection = getConnection(id);
                if (connection && targetNodeId === connection.sourceNodeId) {
                    removeConnectionById(id);
                    setIsDrawingConnection("");
                    return;
                }
                const nodeGroupTarget = target.closest('[data-type="closed-group"]');

                const variableType = target.getAttribute('data-variable-type');
                if (variableType !== null && activeConnectorVariableTypeRef.current !== null) {
                    const variableTypesArray = variableType.split(",");

                    const activeTypes = Array.isArray(activeConnectorVariableTypeRef.current)
                        ? activeConnectorVariableTypeRef.current
                        : [activeConnectorVariableTypeRef.current];

                    const hasMatch = variableTypesArray.some(type => activeTypes.includes(type));

                    if (!hasMatch) {
                        removeConnectionById(id);
                        activeConnectorVariableTypeRef.current = null;
                        return;
                    }
                }

                if (connection) {
                    connection.targetHandle = targetHandle;
                    connection.targetNodeId = targetNodeId;
                    connection.isInGroup = openGroup as string;
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
                        updateConnection({...connection, ...upd});
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

    const handleMouseDown = (e: React.MouseEvent) => {
        const target = (e.target as HTMLElement).closest(
            '[data-type="in"], [data-type="out"]'
        ) as HTMLElement;
        const enabled = target.getAttribute("data-enabled");
        if (disabled || !enabled) return;
        if ((isIn && !isGroup) || (isOut && isGroup)) {
            handleMouseDownOnInConnector(e);
        } else {
            handleMouseDownOnOutConnector(e);
        }
    };

    return {handleMouseDown};
};