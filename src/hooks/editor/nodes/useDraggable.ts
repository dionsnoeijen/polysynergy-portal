import { useEffect, useCallback, useRef } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useConnectionsStore } from "@/stores/connectionsStore";
import useNodesStore from "@/stores/nodesStore";
import { updateConnectionsDirectly } from "@/utils/updateConnectionsDirectly";

const useDraggable = () => {
    const { selectedNodes, zoomFactor, setIsDragging, openGroup, panPosition, editorPosition } = useEditorStore();
    const { updateNodePositionByDelta, getNodes } = useNodesStore();
    const { findInConnectionsByNodeId, findOutConnectionsByNodeId, updateConnection, getConnection } = useConnectionsStore();

    // Refs voor geselecteerde nodes en lokale posities
    const selectedNodesRef = useRef<string[]>(selectedNodes);
    const localPositions = useRef<Map<string, { startX?: number; startY?: number; endX?: number; endY?: number }>>(new Map());

    useEffect(() => {
        selectedNodesRef.current = selectedNodes;
    }, [selectedNodes]);

    // Hulpfunctie om connections te updaten met groepsinformatie
    const getUpdatedConnections = useCallback(
        (connections: Array<any>, groupConnections: Array<any>, isOut: boolean) =>
            connections.map((connection) => ({
                ...connection,
                handle: isOut ? connection.targetHandle : connection.sourceHandle,
                node: isOut ? connection.targetNodeId : connection.sourceNodeId,
                isGroupConnection: groupConnections.some((groupConn) => groupConn.id === connection.id),
            })),
        []
    );

    // Mouse move handler
    const handleDraggableMouseMove = useCallback(
        (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.movementX / zoomFactor;
            const deltaY = moveEvent.movementY / zoomFactor;

            selectedNodesRef.current.forEach((nodeId) => {
                const draggedNode = getNodes().find((node) => node.id === nodeId);
                if (!draggedNode) return;

                // Update node-positie
                updateNodePositionByDelta(nodeId, deltaX, deltaY);

                // Haal connections op
                const inConnections = findInConnectionsByNodeId(nodeId);
                const outConnections = findOutConnectionsByNodeId(nodeId);
                const groupInConnections = findInConnectionsByNodeId(openGroup as string);
                const groupOutConnections = findOutConnectionsByNodeId(openGroup as string);

                // Update connections met groepsinformatie
                const updatedInConnections = getUpdatedConnections(inConnections, groupOutConnections, false);
                const updatedOutConnections = getUpdatedConnections(outConnections, groupInConnections, true);

                // Pas wijzigingen direct toe
                updateConnectionsDirectly(
                    updatedInConnections,
                    updatedOutConnections,
                    deltaX,
                    deltaY,
                    localPositions.current,
                    editorPosition,
                    panPosition,
                    zoomFactor
                );
            });
        },
        [
            zoomFactor,
            getNodes,
            updateNodePositionByDelta,
            findInConnectionsByNodeId,
            findOutConnectionsByNodeId,
            openGroup,
            getUpdatedConnections,
            editorPosition,
            panPosition,
        ]
    );

    // Mouse up handler
    const handleDraggableMouseUp = useCallback(() => {
        setIsDragging(false);

        const allUpdatedConnections: Array<{
            id: string;
            startX?: number;
            startY?: number;
            endX?: number;
            endY?: number;
        }> = [];

        selectedNodesRef.current.forEach((nodeId) => {
            const inConnections = findInConnectionsByNodeId(nodeId);
            const outConnections = findOutConnectionsByNodeId(nodeId);
            const groupInConnections = findInConnectionsByNodeId(openGroup as string);
            const groupOutConnections = findOutConnectionsByNodeId(openGroup as string);

            // Update connections met groepsinformatie
            const updatedInConnections = getUpdatedConnections(inConnections, groupOutConnections, false);
            const updatedOutConnections = getUpdatedConnections(outConnections, groupInConnections, true);

            // Verzamel updates
            const updatedConnections = updateConnectionsDirectly(
                updatedInConnections,
                updatedOutConnections,
                0, // Geen delta bij mouse up
                0,
                localPositions.current,
                editorPosition,
                panPosition,
                zoomFactor
            );

            allUpdatedConnections.push(...updatedConnections);
        });

        // Werk store bij
        allUpdatedConnections.forEach((connection) => {
            const existingConnection = getConnection(connection.id);
            if (existingConnection) {
                updateConnection({ ...existingConnection, ...connection });
            }
        });

        // Opruimen
        document.removeEventListener("mousemove", handleDraggableMouseMove);
        document.removeEventListener("mouseup", handleDraggableMouseUp);

        localPositions.current.clear();
    }, [
        setIsDragging,
        handleDraggableMouseMove,
        findInConnectionsByNodeId,
        findOutConnectionsByNodeId,
        getConnection,
        updateConnection,
        getUpdatedConnections,
        editorPosition,
        panPosition,
        zoomFactor,
        openGroup,
    ]);

    // Mouse down handler
    const onDragMouseDown = useCallback(() => {
        setIsDragging(true);

        selectedNodesRef.current.forEach((nodeId) => {
            const inConnections = findInConnectionsByNodeId(nodeId);
            const outConnections = findOutConnectionsByNodeId(nodeId);

            inConnections.concat(outConnections).forEach((connection) => {
                localPositions.current.set(connection.id, {
                    startX: connection.startX,
                    startY: connection.startY,
                    endX: connection.endX,
                    endY: connection.endY,
                });
            });
        });

        document.addEventListener("mousemove", handleDraggableMouseMove);
        document.addEventListener("mouseup", handleDraggableMouseUp);
    }, [setIsDragging, handleDraggableMouseMove, handleDraggableMouseUp, findInConnectionsByNodeId, findOutConnectionsByNodeId]);

    return { onDragMouseDown };
};

export default useDraggable;
