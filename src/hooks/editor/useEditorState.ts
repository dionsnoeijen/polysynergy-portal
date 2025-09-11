import { useEffect, useMemo, useState } from 'react';
import useEditorStore from '@/stores/editorStore';
import useConnectionsStore from '@/stores/connectionsStore';
import useNodesStore from '@/stores/nodesStore';
import { updateConnectionsDirectly } from '@/utils/updateConnectionsDirectly';
import { useSmartWebSocketListener } from './nodes/useSmartWebSocketListener';
import { EditorMode } from '@/types/types';
import clsx from 'clsx';

export const useEditorState = (isMouseDown?: boolean) => {
    const [isInteracted, setIsInteracted] = useState(false);

    // Store selectors
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const setSelectedNodes = useEditorStore((state) => state.setSelectedNodes);
    const deleteNodesDialogOpen = useEditorStore((state) => state.deleteNodesDialogOpen);
    const nodeToMoveToGroupId = useEditorStore((state) => state.nodeToMoveToGroupId);
    const isDraft = useEditorStore((state) => state.isDraft);
    const editorMode = useEditorStore((state) => state.editorMode);
    const isFormOpen = useEditorStore((state) => state.isFormOpen);
    const activeVersionId = useEditorStore(state => state.activeVersionId);
    const isExecuting = useEditorStore((state) => state.isExecuting);
    const chatMode = useEditorStore((state) => state.chatMode);

    const getNodesToRender = useNodesStore((state) => state.getNodesToRender);
    const getOpenGroups = useNodesStore((state) => state.getOpenGroups);
    const nodes = useNodesStore((state) => state.nodes);

    const connections = useConnectionsStore((state) => state.connections);

    // Derived state
    const nodesToRender = useMemo(() => getNodesToRender(), [getNodesToRender, nodes]);
    const openGroups = useMemo(() => getOpenGroups(), [getOpenGroups, nodes]);

    // WebSocket connection
    const { connectionStatus, isConnected } = useSmartWebSocketListener(activeVersionId as string);

    // Dynamic cursor class
    const cursorClass = useMemo(() => {
        if (nodeToMoveToGroupId) return "cursor-crosshair";
        if (editorMode === EditorMode.Pan && isMouseDown) return "cursor-grabbing";
        if (editorMode === EditorMode.Pan) return "cursor-grab";
        return "cursor-default";
    }, [nodeToMoveToGroupId, editorMode, isMouseDown]);

    // Main container class
    const containerClass = useMemo(() => clsx(
        "relative w-full h-full rounded-md",
        isFormOpen() ? 'overflow-scroll' : 'overflow-hidden',
        cursorClass
    ), [isFormOpen, cursorClass]);

    // Clear node selections when execution starts
    useEffect(() => {
        if (isExecuting && selectedNodes.length > 0) {
            setSelectedNodes([]);
        }
    }, [isExecuting, selectedNodes.length, setSelectedNodes]);

    // Update connections when nodes change
    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            updateConnectionsDirectly(connections);
        });
        return () => cancelAnimationFrame(frame);
    }, [nodesToRender, connections]);

    return {
        // State
        isInteracted,
        setIsInteracted,
        selectedNodes,
        deleteNodesDialogOpen,
        nodeToMoveToGroupId,
        isDraft,
        editorMode,
        activeVersionId,
        isExecuting,
        chatMode,

        // Derived state
        nodesToRender,
        openGroups,
        connections,
        connectionStatus,
        isConnected,

        // Classes
        containerClass
    };
};