import useGroupsStore from "@/stores/groupStore";
import { useEditorStore } from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import { useConnectionsStore } from "@/stores/connectionsStore";
import { MARGIN } from "@/utils/constants";

const useGrouping = () => {
    const { selectedNodes, setSelectedNodes, setOpenGroup } = useEditorStore();
    const {
        addGroup,
        closeGroup: closeGroupStore,
        openGroup: openGroupStore,
        removeGroup: removeGroupStore,
        getNodesInGroup,
        getGroupById
    } = useGroupsStore();
    const {
        addGroupNode,
        updateNodePosition,
        updateNodePositionByDelta,
        disableAllNodesExceptByIds,
        enableAllNodes,
        removeNode,
        getNode
    } = useNodesStore();
    const { findInConnectionsByNodeId, findOutConnectionsByNodeId, removeConnections } = useConnectionsStore();

    const createGroup = () => {
        if (selectedNodes.length < 2) return;
        const groupId = addGroup({nodes: selectedNodes});
        setOpenGroup(groupId);
        addGroupNode({ id: groupId });
        setSelectedNodes([]);
        disableAllNodesExceptByIds([...selectedNodes, groupId]);
    };

    const closeGroup = (groupId: string, x: number, y: number) => {
        closeGroupStore(groupId);
        setOpenGroup(null);
        updateNodePosition(groupId, x, y);
        setSelectedNodes([]);
        enableAllNodes();
    };

    const openGroup = (groupId: string) => {
        // replace the nodes, if the parent node is moved, the
        // nodes in the group, had to move along, otherwise it will
        // look as if the group opens at a different location
        // the user would expect
        const openGroup = getGroupById(groupId);
        const closedGroup = getNode(groupId);

        if (!openGroup || !closedGroup) return;

        const openGroupPositionX = openGroup?.view.x + MARGIN;
        const openGroupPositionY = openGroup?.view.y + MARGIN;

        const closedGroupPositionX = closedGroup?.view.x + MARGIN;
        const closedGroupPositionY = closedGroup?.view.y + MARGIN;

        const diffX = closedGroupPositionX - openGroupPositionX;
        const diffY = closedGroupPositionY - openGroupPositionY;

        const nodesInGroup = getNodesInGroup(groupId);
        nodesInGroup.map((nodeId) => {
            const node = getNode(nodeId);
            if (!node) return;
            updateNodePositionByDelta(nodeId, diffX, diffY);

        });
        openGroupStore(groupId);
        setOpenGroup(groupId);
        setSelectedNodes([]);


        disableAllNodesExceptByIds([...nodesInGroup, groupId]);
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
