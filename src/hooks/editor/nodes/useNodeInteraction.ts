import { useState, useEffect, useCallback } from "react";
import { useEditorStore } from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import { useConnectionsStore, Connection } from "@/stores/connectionsStore";

type Position = { x: number; y: number };

const useNodeInteraction = () => {
    const {
        selectedNodes,
        setSelectedNodes,
        isDragging,
        setIsDragging,
        zoomFactor,
        activeProjectId,
        activeRouteId
    } = useEditorStore();
    const { getNodes, updateNodePosition } = useNodesStore();
    const { findInConnectionsByNodeId, findOutConnectionsByNodeId, updateConnection } = useConnectionsStore();

    const [dragDelta, setDragDelta] = useState<Position>({ x: 0, y: 0 });
    const [initialConnections, setInitialConnections] = useState<{ [nodeId: string]: { inConnections: Connection[]; outConnections: Connection[] } }>({});

    // Handle mouse down on a specific node
    const handleNodeMouseDown = useCallback((nodeId: string) => {
        setSelectedNodes([nodeId]);
        setIsDragging(true);
    }, [setSelectedNodes, setIsDragging]);

    // Handle drag movement
    const handleDrag = useCallback((moveEvent: MouseEvent) => {
        const deltaX = moveEvent.movementX / zoomFactor;
        const deltaY = moveEvent.movementY / zoomFactor;

        setDragDelta((prevDelta) => ({
            x: prevDelta.x + deltaX,
            y: prevDelta.y + deltaY,
        }));

        selectedNodes.forEach((nodeId) => {
            updateNodePosition(nodeId, deltaX, deltaY, activeProjectId as string, activeRouteId as string);
        });
    }, [selectedNodes, zoomFactor, updateNodePosition, activeProjectId, activeRouteId]);

    // Handle mouse up after dragging
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setDragDelta({ x: 0, y: 0 });

        selectedNodes.forEach((nodeId) => {
            updateNodePosition(nodeId, dragDelta.x, dragDelta.y, activeProjectId as string, activeRouteId as string);
        });

        document.removeEventListener("mousemove", handleDrag);
        document.removeEventListener("mouseup", handleMouseUp);
    }, [selectedNodes, dragDelta, updateNodePosition, activeProjectId, activeRouteId]);

    // Box select logic
    const handleBoxSelect = useCallback((boxCoords) => {
        const { lx, ly, rx, ry } = boxCoords;

        const nodesWithinBox = getNodes(activeProjectId as string, activeRouteId as string).filter((node) => {
            const nodeLeft = node.x;
            const nodeTop = node.y;
            const nodeRight = nodeLeft + node.width;
            const nodeBottom = nodeTop + node.height;

            return (
                nodeRight >= lx &&
                nodeLeft <= rx &&
                nodeBottom >= ly &&
                nodeTop <= ry
            );
        });

        setSelectedNodes(nodesWithinBox.map((node) => node.uuid));
    }, [getNodes, activeProjectId, activeRouteId, setSelectedNodes]);

    // Attach drag listeners only when dragging
    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleDrag);
            document.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            document.removeEventListener("mousemove", handleDrag);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, handleDrag, handleMouseUp]);

    return { handleNodeMouseDown, handleBoxSelect };
};

export default useNodeInteraction;
