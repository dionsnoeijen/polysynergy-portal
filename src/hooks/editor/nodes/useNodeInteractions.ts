import {useMemo, useCallback} from 'react';
import {Node} from '@/types/types';
import useNodesStore from '@/stores/nodesStore';
import useEditorStore from '@/stores/editorStore';
import useNodeMouseDown from '@/hooks/editor/nodes/useNodeMouseDown';
import useNodeContextMenu from '@/hooks/editor/nodes/useNodeContextMenu';

export const useNodeInteractions = (node: Node, isNodeInService: boolean, preview: boolean = false) => {
    const {handleNodeMouseDown} = useNodeMouseDown(node, isNodeInService);
    const {handleContextMenu} = useNodeContextMenu(node);

    // PERFORMANCE: Wrap handlers to check lock state on-demand at call-time instead of subscribing
    // This prevents 3 subscriptions per node (isExecuting, chatMode, isReadOnly)
    const wrappedContextMenu = useCallback((e: React.MouseEvent) => {
        if (preview) return;

        const { isExecuting, chatMode, isReadOnly } = useEditorStore.getState();
        const isLocked = Boolean(isExecuting) || chatMode || isReadOnly;

        if (!isLocked) {
            handleContextMenu(e);
        }
    }, [preview, handleContextMenu]);

    const wrappedMouseDown = useCallback((e: React.MouseEvent) => {
        if (preview) return;

        const { isExecuting, chatMode, isReadOnly } = useEditorStore.getState();
        const isLocked = Boolean(isExecuting) || chatMode || isReadOnly;

        if (!isLocked) {
            handleNodeMouseDown(e);
        }
    }, [preview, handleNodeMouseDown]);

    const handleCollapse = useCallback(() => {
        useNodesStore.getState().toggleNodeViewCollapsedState(node.id);
    }, [node.id]);

    return useMemo(() => ({
        onContextMenu: wrappedContextMenu,
        onMouseDown: wrappedMouseDown,
        onCollapse: handleCollapse,
    }), [wrappedContextMenu, wrappedMouseDown, handleCollapse]);
};