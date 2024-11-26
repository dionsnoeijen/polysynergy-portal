import React, { useRef } from "react";
import { calculateConnectorPosition } from "@/utils/positionUtils";
import { v4 as uuidv4 } from "uuid";
import { useConnectionsStore } from "@/stores/connectionsStore";
import { useEditorStore } from "@/stores/editorStore";

export const useConnectorHandlers = (isIn: boolean = false, isOut: boolean = false, nodeId: string, isGroup: boolean = false) => {
    const {
        getConnection,
        addConnection,
        updateConnectionEnd,
        removeConnectionById,
        findInConnectionsByNodeIdAndHandle,
        updateConnection,
    } = useConnectionsStore();
    const {
        setIsDrawingConnection,
        setMousePosition,
        zoomFactor,
        panPosition,
        editorPosition,
    } = useEditorStore();

    const startedFromGroup = useRef(false);

    const handleMouseDownOnInConnector = (e: React.MouseEvent) => {
        e.stopPropagation();

        const handle = (e.currentTarget as HTMLElement).getAttribute("data-handle") as string;

        const existingConnections = findInConnectionsByNodeIdAndHandle(
            nodeId,
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

        const { x, y } = calculateConnectorPosition(
            e.currentTarget as HTMLElement,
            editorPosition,
            panPosition,
            zoomFactor
        );

        setMousePosition({ x, y });

        setIsDrawingConnection(existingConnection.id);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const newX =
                (moveEvent.clientX - editorPosition.x - panPosition.x) / zoomFactor;
            const newY =
                (moveEvent.clientY - editorPosition.y - panPosition.y) / zoomFactor;
            setMousePosition({ x: newX, y: newY });
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

                const { x, y } = calculateConnectorPosition(
                    target,
                    editorPosition,
                    panPosition,
                    zoomFactor
                );

                updateConnectionEnd(
                    existingConnection.id,
                    x,
                    y,
                    targetNodeId,
                    targetHandle
                );

                const connection = getConnection(existingConnection.id);
                if (!connection) {
                    removeConnectionById(existingConnection.id);
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

        const handle = (e.currentTarget as HTMLElement).getAttribute("data-handle") as string;

        if (!isGroup && isIn) return;

        startedFromGroup.current = isGroup;

        const { x, y } = calculateConnectorPosition(
            e.currentTarget as HTMLElement,
            editorPosition,
            panPosition,
            zoomFactor
        );

        setMousePosition({ x, y });

        const id = uuidv4();
        addConnection({
            id,
            startX: x,
            startY: y,
            endX: x,
            endY: y,
            sourceNodeId: nodeId,
            sourceHandle: handle as string,
        });

        setIsDrawingConnection(id);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const newX =
                (moveEvent.clientX - editorPosition.x - panPosition.x) / zoomFactor;
            const newY =
                (moveEvent.clientY - editorPosition.y - panPosition.y) / zoomFactor;
            setMousePosition({ x: newX, y: newY });
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);

            const target = (upEvent.target as HTMLElement).closest(
                '[data-type="in"], [data-type="out"]'
            ) as HTMLElement;

            if (target) {
                const targetNodeId = target.getAttribute("data-node-id") as string ??
                    target.getAttribute("data-group-id") as string;
                const targetHandle = target.getAttribute("data-handle") as string;

                const { x, y } = calculateConnectorPosition(
                    target,
                    editorPosition,
                    panPosition,
                    zoomFactor
                );
                console.log("targetNodeId", targetNodeId, targetHandle);

                updateConnectionEnd(id, x, y, targetNodeId, targetHandle);
                const connection = getConnection(id);
                if (!connection) {
                    removeConnectionById(id);
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
        if ((isIn && !isGroup) || (isOut && isGroup)) {
            handleMouseDownOnInConnector(e);
        } else {
            handleMouseDownOnOutConnector(e);
        }
    };

    return { handleMouseDown };
};
