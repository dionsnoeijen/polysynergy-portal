import { useEffect, useCallback, useRef } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useConnectionsStore } from "@/stores/connectionsStore";
import useNodesStore, { Node } from "@/stores/nodesStore";

const repulsionStrength = 10;

const useDraggable = ({ collisionThreshold = 150 }: { collisionThreshold?: number }) => {
    const { selectedNodes, zoomFactor, setIsDragging } = useEditorStore();
    const { updateNodePosition, getNodes } = useNodesStore();
    const { findInConnectionsByNodeId, findOutConnectionsByNodeId, updateConnection } = useConnectionsStore();

    const selectedNodesRef = useRef<string[]>(selectedNodes);

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

    const cascadeRepulsion = useCallback(
        (node: Node, allNodes: Node[], visited: Set<string>) => {
            visited.add(node.id);

            const radiusX = node.view.width / 2 + collisionThreshold;
            const radiusY = node.view.height / 2 + collisionThreshold;

            allNodes.forEach((otherNode) => {
                if (visited.has(otherNode.id) || otherNode.id === node.id) return;

                const dx = otherNode.view.x - node.view.x;
                const dy = otherNode.view.y - node.view.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;

                const isOverlapping =
                    distance < Math.max(radiusX, radiusY) &&
                    distance > 0;

                if (isOverlapping) {
                    const repulsionX = (dx / distance) * repulsionStrength;
                    const repulsionY = (dy / distance) * repulsionStrength;

                    updateNodePosition(otherNode.id, repulsionX, repulsionY);
                    updateConnectionPositions(otherNode.id, repulsionX, repulsionY);

                    cascadeRepulsion(otherNode, allNodes, visited);
                }
            });
        },
        [collisionThreshold, updateNodePosition, updateConnectionPositions]
    );

    const calculateRepulsion = useCallback(
        (draggedNode: Node, deltaX: number, deltaY: number) => {
            const allNodes = getNodes();
            const updatedDraggedNode = {
                ...draggedNode,
                x: draggedNode.view.x + deltaX,
                y: draggedNode.view.y + deltaY,
            };

            const radiusX = updatedDraggedNode.view.width / 2 + collisionThreshold;
            const radiusY = updatedDraggedNode.view.height / 2 + collisionThreshold;

            allNodes.forEach((otherNode) => {
                if (
                    draggedNode.id === otherNode.id ||
                    selectedNodesRef.current.includes(otherNode.id)
                ) {
                    return;
                }

                const dx = otherNode.view.x - updatedDraggedNode.view.x;
                const dy = otherNode.view.y - updatedDraggedNode.view.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;

                const isTouching = distance < Math.max(radiusX, radiusY);

                if (isTouching) {
                    const repulsionX = (dx / distance) * repulsionStrength;
                    const repulsionY = (dy / distance) * repulsionStrength;

                    updateNodePosition(otherNode.id, repulsionX, repulsionY);
                    updateConnectionPositions(otherNode.id, repulsionX, repulsionY);

                    cascadeRepulsion(otherNode, allNodes, new Set([draggedNode.id]));
                }
            });
        },
        [collisionThreshold, getNodes, updateNodePosition, updateConnectionPositions, cascadeRepulsion]
    );

    const onDragMouseDown = useCallback(() => {
        setIsDragging(true);

        const handleDraggableMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.movementX / zoomFactor;
            const deltaY = moveEvent.movementY / zoomFactor;

            selectedNodesRef.current.forEach((nodeId) => {
                const draggedNode = getNodes().find((node) => node.id === nodeId);
                if (!draggedNode) return;

                updateNodePosition(nodeId, deltaX, deltaY);
                updateConnectionPositions(nodeId, deltaX, deltaY);

                calculateRepulsion(draggedNode, deltaX, deltaY);
            });
        };

        const handleDraggableMouseUp = () => {
            setIsDragging(false);

            document.removeEventListener("mousemove", handleDraggableMouseMove);
            document.removeEventListener("mouseup", handleDraggableMouseUp);
        };

        document.addEventListener("mousemove", handleDraggableMouseMove);
        document.addEventListener("mouseup", handleDraggableMouseUp);
    }, [setIsDragging, zoomFactor, getNodes, updateNodePosition, updateConnectionPositions, calculateRepulsion]);

    return { onDragMouseDown };
};

export default useDraggable;
