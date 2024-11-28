import useGroupsStore from "@/stores/groupStore";
import { useEditorStore } from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";

const useGrouping = () => {
    const { selectedNodes, setSelectedNodes, setOpenGroup } = useEditorStore();
    const { addGroup, closeGroup: closeGroupStore, openGroup: openGrounStore } = useGroupsStore();
    const { addGroupNode, updateNodePosition } = useNodesStore();

    const createGroup = () => {
        if (selectedNodes.length < 2) return;
        const groupId = addGroup({nodes: selectedNodes});
        setOpenGroup(groupId);
        addGroupNode({ id: groupId });
        setSelectedNodes([]);
    };

    const closeGroup = (groupId: string, x: number, y: number) => {
        closeGroupStore(groupId);
        setOpenGroup(null);
        updateNodePosition(groupId, x, y);
        setSelectedNodes([]);
    };

    const openGroup = (groupId: string) => {
        openGrounStore(groupId);
        setOpenGroup(groupId);
        setSelectedNodes([]);
    };

    return { createGroup, closeGroup, openGroup };
};

export default useGrouping;
