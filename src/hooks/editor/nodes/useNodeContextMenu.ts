import { Node } from '@/types/types';
import React from "react";
import { useEditorStore } from "@/stores/editorStore";
import useGroupsStore from "@/stores/groupStore";

const useNodeContextMenu = (node: Node) => {
    const { selectedNodes, openContextMenu, setDeleteNodesDialogOpen } = useEditorStore();
    const { isNodeInGroup, removeNodeFromGroup } = useGroupsStore();

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        const contextMenuItems = [];

        const groupId = isNodeInGroup(node.id);
        if (groupId && selectedNodes.length === 1) {
            contextMenuItems.push({
                label: "Remove from group",
                action: () => removeNodeFromGroup(groupId, node.id)
            });
        }

        contextMenuItems.push({
            label: "Delete",
            action: () => setDeleteNodesDialogOpen(true)
        });

        openContextMenu(e.clientX, e.clientY, contextMenuItems);
    };

    return { handleContextMenu };
};

export default useNodeContextMenu;
