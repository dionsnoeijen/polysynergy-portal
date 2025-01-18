import { Node } from '@/types/types';
import React from "react";
import useEditorStore from "@/stores/editorStore";
import useGroupsStore from "@/stores/groupStore";
import useGrouping from "@/hooks/editor/nodes/useGrouping";

const useNodeContextMenu = (node: Node) => {
    const { selectedNodes, openContextMenu, setDeleteNodesDialogOpen } = useEditorStore();
    const { isNodeInGroup} = useGroupsStore();
    const { removeNodeFromGroup } = useGrouping();

    const handleContextMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
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
