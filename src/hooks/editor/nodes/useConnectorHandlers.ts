import React, { useRef } from "react";
import { calculateConnectorPosition, globalToLocal } from "@/utils/positionUtils";
import { v4 as uuidv4 } from "uuid";
import { useConnectionsStore } from "@/stores/connectionsStore";
import { useEditorStore } from "@/stores/editorStore";
import { updateConnectionsDirectly } from "@/utils/updateConnectionsDirectly";
import { ConnectionType, InOut } from "@/types/types";

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
        setIsDrawingConnection
    } = useEditorStore();

    const startedFromGroup = useRef(false);

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

            if (target) {
                const targetNodeId = !isGroup ?
                    target.getAttribute("data-node-id") as string :
                    target.getAttribute("data-group-id") as string;
                const targetHandle = target.getAttribute("data-handle") as string;

                const nodeGroupTarget = target.closest('[data-type="closed-group"]');

                const connection = getConnection(existingConnection.id);
                if (connection) {
                    connection.targetHandle = targetHandle;
                    connection.targetNodeId = targetNodeId;
                    if (nodeGroupTarget) {
                        connection.targetGroupId = nodeGroupTarget.getAttribute("data-node-id") as string;
                        connection.connectionType = ConnectionType.NodeToNode;
                    }
                    const updatedConnection = updateConnectionsDirectly([connection]);
                    updatedConnection.forEach((upd) => {
                        updateConnection({ ...connection, ...upd });
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

        const dataType = (e.currentTarget as HTMLElement)
            .getAttribute("data-type") as InOut;

        if (!isGroup && isIn) return;

        startedFromGroup.current = isGroup;

        let connectionType = ConnectionType.NodeToNode;
        if (groupId && dataType === InOut.Out) {
            connectionType = ConnectionType.GroupIn;
        }

        const { x, y } = calculateConnectorPosition(
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
            connectionType: connectionType as ConnectionType,
        });
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

            if (target) {
                const targetNodeId =
                    target.getAttribute("data-node-id") as string ??
                    target.getAttribute("data-group-id") as string;
                const targetHandle = target.getAttribute("data-handle") as string;
                const targetGroupId = (target as HTMLElement)
                    .getAttribute("data-group-id") as string;

                const dataType = (target as HTMLElement)
                    .getAttribute("data-type") as InOut;

                const connection = getConnection(id);

                if (groupId && dataType === InOut.In) {
                    connectionType = ConnectionType.GroupOut;
                }
                const nodeGroupTarget = target.closest('[data-type="closed-group"]');

                console.log(nodeGroupTarget, targetGroupId, groupId);

                if (connection) {
                    connection.targetHandle = targetHandle;
                    connection.targetNodeId = targetNodeId
                    connection.connectionType = connectionType;
                    if (nodeGroupTarget && targetGroupId && groupId) {
                        connection.sourceGroupId = groupId;
                        connection.targetGroupId = targetGroupId;
                        connection.connectionType = ConnectionType.NodeToNode;
                    }
                    if (!nodeGroupTarget && groupId) {
                        connection.sourceGroupId = groupId;
                        connection.connectionType = ConnectionType.NodeToNode;
                    }
                    if (nodeGroupTarget && targetGroupId && groupId === null) {
                        connection.targetGroupId = nodeGroupTarget.getAttribute("data-node-id") as string;
                        connection.connectionType = ConnectionType.NodeToNode;
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

    return { handleMouseDown };
};
