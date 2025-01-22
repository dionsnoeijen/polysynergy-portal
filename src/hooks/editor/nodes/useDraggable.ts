import React, { useEffect, useCallback, useRef } from "react";
import useEditorStore from "@/stores/editorStore";
import useConnectionsStore from "@/stores/connectionsStore";
import {Connection} from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import { updateConnectionsDirectly } from "@/utils/updateConnectionsDirectly";
import { updateNodesDirectly } from "@/utils/updateNodesDirectly";

const useDraggable = () => {
    const { selectedNodes, zoomFactor, setIsDragging, openGroup, panPosition, editorPosition } = useEditorStore();
    const { getNode, updateNodePosition } = useNodesStore();
    const { findInConnectionsByNodeId, findOutConnectionsByNodeId, updateConnection, getConnection } = useConnectionsStore();

    const selectedNodesRef = useRef<string[]>(selectedNodes);
    const initialPositionsRef = useRef<{ [key: string]: { x: number; y: number } }>({});

    useEffect(() => {
        selectedNodesRef.current = selectedNodes;
    }, [selectedNodes]);

    const collectConnections = useCallback(() => {
        const allConnections: Array<Connection> = [];

        selectedNodesRef.current.forEach((nodeId) => {
            const inConnections = findInConnectionsByNodeId(nodeId, true);
            const outConnections = findOutConnectionsByNodeId(nodeId, true);

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

            updateNodesDirectly(selectedNodesRef.current, deltaX, deltaY, initialPositionsRef.current);

            const allConnections = collectConnections();

            updateConnectionsDirectly(
                allConnections
            );
        },
        // eslint-disable-next-line
        [zoomFactor, collectConnections, editorPosition, panPosition]
    );

    const handleDraggableMouseUp = useCallback(() => {
        setIsDragging(false);

        const allConnections = collectConnections();

        const updatedConnections = updateConnectionsDirectly(
            allConnections
        );

        selectedNodesRef.current.forEach((nodeId) => {
            updateNodePosition(
                nodeId,
                initialPositionsRef.current[nodeId].x,
                initialPositionsRef.current[nodeId].y
            );
        });

        updatedConnections.forEach((connection) => {
            const existingConnection = getConnection(connection.id);
            if (existingConnection) {
                updateConnection({ ...existingConnection, ...connection });
            }
        });

        document.removeEventListener("mousemove", handleDraggableMouseMove);
        document.removeEventListener("mouseup", handleDraggableMouseUp);
    }, [setIsDragging, collectConnections, handleDraggableMouseMove, updateNodePosition, getConnection, updateConnection]);

    const onDragMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);

        const jitNodeId = e.currentTarget.getAttribute("data-node-id");

        // Selected nodes might not be updated in time to include the
        // node that was immediately dragged on mouseDown. In that case
        // add it here manually.
        if (jitNodeId && !selectedNodesRef.current.includes(jitNodeId)) {
            selectedNodesRef.current.push(jitNodeId);
        }

        initialPositionsRef.current = {};
        selectedNodesRef.current.forEach((nodeId) => {
            const node = getNode(nodeId);
            if (node) {
                initialPositionsRef.current[nodeId] = { x: node.view.x, y: node.view.y };
            }
        });

        document.addEventListener("mousemove", handleDraggableMouseMove);
        document.addEventListener("mouseup", handleDraggableMouseUp);
    }, [setIsDragging, handleDraggableMouseMove, handleDraggableMouseUp, getNode]);

    return { onDragMouseDown };
};

export default useDraggable;
