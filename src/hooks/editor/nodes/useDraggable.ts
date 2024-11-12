import { useState, useEffect, useCallback } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useConnectionsStore, Connection } from "@/stores/connectionsStore";
import useNodesStore from "@/stores/nodesStore";

type Position = { x: number; y: number };

const useDraggable = () => {
    const [dragDelta, setDragDelta] = useState<Position>({ x: 0, y: 0 });
    const { selectedNodes, zoomFactor, activeProjectId, activeRouteId, isDragging, setIsDragging } = useEditorStore();
    const { updateNodePosition } = useNodesStore();
    const { findInConnectionsByNodeId, findOutConnectionsByNodeId, updateConnection } = useConnectionsStore();

    const [initialConnections, setInitialConnections] = useState<{
        [nodeId: string]: { inConnections: Connection[]; outConnections: Connection[] };
    }>({});

    const onDragMouseDown = useCallback(() => {
        setIsDragging(true);

        const connections = selectedNodes.reduce((acc, nodeId) => {
            acc[nodeId] = {
                inConnections: findInConnectionsByNodeId(nodeId),
                outConnections: findOutConnectionsByNodeId(nodeId),
            };
            return acc;
        }, {} as { [nodeId: string]: { inConnections: Connection[]; outConnections: Connection[] } });

        setInitialConnections(connections);

        const handleDraggableMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.movementX / zoomFactor;
            const deltaY = moveEvent.movementY / zoomFactor;

            setDragDelta((prevDelta) => ({
                x: prevDelta.x + deltaX,
                y: prevDelta.y + deltaY,
            }));

            // Update the position of each selected node
            selectedNodes.forEach((nodeId) => {
                updateNodePosition(nodeId, deltaX, deltaY, activeProjectId as string, activeRouteId as string);
            });
        };

        const handleDraggableMouseUp = () => {
            setIsDragging(false);
            setDragDelta({ x: 0, y: 0 });

            selectedNodes.forEach((nodeId) => {
                updateNodePosition(nodeId, dragDelta.x, dragDelta.y, activeProjectId as string, activeRouteId as string);
            });

            document.removeEventListener("mousemove", handleDraggableMouseMove);
            document.removeEventListener("mouseup", handleDraggableMouseUp);
        };

        document.addEventListener("mousemove", handleDraggableMouseMove);
        document.addEventListener("mouseup", handleDraggableMouseUp);
    }, [setIsDragging, selectedNodes, findInConnectionsByNodeId, findOutConnectionsByNodeId, zoomFactor, updateNodePosition, activeProjectId, activeRouteId, dragDelta.x, dragDelta.y]);

    useEffect(() => {
        if (!isDragging) return;

        selectedNodes.forEach((nodeId) => {
            const { inConnections, outConnections } = initialConnections[nodeId] || { inConnections: [], outConnections: [] };

            inConnections.forEach((connection) => {
                updateConnection({
                    ...connection,
                    endX: connection.endX + dragDelta.x,
                    endY: connection.endY + dragDelta.y,
                });
            });

            outConnections.forEach((connection) => {
                updateConnection({
                    ...connection,
                    startX: connection.startX + dragDelta.x,
                    startY: connection.startY + dragDelta.y,
                });
            });
        });
    }, [dragDelta, isDragging, initialConnections, selectedNodes, updateConnection]);

    return { onDragMouseDown };
};

export default useDraggable;
