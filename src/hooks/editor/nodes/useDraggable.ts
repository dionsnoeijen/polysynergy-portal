import { useEffect, useCallback, useRef } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { Connection, useConnectionsStore } from "@/stores/connectionsStore";
import useNodesStore from "@/stores/nodesStore";
import { updateConnectionsDirectly } from "@/utils/updateConnectionsDirectly";

const useDraggable = () => {
    const { selectedNodes, zoomFactor, setIsDragging, openGroup, panPosition, editorPosition } = useEditorStore();
    const { updateNodePositionByDelta, getNodes } = useNodesStore();
    const { findInConnectionsByNodeId, findOutConnectionsByNodeId, updateConnection, getConnection } = useConnectionsStore();

    const selectedNodesRef = useRef<string[]>(selectedNodes);

    useEffect(() => {
        selectedNodesRef.current = selectedNodes;
    }, [selectedNodes]);

    const collectConnections = useCallback(() => {
        const allConnections: Array<Connection> = [];

        selectedNodesRef.current.forEach((nodeId) => {
            const inConnections = findInConnectionsByNodeId(nodeId);
            const outConnections = findOutConnectionsByNodeId(nodeId);

            allConnections.push(...inConnections, ...outConnections);
        });

        if (openGroup) {
            const groupInConnections = findInConnectionsByNodeId(openGroup as string);
            const groupOutConnections = findOutConnectionsByNodeId(openGroup as string);

            allConnections.push(...groupInConnections, ...groupOutConnections);
        }

        return allConnections;
    }, [findInConnectionsByNodeId, findOutConnectionsByNodeId, openGroup]);

    const handleDraggableMouseMove = useCallback(
        (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.movementX / zoomFactor;
            const deltaY = moveEvent.movementY / zoomFactor;

            selectedNodesRef.current.forEach((nodeId) => {
                const draggedNode = getNodes().find((node) => node.id === nodeId);
                if (!draggedNode) return;

                updateNodePositionByDelta(nodeId, deltaX, deltaY);

                const allConnections = collectConnections();

                updateConnectionsDirectly(
                    allConnections
                );
            });
        },
        [zoomFactor, getNodes, updateNodePositionByDelta, collectConnections, editorPosition, panPosition]
    );

    const handleDraggableMouseUp = useCallback(() => {
        setIsDragging(false);

        const allConnections = collectConnections();

        const updatedConnections = updateConnectionsDirectly(
            allConnections
        );

        updatedConnections.forEach((connection) => {
            const existingConnection = getConnection(connection.id);
            if (existingConnection) {
                updateConnection({ ...existingConnection, ...connection });
            }
        });

        document.removeEventListener("mousemove", handleDraggableMouseMove);
        document.removeEventListener("mouseup", handleDraggableMouseUp);
    }, [setIsDragging, handleDraggableMouseMove, collectConnections, getConnection, updateConnection]);

    const onDragMouseDown = useCallback(() => {
        setIsDragging(true);

        document.addEventListener("mousemove", handleDraggableMouseMove);
        document.addEventListener("mouseup", handleDraggableMouseUp);
    }, [setIsDragging, handleDraggableMouseMove, handleDraggableMouseUp]);

    return { onDragMouseDown };
};

export default useDraggable;
