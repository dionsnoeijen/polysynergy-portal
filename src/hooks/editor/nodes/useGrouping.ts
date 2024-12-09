import useGroupsStore from "@/stores/groupStore";
import { useEditorStore } from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import { Connection, useConnectionsStore } from "@/stores/connectionsStore";
import { MARGIN } from "@/utils/constants";
import { updateConnectionsDirectly } from "@/utils/updateConnectionsDirectly";

const useGrouping = () => {
    const {
        selectedNodes,
        setSelectedNodes,
        setOpenGroup,
        closeGroup: closeGroupEditorStore,
        openGroup: currentOpenGroup
    } = useEditorStore();
    const {
        addGroup,
        closeGroup: closeGroupStore,
        openGroup: openGroupStore,
        hideGroup,
        showGroup,
        removeGroup: removeGroupStore,
        removeNodeFromGroup: removeNodeFromGroupStore,
        getNodesInGroup,
        getGroupById,
    } = useGroupsStore();
    const {
        addGroupNode,
        updateNodePosition,
        updateNodePositionByDelta,
        disableAllNodesExceptByIds,
        enableAllNodes,
        removeNode,
        getNode,
        disableNode
    } = useNodesStore();
    const {
        findInConnectionsByNodeId,
        findOutConnectionsByNodeId,
        removeConnections,
        showConnectionsInsideOpenGroup,
        showConnectionsOutsideGroup,
        updateConnection
    } = useConnectionsStore();

    const createGroup = () => {
        if (selectedNodes.length < 2) return;

        const groupId = addGroup({ nodes: selectedNodes });

        const outsideConnections: Connection[] = [];
        selectedNodes.forEach((nodeId) => {
            const inCon = findInConnectionsByNodeId(nodeId);
            const outCon = findOutConnectionsByNodeId(nodeId);

            [...inCon, ...outCon].forEach((con) => {
                updateConnection({...con, isInGroup: groupId});
            });

            const filterOutside = (connection: Connection) => {
                const sourceInside = selectedNodes.includes(connection.sourceNodeId) || connection.sourceGroupId === groupId;
                const targetInside = selectedNodes.includes(connection.targetNodeId as string) || connection.targetGroupId === groupId;

                return !(sourceInside && targetInside);
            };

            outsideConnections.push(...inCon.filter(filterOutside), ...outCon.filter(filterOutside));
        });

        const uniqueOutsideConnections = Array.from(new Set(outsideConnections));

        removeConnections(uniqueOutsideConnections);

        setOpenGroup(groupId);
        addGroupNode({ id: groupId });
        setSelectedNodes([]);
        disableAllNodesExceptByIds([...selectedNodes, groupId]);
        showConnectionsInsideOpenGroup(groupId);
    };

    const closeGroup = (
        groupId: string,
        x: number,
        y: number
    ) => {
        closeGroupStore(groupId);
        hideGroup(groupId);
        closeGroupEditorStore();

        const { groupStack: newStack } = useEditorStore.getState();
        const parentGroup = newStack[newStack.length - 1];
        if (parentGroup) {
            showGroup(parentGroup);
            setOpenGroup(parentGroup);
        } else {
            setOpenGroup(null);
        }

        updateNodePosition(groupId, x, y);
        setSelectedNodes([]);
        enableAllNodes();

        let showConnections = [];
        if (parentGroup) {
            showConnections = showConnectionsInsideOpenGroup(parentGroup);
        } else {
            showConnections = showConnectionsOutsideGroup();
        }
        setTimeout(() => {
            updateConnectionsDirectly(showConnections);
        }, 0);
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


        if (currentOpenGroup && currentOpenGroup !== groupId) {
            hideGroup(currentOpenGroup);
        }

        openGroupStore(groupId);
        showGroup(groupId);
        setOpenGroup(groupId);
        setSelectedNodes([]);

        disableAllNodesExceptByIds([...nodesInGroup, groupId]);
        const showConnections = showConnectionsInsideOpenGroup(groupId);
        setTimeout(() => {
            updateConnectionsDirectly(showConnections);
        }, 0);
    };

    const dissolveGroup = (groupId: string) => {
        const inConnections = findInConnectionsByNodeId(groupId, true);
        const outConnections = findOutConnectionsByNodeId(groupId, true);
        const connections = [...inConnections, ...outConnections];

        removeConnections(connections);
        removeGroupStore(groupId);
        removeNode(groupId);
        enableAllNodes();
    };

    const removeNodeFromGroup = (groupId: string, nodeId: string) => {
        const inConnections = findInConnectionsByNodeId(nodeId);
        const outConnections = findOutConnectionsByNodeId(nodeId);
        const connections = [...inConnections, ...outConnections];

        removeConnections(connections);
        removeNodeFromGroupStore(groupId, nodeId);
        disableNode(nodeId);

        const group = getGroupById(groupId);
        if (!group) return;
        if (group?.nodes?.length === 1) {
            dissolveGroup(groupId);
        }
    };

    return {
        createGroup,
        closeGroup,
        openGroup,
        dissolveGroup,
        removeNodeFromGroup
    };
};

export default useGrouping;
