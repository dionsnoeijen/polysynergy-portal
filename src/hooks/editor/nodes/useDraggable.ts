import React, {useCallback, useEffect, useRef} from "react";
import useEditorStore from "@/stores/editorStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useNodesStore from "@/stores/nodesStore";
import {Connection, EditorMode} from "@/types/types";
import {updateConnectionsDirectly} from "@/utils/updateConnectionsDirectly";
import {updateNodesDirectly} from "@/utils/updateNodesDirectly";
import {snapToGrid} from "@/utils/snapToGrid";
import { nodeHistoryActions } from "@/stores/history";

const useDraggable = () => {
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const zoomFactor = useEditorStore((state) => state.getZoomFactorForVersion());
    const setIsDragging = useEditorStore((state) => state.setIsDragging);
    const panPosition = useEditorStore((state) => state.getPanPositionForVersion());
    const editorPosition = useEditorStore((state) => state.editorPosition);
    const isPasting = useEditorStore((state) => state.isPasting);
    const setIsPasting = useEditorStore((state) => state.setIsPasting);

    const getNode = useNodesStore((state) => state.getNode);
    const updateNodePosition = useNodesStore((state) => state.updateNodePosition);
    const openedGroup = useNodesStore((state) => state.openedGroup);

    const findInConnectionsByNodeId = useConnectionsStore((state) => state.findInConnectionsByNodeId);
    const findOutConnectionsByNodeId = useConnectionsStore((state) => state.findOutConnectionsByNodeId);

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

        // Use history-enabled node position updates
        if (updatedNodes.length === 1) {
            // Single node move
            const { id, x, y } = updatedNodes[0];
            nodeHistoryActions.updateNodePositionWithHistory(id, x, y);
        } else if (updatedNodes.length > 1) {
            // Multiple node move - use batch operation
            nodeHistoryActions.moveNodesWithHistory(updatedNodes.map(({ id, x, y }) => ({ nodeId: id, x, y })));
        }

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
        const editorMode = useEditorStore.getState().editorMode;
        if (editorMode !== EditorMode.Select) return;

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