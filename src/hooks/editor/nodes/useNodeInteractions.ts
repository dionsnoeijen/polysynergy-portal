import {useMemo} from 'react';
import {Node} from '@/types/types';
import useNodesStore from '@/stores/nodesStore';
import useNodeMouseDown from '@/hooks/editor/nodes/useNodeMouseDown';
import useNodeContextMenu from '@/hooks/editor/nodes/useNodeContextMenu';

export const useNodeInteractions = (node: Node, isNodeInService: boolean, preview: boolean = false) => {
    const toggleNodeViewCollapsedState = useNodesStore((state) => state.toggleNodeViewCollapsedState);
    
    const {handleNodeMouseDown} = useNodeMouseDown(node, isNodeInService);
    const {handleContextMenu} = useNodeContextMenu(node);

    return useMemo(() => {
        const handleCollapse = () => {
            toggleNodeViewCollapsedState(node.id);
        };

        // Use stable no-op function to avoid re-renders
        const noOp = () => {};

        return {
            onContextMenu: preview ? noOp : handleContextMenu,
            onMouseDown: preview ? noOp : handleNodeMouseDown,
            onCollapse: handleCollapse
        };
    }, [handleContextMenu, handleNodeMouseDown, toggleNodeViewCollapsedState, node.id, preview]);
};