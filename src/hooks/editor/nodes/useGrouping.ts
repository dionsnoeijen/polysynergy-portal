import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import {Connection} from "@/types/types";
import {updateConnectionsDirectly} from "@/utils/updateConnectionsDirectly";
import {getNodeBoundsFromDOM, getNodeBoundsFromState} from "@/utils/positionUtils";
import {updateNodesDirectly} from "@/utils/updateNodesDirectly";
import {NodeType} from "@/types/types";
import {v4 as uuidv4} from "uuid";

const useGrouping = () => {
    const {
        selectedNodes,
        setSelectedNodes,
        setOpenGroup,
        closeGroup: closeGroupEditorStore,
        openGroup: currentOpenGroup
    } = useEditorStore();
    const {
        closeGroup: closeGroupStore,
        openGroup: openGroupStore,
        hideGroup,
        showGroup,
        removeGroup: removeGroupStore,
        removeNodeFromGroup: removeNodeFromGroupStore,
        getNodesInGroup,
        getGroupById,
        isNodeInGroup,
        addNodeToGroup,
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

        const parentGroupId = currentOpenGroup;
        if (parentGroupId) {
            selectedNodes.forEach((nodeId) => {
                removeNodeFromGroupStore(parentGroupId, nodeId);
            });
        }

        const bounds = getNodeBoundsFromState(selectedNodes);

        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        const nodesCenterX = bounds.minX + (width / 2);
        const nodesCenterY = bounds.minY + (height / 2);

        const groupId = uuidv4();

        // const groupId = addGroup({nodes: selectedNodes});

        const connectionsToRemove: Connection[] = [];
        const connectionsToAssignToGroup: Connection[] = [];

        selectedNodes.forEach((nodeId) => {
            const inCon = findInConnectionsByNodeId(nodeId, true, false);
            const outCon = findOutConnectionsByNodeId(nodeId, true, false);
            connectionsToAssignToGroup.push(...inCon, ...outCon);

            const filterOutside = (connection: Connection) => {
                const sourceInside =
                    selectedNodes.includes(connection.sourceNodeId) ||
                    (connection.sourceGroupId && selectedNodes.includes(connection.sourceGroupId)) ||
                    (connection.sourceGroupId === groupId);

                const targetInside =
                    selectedNodes.includes(connection.targetNodeId as string) ||
                    (connection.targetGroupId && selectedNodes.includes(connection.targetGroupId)) ||
                    (connection.targetGroupId === groupId);

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
            .filter((con) => !connectionsToRemove.includes(con));

        removeConnections(connectionsToRemove);

        connectionsRemaining.forEach((connection) => {
            updateConnection({
                ...connection,
                isInGroup: groupId
            });
        });

        addGroupNode({
            id: groupId,
            group: {
                isOpen: true,
                isHidden: false,
                nodes: selectedNodes
            },
            view: {
                x: nodesCenterX - 100,
                y: nodesCenterY - 100,
                width: 200,
                height: 200,
                collapsed: false
            }
        });

        if (parentGroupId) {
            addNodeToGroup(parentGroupId, groupId);
            const parentGroup = getGroupById(parentGroupId);
            if (parentGroup &&
                parentGroup.group &&
                parentGroup.group.nodes &&
                parentGroup.group.nodes.length <= 1
            ) {
                dissolveGroup(parentGroupId);
            }
        }

        if (currentOpenGroup && currentOpenGroup !== groupId) {
            hideGroup(currentOpenGroup);
        }

        setOpenGroup(groupId);
        setSelectedNodes([]);
        openGroupStore(groupId);
        showGroup(groupId);
        disableAllNodesViewExceptByIds([...selectedNodes]);
    };

    const closeGroup = (
        groupId: string,
    ) => {
        const group = getGroupById(groupId);

        if (!group || !group.group || !group.group.nodes) return;
        const bounds = getNodeBoundsFromDOM(group?.group?.nodes);

        const closedGroupNodeWidth = group.view.width / 2;
        const closedGroupNodeHeight = group.view.height / 2;
        const x = (bounds.minX + (bounds.maxX - bounds.minX) / 2) - closedGroupNodeWidth;
        const y = (bounds.minY + (bounds.maxY - bounds.minY) / 2) - closedGroupNodeHeight;

        closeGroupStore(groupId);
        hideGroup(groupId);
        closeGroupEditorStore();

        const {groupStack: newStack} = useEditorStore.getState();
        const parentGroupId = newStack[newStack.length - 1];
        if (parentGroupId) {
            showGroup(parentGroupId);
            setOpenGroup(parentGroupId);
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
        if (parentGroupId) {
            const parentGroup = getGroupById(parentGroupId);
            if (!parentGroup) return;
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
        const group = getNode(groupId);

        if (!group) return;

        const closedGroupCenterX = group.view.x + (group.view.width / 2);
        const closedGroupCenterY = group.view.y + (group.view.height / 2);

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
        const showConnections = showConnectionsInsideOpenGroup(group);
        setTimeout(() => {
            updateConnectionsDirectly(showConnections);
        }, 0);
    };

    const dissolveGroup = (groupId: string) => {
        const inConnections = findInConnectionsByNodeId(groupId, true);
        const outConnections = findOutConnectionsByNodeId(groupId, true);
        const connections = [...inConnections, ...outConnections];

        removeConnections(connections);
        // removeGroupStore(groupId);
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
        if (!group || !group?.group || !group?.group?.nodes) return;
        if (group?.group?.nodes?.length === 1) {
            dissolveGroup(groupId);
        }
    };

    const deleteGroup = (groupId: string) => {
        const group = getGroupById(groupId);
        if (!group || !group?.group || !group?.group?.nodes) return;

        const inConnections = findInConnectionsByNodeId(groupId);
        const outConnections = findOutConnectionsByNodeId(groupId);

        const connections = [...inConnections, ...outConnections];

        removeConnections(connections);

        group.group.nodes.forEach((nodeId) => {
            const node = getNode(nodeId);
            if (!node) return;

            const inConnections = findInConnectionsByNodeId(nodeId);
            const outConnections = findOutConnectionsByNodeId(nodeId);
            const connections = [...inConnections, ...outConnections];
            removeConnections(connections);

            if (node.type === NodeType.Group) {
                // deleteGroup(nodeId);
                removeNode(nodeId);
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
