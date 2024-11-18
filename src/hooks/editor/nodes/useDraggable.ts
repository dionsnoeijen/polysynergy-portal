import { useEffect, useCallback, useRef } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useConnectionsStore } from "@/stores/connectionsStore";
import useNodesStore, { Node } from "@/stores/nodesStore";

const collisionThreshold = 150;
const repulsionStrength = 10;

const useDraggable = () => {
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

    const cascadeRepulsion = (node: Node, allNodes: Node[], visited: Set<string>) => {
        visited.add(node.uuid);

        const radiusX = node.width / 2 + collisionThreshold;
        const radiusY = node.height / 2 + collisionThreshold;

        allNodes.forEach((otherNode) => {
            if (visited.has(otherNode.uuid) || otherNode.uuid === node.uuid) return;

            const dx = otherNode.x - node.x;
            const dy = otherNode.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;

            const isOverlapping =
                distance < Math.max(radiusX, radiusY) &&
                distance > 0;

            if (isOverlapping) {
                const repulsionX = (dx / distance) * repulsionStrength;
                const repulsionY = (dy / distance) * repulsionStrength;

                updateNodePosition(otherNode.uuid, repulsionX, repulsionY);
                updateConnectionPositions(otherNode.uuid, repulsionX, repulsionY);

                cascadeRepulsion(otherNode, allNodes, visited);
            }
        });
    };

    const calculateRepulsion = (draggedNode: Node, deltaX: number, deltaY: number) => {
        const allNodes = getNodes();
        const updatedDraggedNode = {
            ...draggedNode,
            x: draggedNode.x + deltaX,
            y: draggedNode.y + deltaY,
        };

        const radiusX = updatedDraggedNode.width / 2 + collisionThreshold;
        const radiusY = updatedDraggedNode.height / 2 + collisionThreshold;

        allNodes.forEach((otherNode) => {
            if (
                draggedNode.uuid === otherNode.uuid ||
                selectedNodesRef.current.includes(otherNode.uuid)
            ) {
                return;
            }

            const dx = otherNode.x - updatedDraggedNode.x;
            const dy = otherNode.y - updatedDraggedNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;

            const isTouching = distance < Math.max(radiusX, radiusY);

            if (isTouching) {
                const repulsionX = (dx / distance) * repulsionStrength;
                const repulsionY = (dy / distance) * repulsionStrength;

                updateNodePosition(otherNode.uuid, repulsionX, repulsionY);
                updateConnectionPositions(otherNode.uuid, repulsionX, repulsionY);

                cascadeRepulsion(otherNode, allNodes, new Set([draggedNode.uuid]));
            }
        });
    };

    const onDragMouseDown = useCallback(() => {
        setIsDragging(true);

        const handleDraggableMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.movementX / zoomFactor;
            const deltaY = moveEvent.movementY / zoomFactor;

            selectedNodesRef.current.forEach((nodeId) => {
                const draggedNode = getNodes().find((node) => node.uuid === nodeId);
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
