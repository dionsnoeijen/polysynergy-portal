import { useEffect, useCallback, useRef } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useConnectionsStore } from "@/stores/connectionsStore";
import { Node } from "@/types/types";
import useNodesStore from "@/stores/nodesStore";

const repulsionStrength = 0.5;
const attractionStrength = 0.05;

const useDraggable = ({ enableForces = false }: { enableForces?: boolean } = {}) => {
    const { selectedNodes, zoomFactor, setIsDragging } = useEditorStore();
    const { updateNodePositionByDelta, getNodes } = useNodesStore();
    const { findInConnectionsByNodeId, findOutConnectionsByNodeId, updateConnection } = useConnectionsStore();

    const selectedNodesRef = useRef<string[]>(selectedNodes);
    const originalPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

    const getOvalDimensions = useCallback((node: Node) => {
        const margin = 40;
        return {
            x: node.view.x + node.view.width / 2, // Midden van de node in x-richting
            y: node.view.y + node.view.height / 2, // Midden van de node in y-richting
            radiusX: node.view.width / 2 + margin, // Halve breedte + marge
            radiusY: node.view.height / 2 + margin, // Halve hoogte + marge
        };
    }, []);

    useEffect(() => {
        selectedNodesRef.current = selectedNodes;
    }, [selectedNodes]);

    const updateConnectionPositions = useCallback(
        (nodeId: string, deltaX: number, deltaY: number) => {
            const inConnections = findInConnectionsByNodeId(nodeId);
            const outConnections = findOutConnectionsByNodeId(nodeId);

            inConnections.forEach((connection) => {
                updateConnection({
                    ...connection,
                    endX: connection.endX + deltaX,
                    endY: connection.endY + deltaY,
                });
            });

            outConnections.forEach((connection) => {
                updateConnection({
                    ...connection,
                    startX: connection.startX + deltaX,
                    startY: connection.startY + deltaY,
                });
            });
        },
        [findInConnectionsByNodeId, findOutConnectionsByNodeId, updateConnection]
    );

    const applyForces = useCallback(
        (draggedNode: Node, deltaX: number, deltaY: number) => {
            const allNodes = getNodes();
            const updatedDraggedNodeCenter = {
                x: draggedNode.view.x + draggedNode.view.width / 2 + deltaX,
                y: draggedNode.view.y + draggedNode.view.height / 2 + deltaY,
            };

            allNodes.forEach((otherNode) => {
                if (draggedNode.id === otherNode.id || selectedNodesRef.current.includes(otherNode.id)) return;

                const otherNodeCenter = {
                    x: otherNode.view.x + otherNode.view.width / 2,
                    y: otherNode.view.y + otherNode.view.height / 2,
                };

                const dx = otherNodeCenter.x - updatedDraggedNodeCenter.x;
                const dy = otherNodeCenter.y - updatedDraggedNodeCenter.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;

                if (distance < 150) {
                    const force = repulsionStrength / (distance * distance); // Sterker dichterbij
                    const repulsionX = (dx / distance) * force;
                    const repulsionY = (dy / distance) * force;

                    // Forceer minimale afstand (harde grens)
                    const overlapDistance = 150 - distance;
                    if (overlapDistance > 0) {
                        const adjustmentX = (dx / distance) * overlapDistance;
                        const adjustmentY = (dy / distance) * overlapDistance;

                        updateNodePositionByDelta(otherNode.id, adjustmentX, adjustmentY);
                    } else {
                        updateNodePositionByDelta(otherNode.id, repulsionX, repulsionY);
                    }
                } else {
                    // Aantrekkingskracht terug naar originele positie
                    const originalPosition = originalPositions.current.get(otherNode.id);
                    if (originalPosition) {
                        const returnDx = originalPosition.x - otherNode.view.x;
                        const returnDy = originalPosition.y - otherNode.view.y;

                        updateNodePositionByDelta(
                            otherNode.id,
                            returnDx * attractionStrength,
                            returnDy * attractionStrength
                        );
                    }
                }
            });
        },
        [getNodes, updateNodePositionByDelta, selectedNodesRef]
    );

    const onDragMouseDown = useCallback(() => {
        setIsDragging(true);

        // Sla originele posities op bij drag-start
        const allNodes = getNodes();
        allNodes.forEach((node) => {
            originalPositions.current.set(node.id, { x: node.view.x, y: node.view.y });
        });

        const handleDraggableMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.movementX / zoomFactor;
            const deltaY = moveEvent.movementY / zoomFactor;

            selectedNodesRef.current.forEach((nodeId) => {
                const draggedNode = getNodes().find((node) => node.id === nodeId);
                if (!draggedNode) return;

                updateNodePositionByDelta(nodeId, deltaX, deltaY);
                updateConnectionPositions(nodeId, deltaX, deltaY);

                if (enableForces) {
                    applyForces(draggedNode, deltaX, deltaY);
                }
            });
        };

        const handleDraggableMouseUp = () => {
            setIsDragging(false);

            document.removeEventListener("mousemove", handleDraggableMouseMove);
            document.removeEventListener("mouseup", handleDraggableMouseUp);

            // Bevries alle node-posities
            originalPositions.current.clear();
        };

        document.addEventListener("mousemove", handleDraggableMouseMove);
        document.addEventListener("mouseup", handleDraggableMouseUp);
    }, [setIsDragging, zoomFactor, getNodes, updateNodePositionByDelta, updateConnectionPositions, applyForces, enableForces]);

    return { onDragMouseDown, getOvalDimensions };
};

export default useDraggable;
