import React, { useRef } from "react";
import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { useEditorStore } from "@/stores/editorStore";
import { useConnectionsStore } from "@/stores/connectionsStore";
import useNodesStore from "@/stores/nodesStore";
import { v4 as uuidv4 } from "uuid";
import { calculateConnectorPosition } from "@/utils/positionUtils";
import { InOut } from "@/types/types";

type ConnectorProps = {
    nodeUuid: string;
    handle?: string;
    isGroup?: boolean;
} & (
    | { in: true; out?: never }
    | { out: true; in?: never }
    );

const Connector: React.FC<ConnectorProps> = ({
                                                 nodeUuid,
                                                 handle,
                                                 in: isIn,
                                                 out: isOut,
                                                 isGroup = false,
                                             }): React.ReactElement => {
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
        onInConnectionAddedCallback,
        onOutConnectionAddedCallback,
        onInConnectionRemovedCallback,
        onOutConnectionRemovedCallback,
    } = useEditorStore();
    const { updateConnections, removeConnectionFromNode } = useNodesStore();

    const startedFromGroup = useRef(false);

    const handleMouseDownOnInConnector = (e: React.MouseEvent) => {
        e.stopPropagation();

        const existingConnections = findInConnectionsByNodeIdAndHandle(
            nodeUuid,
            handle as string
        );

        if (existingConnections.length === 0) {
            return;
        }

        const existingConnection = existingConnections[0];

        // Remove the connection ID from the target node's in_connections
        removeConnectionFromNode(
            existingConnection.id,
            nodeUuid,
            handle as string,
            InOut.In
        );

        // Clear the connection's targetNodeUuid and targetHandle
        const updatedConnection = {
            ...existingConnection,
            targetNodeUuid: undefined,
            targetHandle: undefined,
        };
        updateConnection(updatedConnection);

        // Calculate initial position
        const { x, y } = calculateConnectorPosition(
            e.currentTarget as HTMLElement,
            editorPosition,
            panPosition,
            zoomFactor
        );

        setMousePosition({ x, y });

        // Set the drawing connection
        setIsDrawingConnection(existingConnection.id);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const newX =
                (moveEvent.clientX - editorPosition.x - panPosition.x) / zoomFactor;
            const newY =
                (moveEvent.clientY - editorPosition.y - panPosition.y) / zoomFactor;
            setMousePosition({ x: newX, y: newY });

            // Update the connection's end coordinates
            updateConnectionEnd(existingConnection.id, newX, newY);
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);

            const target = (upEvent.target as HTMLElement).closest(
                '[data-type="in"]'
            ) as HTMLElement;

            if (target) {
                const targetNodeUuid = target.getAttribute("data-node-uuid") as string;
                const targetHandle = target.getAttribute("data-handle") as string;

                const { x, y } = calculateConnectorPosition(
                    target,
                    editorPosition,
                    panPosition,
                    zoomFactor
                );

                // Update the connection's end point and target
                updateConnectionEnd(
                    existingConnection.id,
                    x,
                    y,
                    targetNodeUuid,
                    targetHandle
                );

                const connection = getConnection(existingConnection.id);
                if (connection) {
                    // Update the nodes store with the new connection
                    updateConnections({
                        connectionId: existingConnection.id,
                        sourceNodeUuid: connection.sourceNodeUuid,
                        sourceHandle: connection.sourceHandle,
                        targetNodeUuid: targetNodeUuid,
                        targetHandle: targetHandle,
                    });

                    if (onInConnectionAddedCallback) {
                        onInConnectionAddedCallback();
                    }
                } else {
                    removeConnectionById(existingConnection.id);
                    if (isGroup) {
                        if (onOutConnectionRemovedCallback) {
                            onOutConnectionRemovedCallback();
                        }
                    } else {
                        if (onInConnectionRemovedCallback) {
                            onInConnectionRemovedCallback();
                        }
                    }
                }
            } else {
                // Mouse released elsewhere; remove the connection
                removeConnectionById(existingConnection.id);
                if (isGroup) {
                    if (onOutConnectionRemovedCallback) {
                        onOutConnectionRemovedCallback();
                    }
                } else {
                    if (onInConnectionRemovedCallback) {
                        onInConnectionRemovedCallback();
                    }
                }
            }

            setIsDrawingConnection("");
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseDownOnOutConnector = (e: React.MouseEvent) => {
        e.stopPropagation();

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
            sourceNodeUuid: nodeUuid,
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
                const targetIsGroup =
                    target.getAttribute("data-is-group") === "true";
                const targetNodeUuid = target.getAttribute(
                    "data-node-uuid"
                ) as string;
                const targetHandle = target.getAttribute("data-handle") as string;
                const dataNodeType = target.getAttribute("data-type") as InOut;

                const { x, y } = calculateConnectorPosition(
                    target,
                    editorPosition,
                    panPosition,
                    zoomFactor
                );
                updateConnectionEnd(id, x, y, targetNodeUuid, targetHandle);
                const connection = getConnection(id);
                if (connection) {
                    updateConnections({
                        connectionId: id,
                        sourceNodeUuid: connection.sourceNodeUuid,
                        sourceHandle: connection.sourceHandle,
                        targetNodeUuid: targetNodeUuid,
                        targetHandle: targetHandle,
                    });

                    if (startedFromGroup.current || targetIsGroup) {
                        if (
                            dataNodeType === InOut.In &&
                            onInConnectionAddedCallback
                        ) {
                            onInConnectionAddedCallback();
                        } else if (
                            dataNodeType === InOut.Out &&
                            onOutConnectionAddedCallback
                        ) {
                            onOutConnectionAddedCallback();
                        }
                    }
                } else {
                    removeConnectionById(id);
                    if (onOutConnectionRemovedCallback) {
                        onOutConnectionRemovedCallback();
                    }
                }
            } else {
                removeConnectionById(id);
                if (onOutConnectionRemovedCallback) {
                    onOutConnectionRemovedCallback();
                }
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

    return (
        <div
            onMouseDown={handleMouseDown}
            data-type={isIn ? InOut.In : InOut.Out}
            data-node-uuid={nodeUuid}
            data-handle={handle}
            data-is-group={isGroup ? "true" : "false"}
            className={`w-4 h-4 absolute rounded-full top-1/2 -translate-y-1/2 ring-1 ring-white bg-slate-800 cursor-pointer
        ${
                isIn
                    ? isGroup
                        ? "right-0 translate-x-1/2"
                        : "left-0 -translate-x-1/2"
                    : ""
            }
        ${
                isOut
                    ? isGroup
                        ? "left-0 -translate-x-1/2"
                        : "right-0 translate-x-1/2"
                    : ""
            }
      `}
            style={{ zIndex: isOut ? 10 : 5 }}
        >
            <ChevronRightIcon className="w-5 h-5 absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2" />
        </div>
    );
};

export default Connector;
