import {useMemo} from 'react';
import {Node} from '@/types/types';
import useEditorStore from '@/stores/editorStore';
import useNodesStore from '@/stores/nodesStore';
import useGrouping from '@/hooks/editor/nodes/useGrouping';
import useNodeMouseDown from '@/hooks/editor/nodes/useNodeMouseDown';

export const useGroupInteractions = (
    node: Node,
    groupId: string | null,
    selectedNodes: string[],
    nodeToMoveToGroupId: string | null,
    preview: boolean = false
) => {
    // PERFORMANCE: Convert store subscriptions to callbacks with getState()
    // These are only called on user interactions, not during render
    const openContextMenu = useMemo(
        () => (x: number, y: number, items: any[]) =>
            useEditorStore.getState().openContextMenu(x, y, items),
        []
    );

    const setNodeToMoveToGroupId = useMemo(
        () => (id: string) => useEditorStore.getState().setNodeToMoveToGroupId(id),
        []
    );

    const toggleNodeViewCollapsedState = useMemo(
        () => (nodeId: string) => useNodesStore.getState().toggleNodeViewCollapsedState(nodeId),
        []
    );

    const {openGroup, deleteGroup, removeNodeFromGroup, moveNodeToGroup} = useGrouping();
    const {handleNodeMouseDown} = useNodeMouseDown(node);

    return useMemo(() => {
        const handleContextMenu = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const contextMenuItems = [
                {label: "Open Group", action: () => openGroup(node.id)},
                {label: "Delete Group", action: () => deleteGroup(node.id)},
            ];

            if (groupId && selectedNodes.length === 1) {
                contextMenuItems.unshift({
                    label: "Remove From Group",
                    action: () => removeNodeFromGroup(groupId, node.id)
                });
            }

            if (!nodeToMoveToGroupId && selectedNodes.length === 1) {
                contextMenuItems.unshift({
                    label: "Move To group",
                    action: () => setNodeToMoveToGroupId(node.id)
                });
            }

            openContextMenu(e.clientX, e.clientY, contextMenuItems);
        };

        const handleCollapse = () => {
            toggleNodeViewCollapsedState(node.id);
        };

        const handleMouseDown = (e: React.MouseEvent) => {
            if (preview) return;
            if (nodeToMoveToGroupId && nodeToMoveToGroupId !== node.id) {
                moveNodeToGroup(nodeToMoveToGroupId, node.id);
            } else {
                handleNodeMouseDown(e);
            }
        };

        const handleDoubleClick = () => {
            if (node.view.collapsed) {
                handleCollapse();
            } else {
                openGroup(node.id);
            }
        };

        // Use stable no-op function to avoid re-renders
        const noOp = () => {};

        return {
            onContextMenu: preview ? noOp : handleContextMenu,
            onMouseDown: handleMouseDown,
            onCollapse: handleCollapse,
            onDoubleClick: handleDoubleClick
        };
    }, [
        openContextMenu,
        openGroup,
        deleteGroup,
        removeNodeFromGroup,
        moveNodeToGroup,
        setNodeToMoveToGroupId,
        toggleNodeViewCollapsedState,
        handleNodeMouseDown,
        node.id,
        node.view.collapsed,
        groupId,
        selectedNodes.length,
        nodeToMoveToGroupId,
        preview
    ]);
};