import {useMemo} from 'react';
import {Node} from '@/types/types';
import useNodesStore from '@/stores/nodesStore';
import useEditorStore from '@/stores/editorStore';
import useNodeMouseDown from '@/hooks/editor/nodes/useNodeMouseDown';
import useNodeContextMenu from '@/hooks/editor/nodes/useNodeContextMenu';

export const useNodeInteractions = (node: Node, isNodeInService: boolean, preview: boolean = false) => {
    const toggleNodeViewCollapsedState = useNodesStore((state) => state.toggleNodeViewCollapsedState);
    const isExecuting = useEditorStore((state) => state.isExecuting);
    const chatMode = useEditorStore((state) => state.chatMode);
    const isReadOnly = useEditorStore((state) => state.isReadOnly);

    const {handleNodeMouseDown} = useNodeMouseDown(node, isNodeInService);
    const {handleContextMenu} = useNodeContextMenu(node);

    // Determine if nodes should be locked (during execution OR in chat mode OR read-only)
    const isLocked = Boolean(isExecuting) || chatMode || isReadOnly;

    return useMemo(() => {
        const handleCollapse = () => {
            toggleNodeViewCollapsedState(node.id);
        };

        // Use stable no-op function to avoid re-renders
        const noOp = () => {};

        return {
            onContextMenu: (preview || isLocked) ? noOp : handleContextMenu,
            onMouseDown: (preview || isLocked) ? noOp : handleNodeMouseDown,
            onCollapse: handleCollapse,
            isLocked
        };
    }, [handleContextMenu, handleNodeMouseDown, toggleNodeViewCollapsedState, node.id, preview, isLocked]);
};