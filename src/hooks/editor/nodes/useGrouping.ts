import useGroupsStore from "@/stores/groupStore";
import { useEditorStore } from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import { Connection, useConnectionsStore } from "@/stores/connectionsStore";
import { updateConnectionsDirectly } from "@/utils/updateConnectionsDirectly";
import { getNodeBoundsFromDOM, getNodeBoundsFromState } from "@/utils/positionUtils";
import { updateNodesDirectly } from "@/utils/updateNodesDirectly";

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
                const sourceInside = selectedNodes.includes(connection.sourceNodeId) ||
                    connection.sourceGroupId === groupId;
                const targetInside = selectedNodes.includes(connection.targetNodeId as string) ||
                    connection.targetGroupId === groupId;

                return !(sourceInside && targetInside);
            };

            outsideConnections.push(
                ...inCon.filter(filterOutside),
                ...outCon.filter(filterOutside)
            );
        });

        const uniqueOutsideConnections = Array.from(new Set(outsideConnections));
        removeConnections(uniqueOutsideConnections);

        setOpenGroup(groupId);
        addGroupNode({id:groupId});
        setSelectedNodes([]);
        disableAllNodesExceptByIds([...selectedNodes, groupId]);
        showConnectionsInsideOpenGroup(groupId);
    };

    const closeGroup = (
        groupId: string,
    ) => {

        const group = getGroupById(groupId);
        if (!group) return;
        const bounds = getNodeBoundsFromDOM(group?.nodes);

        const closedGroupNode = getNode(groupId);
        if (!closedGroupNode) return;

        const closedGroupNodeWidth = closedGroupNode.view.width / 2;
        const closedGroupNodeHeight = closedGroupNode.view.height / 2;
        const x = (bounds.minX + (bounds.maxX - bounds.minX) / 2) - closedGroupNodeWidth;
        const y = (bounds.minY + (bounds.maxY - bounds.minY) / 2) - closedGroupNodeHeight;

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
            updateNodesDirectly([groupId], 0, 0, {[groupId]: {x, y}});
            updateConnectionsDirectly(showConnections);
        }, 0);
    };

    const openGroup = (groupId: string) => {
        const openGroup = getGroupById(groupId);
        const closedGroup = getNode(groupId);

        if (!openGroup || !closedGroup) return;

        const closedGroupCenterX = closedGroup.view.x + (closedGroup.view.width / 2);
        const closedGroupCenterY = closedGroup.view.y + (closedGroup.view.height / 2);

        const nodesInGroup = getNodesInGroup(groupId);
        const bounds = getNodeBoundsFromState(nodesInGroup);

        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;

        const nodesCenterX = bounds.minX + (width / 2);
        const nodesCenterY = bounds.minY + (height / 2);

        const diffX = closedGroupCenterX - nodesCenterX;
        const diffY = closedGroupCenterY - nodesCenterY;

        nodesInGroup.forEach((nodeId) => {
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
