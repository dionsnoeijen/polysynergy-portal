import React, { useEffect, useCallback, useRef } from "react";
import useEditorStore from "@/stores/editorStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useNodesStore from "@/stores/nodesStore";
import { Connection } from "@/types/types";
import { updateConnectionsDirectly } from "@/utils/updateConnectionsDirectly";
import { updateNodesDirectly } from "@/utils/updateNodesDirectly";
import { snapToGrid } from "@/utils/snapToGrid";

const useDraggable = () => {
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const zoomFactor = useEditorStore((state) => state.zoomFactor);
    const setIsDragging = useEditorStore((state) => state.setIsDragging);
    const panPosition = useEditorStore((state) => state.panPosition);
    const editorPosition = useEditorStore((state) => state.editorPosition);
    const isPasting = useEditorStore((state) => state.isPasting);
    const setIsPasting = useEditorStore((state) => state.setIsPasting);

    const { getNode, updateNodePosition, openedGroup } = useNodesStore();
    const { findInConnectionsByNodeId, findOutConnectionsByNodeId } = useConnectionsStore();

    const selectedNodesRef = useRef<string[]>(selectedNodes);
    const initialPositionsRef = useRef<{ [key: string]: { x: number; y: number } }>({});
    const isPastingRef = useRef<boolean>(isPasting);
    const lastMouseDownTimeRef = useRef<number>(0);
    const isDoubleClickRef = useRef<boolean>(false);

    useEffect(() => {
        selectedNodesRef.current = selectedNodes;
        isPastingRef.current = isPasting;
    }, [selectedNodes, isPasting]);

    const collectConnections = useCallback(() => {
        const allConnections: Array<Connection> = [];
        selectedNodesRef.current.forEach((nodeId) => {
            const inConnections = findInConnectionsByNodeId(nodeId, true);
            const outConnections = findOutConnectionsByNodeId(nodeId, true);
            allConnections.push(...inConnections, ...outConnections);
        });
        if (openedGroup) {
            const groupInConnections = findInConnectionsByNodeId(openedGroup);
            const groupOutConnections = findOutConnectionsByNodeId(openedGroup);
            allConnections.push(...groupInConnections, ...groupOutConnections);
        }
        return allConnections;
    // eslint-disable-next-line
    }, [findInConnectionsByNodeId, findOutConnectionsByNodeId, openedGroup]);

    const handleDraggableMouseMove = useCallback(
        (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.movementX / zoomFactor;
            const deltaY = moveEvent.movementY / zoomFactor;

            updateNodesDirectly(
                selectedNodesRef.current,
                deltaX,
                deltaY,
                initialPositionsRef.current
            );

            const allConnections = collectConnections();
            updateConnectionsDirectly(allConnections);
        },
        // eslint-disable-next-line
        [zoomFactor, collectConnections, editorPosition, panPosition]
    );

    const handleDraggableMouseUp = useCallback(() => {
        setIsDragging(false);
        if (isPastingRef.current) {
            setIsPasting(false);
        }

        if (isDoubleClickRef.current) {
            isDoubleClickRef.current = false;
            document.removeEventListener("mousemove", handleDraggableMouseMove);
            document.removeEventListener("mouseup", handleDraggableMouseUp);
            return;
        }

        const updatedNodes = selectedNodesRef.current.map((nodeId) => {
            const x = snapToGrid(initialPositionsRef.current[nodeId].x);
            const y = snapToGrid(initialPositionsRef.current[nodeId].y);
            return { id: nodeId, x, y };
        });

        updatedNodes.forEach(({ id, x, y }) => {
            updateNodePosition(id, x, y);
        });

        updateNodesDirectly(
            updatedNodes.map(n => n.id),
            0,
            0,
            Object.fromEntries(updatedNodes.map(n => [n.id, { x: n.x, y: n.y }]))
        );

        document.removeEventListener("mousemove", handleDraggableMouseMove);
        document.removeEventListener("mouseup", handleDraggableMouseUp);
    // eslint-disable-next-line
    }, [setIsDragging, handleDraggableMouseMove, updateNodePosition, setIsPasting]);

    const onDragMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.currentTarget.getAttribute('data-adding') === 'true') return;

        const currentTime = Date.now();
        const timeSinceLastClick = currentTime - lastMouseDownTimeRef.current;
        lastMouseDownTimeRef.current = currentTime;

        if (timeSinceLastClick < 300) {
            isDoubleClickRef.current = true;
            return;
        }

        isDoubleClickRef.current = false;
        setIsDragging(true);
        if (isPastingRef.current) return;

        const jitNodeId = e.currentTarget.getAttribute("data-node-id");
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
    // eslint-disable-next-line
    }, [setIsDragging, handleDraggableMouseMove, handleDraggableMouseUp, getNode]);

    const startDraggingAfterPaste = useCallback((
        pastedNodeIds: string[]
    ) => {
        setIsDragging(true);

        selectedNodesRef.current = [...pastedNodeIds];

        initialPositionsRef.current = {};
        pastedNodeIds.forEach((nodeId) => {
            const node = getNode(nodeId);
            if (node) {
                initialPositionsRef.current[nodeId] = { x: node.view.x, y: node.view.y };
            }
        });

        document.addEventListener("mousemove", handleDraggableMouseMove);
        document.addEventListener("mouseup", handleDraggableMouseUp);
    // eslint-disable-next-line
    }, [setIsDragging, handleDraggableMouseMove, handleDraggableMouseUp, getNode, editorPosition, panPosition, zoomFactor, updateNodePosition]);

    return { onDragMouseDown, startDraggingAfterPaste };
};

export default useDraggable;