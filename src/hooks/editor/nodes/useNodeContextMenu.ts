import {FormType, Node} from '@/types/types';
import React from "react";
import useEditorStore from "@/stores/editorStore";
import useGrouping from "@/hooks/editor/nodes/useGrouping";
import useNodesStore from "@/stores/nodesStore";

const useNodeContextMenu = (node: Node) => {
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const setDeleteNodesDialogOpen = useEditorStore((state) => state.setDeleteNodesDialogOpen);
    const openForm = useEditorStore((state) => state.openForm);
    const openContextMenu = useEditorStore((state) => state.openContextMenu);
    const isNodeInGroup = useNodesStore((state) => state.isNodeInGroup);
    const nodeToMoveToGroupId = useEditorStore((state) => state.nodeToMoveToGroupId);
    const setNodeToMoveToGroupId = useEditorStore((state) => state.setNodeToMoveToGroupId);
    const { removeNodeFromGroup } = useGrouping();

    const handleContextMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const contextMenuItems = [];

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
    };

    return { handleContextMenu };
};

export default useNodeContextMenu;