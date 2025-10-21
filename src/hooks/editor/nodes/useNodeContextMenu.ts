import {FormType, Node} from '@/types/types';
import React, { useCallback } from "react";
import useEditorStore from "@/stores/editorStore";
import useGrouping from "@/hooks/editor/nodes/useGrouping";
import useNodesStore from "@/stores/nodesStore";

const useNodeContextMenu = (node: Node) => {
    const { removeNodeFromGroup, createGroup } = useGrouping();

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        // PERFORMANCE: Use getState() pattern to avoid store subscriptions
        const selectedNodes = useEditorStore.getState().selectedNodes;
        const setDeleteNodesDialogOpen = useEditorStore.getState().setDeleteNodesDialogOpen;
        const openForm = useEditorStore.getState().openForm;
        const openContextMenu = useEditorStore.getState().openContextMenu;
        const isNodeInGroup = useNodesStore.getState().isNodeInGroup;
        const nodeToMoveToGroupId = useEditorStore.getState().nodeToMoveToGroupId;
        const setNodeToMoveToGroupId = useEditorStore.getState().setNodeToMoveToGroupId;

        const contextMenuItems = [];

        // Group selected nodes option (when 2 or more nodes selected)
        if (selectedNodes.length >= 2) {
            contextMenuItems.push({
                label: "Group Selected Nodes",
                action: () => createGroup()
            });
        }

        const groupId = isNodeInGroup(node.id);
        if (groupId && selectedNodes.length === 1) {
            contextMenuItems.push({
                label: "Remove From Group",
                action: () => removeNodeFromGroup(groupId, node.id)
            });
        }

        if (!nodeToMoveToGroupId && selectedNodes.length === 1) {
            contextMenuItems.push({
                label: "Move To group",
                action: () => setNodeToMoveToGroupId(node.id)
            });
        }

        contextMenuItems.push({
            label: "Edit Node",
            action: () => openForm(FormType.EditNode, node.id)
        });

        contextMenuItems.push({
            label: "Delete",
            action: () => setDeleteNodesDialogOpen(true)
        });

        openContextMenu(e.clientX, e.clientY, contextMenuItems);
    }, [node.id, removeNodeFromGroup, createGroup]);

    return { handleContextMenu };
};

export default useNodeContextMenu;