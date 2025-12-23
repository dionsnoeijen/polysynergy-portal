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

    // PERFORMANCE: Only subscribe to state that needs reactive updates
    // Keep subscriptions for values used in render or that trigger visual changes
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const deleteNodesDialogOpen = useEditorStore((state) => state.deleteNodesDialogOpen);
    const deleteConnectionDialogOpen = useEditorStore((state) => state.deleteConnectionDialogOpen);
    const selectedConnectionId = useEditorStore((state) => state.selectedConnectionId);
    const nodeToMoveToGroupId = useEditorStore((state) => state.nodeToMoveToGroupId);
    const isDraft = useEditorStore((state) => state.isDraft);
    const editorMode = useEditorStore((state) => state.editorMode);
    const activeVersionId = useEditorStore(state => state.activeVersionId);
    const isExecuting = useEditorStore((state) => state.isExecuting);
    const chatMode = useEditorStore((state) => state.chatMode);

    // PERFORMANCE: Convert functions to callbacks with getState()
    const setSelectedNodes = useMemo(
        () => (nodes: string[]) => useEditorStore.getState().setSelectedNodes(nodes),
        []
    );
    const isFormOpen = useMemo(
        () => () => useEditorStore.getState().isFormOpen(),
        []
    );

    const connections = useConnectionsStore((state) => state.connections);

    // PERFORMANCE: Subscribe to nodes to trigger re-render when nodes are added/removed
    // We need this subscription for reactive updates when nodes change
    const nodes = useNodesStore((state) => state.nodes);

    // PERFORMANCE: Use getters with nodes as dependency to recalculate when nodes change
    const nodesToRender = useMemo(() =>
        useNodesStore.getState().getNodesToRender(),
        [nodes]
    );
    const openGroups = useMemo(() =>
        useNodesStore.getState().getOpenGroups(),
        [nodes]
    );

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
        "relative w-full h-full",
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
    // Triple RAF: Gives browser time to fully settle composite layers after re-renders
    // This fixes iframe nodes causing connection positions to jump when selecting nodes
    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    updateConnectionsDirectly(connections);
                });
            });
        });
        return () => cancelAnimationFrame(frame);
    }, [nodesToRender, connections]);

    return {
        // State
        isInteracted,
        setIsInteracted,
        selectedNodes,
        deleteNodesDialogOpen,
        deleteConnectionDialogOpen,
        selectedConnectionId,
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