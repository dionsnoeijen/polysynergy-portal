import React from "react";
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
} & (
    | { in: true; out?: never }
    | { out: true; in?: never }
    );

const Connector: React.FC<ConnectorProps> = ({ nodeUuid, handle, in: isIn, out: isOut }): React.ReactElement => {
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
    } = useEditorStore();
    const {
        updateConnections
    } = useNodesStore();

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isIn) return;

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
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);

            const target = (upEvent.target as HTMLElement).closest('[data-type="in"]') as HTMLElement;
            if (target) {
                const { x, y } = calculateConnectorPosition(target, editorPosition, panPosition, zoomFactor);
                const targetNodeUuid = target.getAttribute("data-node-uuid") as string;
                const targetHandle = target.getAttribute("data-handle") as string;

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
                }
            } else {
                removeConnectionById(id);
            }

            setIsDrawingConnection("");
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            data-type={isIn ? InOut.In : InOut.Out}
            data-node-uuid={nodeUuid}
            data-handle={handle}
            className={`w-4 h-4 absolute rounded-full top-1/2 -translate-y-1/2 ring-1 ring-white bg-slate-800 cursor-pointer
                ${isIn ? "left-0 -translate-x-1/2" : ""}
                ${isOut ? "right-0 translate-x-1/2" : ""}
            `}
        >
            <ChevronRightIcon className="w-5 h-5 absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2" />
        </div>
    );
};

export default Connector;
