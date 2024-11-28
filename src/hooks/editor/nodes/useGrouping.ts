import useGroupsStore from "@/stores/groupStore";
import { useEditorStore } from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";

const useGrouping = () => {
    const { selectedNodes, setSelectedNodes, setOpenGroup } = useEditorStore();
    const { addGroup, closeGroup: closeGroupStore, openGroup: openGroupStore } = useGroupsStore();
    const { addGroupNode, updateNodePosition, disableAllNodesExceptByIds, enableAllNodes } = useNodesStore();

    const createGroup = () => {
        if (selectedNodes.length < 2) return;
        const groupId = addGroup({nodes: selectedNodes});
        setOpenGroup(groupId);
        addGroupNode({ id: groupId });
        setSelectedNodes([]);
        disableAllNodesExceptByIds(selectedNodes);
    };

    const closeGroup = (groupId: string, x: number, y: number) => {
        closeGroupStore(groupId);
        setOpenGroup(null);
        updateNodePosition(groupId, x, y);
        setSelectedNodes([]);
        enableAllNodes();
    };

    const openGroup = (groupId: string) => {
        openGroupStore(groupId);
        setOpenGroup(groupId);
        setSelectedNodes([]);
    };

    return { createGroup, closeGroup, openGroup };
};

export default useGrouping;
