import useGroupsStore from "@/stores/groupStore";
import { useEditorStore } from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import { useConnectionsStore } from "@/stores/connectionsStore";

const useGrouping = () => {
    const { selectedNodes, setSelectedNodes, setOpenGroup } = useEditorStore();
    const { addGroup, closeGroup: closeGroupStore, openGroup: openGroupStore, removeGroup: removeGroupStore, getNodesInGroup } = useGroupsStore();
    const { addGroupNode, updateNodePosition, disableAllNodesExceptByIds, enableAllNodes, removeNode } = useNodesStore();
    const { findInConnectionsByNodeId, findOutConnectionsByNodeId, removeConnections } = useConnectionsStore();

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
        const nodesInGroup = getNodesInGroup(groupId);
        disableAllNodesExceptByIds(nodesInGroup);
    };

    const dissolveGroup = (groupId: string) => {
        const inConnections = findInConnectionsByNodeId(groupId);
        const outConnections = findOutConnectionsByNodeId(groupId);
        const connections = [...inConnections, ...outConnections];

        removeConnections(connections);
        removeGroupStore(groupId);
        removeNode(groupId);
        enableAllNodes();
    };

    return { createGroup, closeGroup, openGroup, dissolveGroup };
};

export default useGrouping;
