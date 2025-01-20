import useGroupsStore from "@/stores/groupStore";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore, {Connection} from "@/stores/connectionsStore";
import {updateConnectionsDirectly} from "@/utils/updateConnectionsDirectly";
import {getNodeBoundsFromDOM, getNodeBoundsFromState} from "@/utils/positionUtils";
import {updateNodesDirectly} from "@/utils/updateNodesDirectly";
import {NodeType} from "@/types/types";

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
        isNodeInGroup
    } = useGroupsStore();
    const {
        addGroupNode,
        updateNodePosition,
        updateNodePositionByDelta,
        disableAllNodesViewExceptByIds,
        enableAllNodesView,
        enableNodesView,
        removeNode,
        getNode,
        disableNodeView
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

        // 1: Remove connections that fall outside the group
        // those are the connections that make a connection to a node that is not in the
        // selected nodes array. If the selected node array contains a group, make sure the connections
        // that are inside this group, are not removed. This can be done by checking the visibility status
        // of the connection. Since an invisible connection, should not be removed.

        const connectionsToRemove: Connection[] = [];
        const connectionsToAssignToGroup: Connection[] = [];

        selectedNodes.forEach((nodeId) => {
            const inCon = findInConnectionsByNodeId(nodeId, true, false);
            const outCon = findOutConnectionsByNodeId(nodeId, true, false);

            connectionsToAssignToGroup.push(...inCon, ...outCon);

            const filterOutside = (connection: Connection) => {
                const sourceInside =
                    selectedNodes.includes(connection.sourceNodeId) ||
                    connection.sourceGroupId === groupId;
                const targetInside =
                    selectedNodes.includes(connection.targetNodeId as string) ||
                    connection.targetGroupId === groupId;
                const isGroupToNodeOrGroup =
                    (connection.sourceGroupId && selectedNodes.includes(connection.targetNodeId as string)) ||
                    (connection.targetGroupId && selectedNodes.includes(connection.sourceNodeId));
                return !(sourceInside && targetInside) && !isGroupToNodeOrGroup;
            };
            connectionsToRemove.push(
                ...inCon.filter(filterOutside),
                ...outCon.filter(filterOutside)
            );
        });

        const connectionsRemaining = Array.from(new Set(connectionsToAssignToGroup))
            .filter(
                (con) => !connectionsToRemove.includes(con)
            );

        removeConnections(connectionsToRemove);

        // 2: Update connections that fall inside the group with the new group id
        // those are the remaining visible connections that are inside the group, after
        // the removal of the outside connections

        connectionsRemaining.forEach((connection) => {
            updateConnection({
                ...connection,
                isInGroup: groupId
            });
        });

        setOpenGroup(groupId);
        addGroupNode({id:groupId});
        setSelectedNodes([]);
        disableAllNodesViewExceptByIds([...selectedNodes, groupId]);
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

        // 1: See if the group we are closing, is part of another group, if so, display
        // the nodes in that group
        const groupedByNode = isNodeInGroup(groupId);
        if (groupedByNode) {
            const nodesInGroup = getNodesInGroup(groupedByNode);
            enableNodesView(nodesInGroup);
        // 2: If this is not the case, and the group we are closing does not belong
        // to another group, just enable all nodes
        } else {
            enableAllNodesView();
        }

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

        disableAllNodesViewExceptByIds([...nodesInGroup]);
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
        enableAllNodesView();
    };

    const removeNodeFromGroup = (groupId: string, nodeId: string) => {
        const inConnections = findInConnectionsByNodeId(nodeId);
        const outConnections = findOutConnectionsByNodeId(nodeId);
        const connections = [...inConnections, ...outConnections];

        removeConnections(connections);
        removeNodeFromGroupStore(groupId, nodeId);
        disableNodeView(nodeId);

        const group = getGroupById(groupId);
        if (!group) return;
        if (group?.nodes?.length === 1) {
            dissolveGroup(groupId);
        }
    };

    const deleteGroup = (groupId: string) => {
        const group = getGroupById(groupId);
        if (!group) return;

        const inConnections = findInConnectionsByNodeId(groupId);
        const outConnections = findOutConnectionsByNodeId(groupId);
        const connections = [...inConnections, ...outConnections];
        removeConnections(connections);

        group.nodes.forEach((nodeId) => {
            const node = getNode(nodeId);
            if (!node) return;

            const inConnections = findInConnectionsByNodeId(nodeId);
            const outConnections = findOutConnectionsByNodeId(nodeId);
            const connections = [...inConnections, ...outConnections];
            removeConnections(connections);

            if (node.type === NodeType.Group) {
                deleteGroup(nodeId);
            } else {
                removeNode(nodeId);
            }
        });

        removeGroupStore(groupId);
    };

    return {
        createGroup,
        closeGroup,
        deleteGroup,
        openGroup,
        dissolveGroup,
        removeNodeFromGroup
    };
};

export default useGrouping;
