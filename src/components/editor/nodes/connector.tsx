import React, { useRef, useEffect } from "react";
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

const Connector: React.FC<ConnectorProps> = ({ nodeUuid, handle, in: isIn, out: isOut, isGroup = false }): React.ReactElement => {
    const {
        getConnection,
        addConnection,
        updateConnectionEnd,
        removeConnectionById
    } = useConnectionsStore();
    const {
        setIsDrawingConnection,
        setMousePosition,
        zoomFactor,
        panPosition,
        editorPosition,
        onInConnectionAddedCallback,
        onOutConnectionAddedCallback
    } = useEditorStore();
    const {
        updateConnections
    } = useNodesStore();

    const startedFromGroup = useRef(false);

    const handleMouseDown = (e: React.MouseEvent) => {
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
            const newX = (moveEvent.clientX - editorPosition.x - panPosition.x) / zoomFactor;
            const newY = (moveEvent.clientY - editorPosition.y - panPosition.y) / zoomFactor;
            setMousePosition({ x: newX, y: newY });
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);

            const target = (upEvent.target as HTMLElement).closest('[data-type]') as HTMLElement;

            if (target) {
                const targetIsGroup = target.getAttribute('data-is-group') === 'true';
                const targetNodeUuid = target.getAttribute('data-node-uuid') as string;
                const targetHandle = target.getAttribute('data-handle') as string;
                const dataNodeType = target.getAttribute('data-type') as InOut;

                // Unified connection logic for both in and out connectors
                const { x, y } = calculateConnectorPosition(target, editorPosition, panPosition, zoomFactor);
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

                    console.log('Started From Group:', startedFromGroup.current, 'Target Is Group:', targetIsGroup);

                    // Handle connection added callbacks based on origin and target
                    if (startedFromGroup.current || targetIsGroup) {
                        if (dataNodeType === InOut.In && onInConnectionAddedCallback) {
                            onInConnectionAddedCallback();
                        } else if (dataNodeType === InOut.Out && onOutConnectionAddedCallback) {
                            onOutConnectionAddedCallback();
                        }
                    }
                } else {
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

    return (
        <div
            onMouseDown={handleMouseDown}
            data-type={isIn ? InOut.In : InOut.Out}
            data-node-uuid={nodeUuid}
            data-handle={handle}
            data-is-group={isGroup ? 'true' : 'false'}
            className={`w-4 h-4 absolute rounded-full top-1/2 -translate-y-1/2 ring-1 ring-white bg-slate-800 cursor-pointer
                ${isIn ? (isGroup ? "right-0 translate-x-1/2" : "left-0 -translate-x-1/2") : ""}
                ${isOut ? (isGroup ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2") : ""}
            `}
            style={{ zIndex: isOut ? 10 : 5 }}
        >
            <ChevronRightIcon className="w-5 h-5 absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2" />
        </div>
    );
};

export default Connector;
