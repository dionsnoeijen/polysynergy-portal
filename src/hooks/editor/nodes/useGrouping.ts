import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import {Connection} from "@/types/types";
import {updateConnectionsDirectly} from "@/utils/updateConnectionsDirectly";
import {getNodeBoundsFromState} from "@/utils/positionUtils";
import {NodeType} from "@/types/types";
import {v4 as uuidv4} from "uuid";

const useGrouping = () => {
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const setSelectedNodes = useEditorStore((state) => state.setSelectedNodes);
    const setNodeToMoveToGroupId = useEditorStore((state) => state.setNodeToMoveToGroupId);

    const closeGroupStore = useNodesStore((state) => state.closeGroup);
    const openGroupStore = useNodesStore((state) => state.openGroup);
    const dissolveGroupStore = useNodesStore((state) => state.dissolveGroup);
    const hideGroup = useNodesStore((state) => state.hideGroup);
    const showGroup = useNodesStore((state) => state.showGroup);
    const removeGroupStore = useNodesStore((state) => state.removeGroup);
    const removeNodeFromGroupStore = useNodesStore((state) => state.removeNodeFromGroup);
    const getNodesInGroup = useNodesStore((state) => state.getNodesInGroup);
    const getGroupById = useNodesStore((state) => state.getGroupById);
    const isNodeInGroup = useNodesStore((state) => state.isNodeInGroup);
    const addNodeToGroup = useNodesStore((state) => state.addNodeToGroup);
    const addGroupNode = useNodesStore((state) => state.addGroupNode);
    const updateNodePositionByDelta = useNodesStore((state) => state.updateNodePositionByDelta);
    const disableAllNodesViewExceptByIds = useNodesStore((state) => state.disableAllNodesViewExceptByIds);
    const enableAllNodesView = useNodesStore((state) => state.enableAllNodesView);
    const enableNodesView = useNodesStore((state) => state.enableNodesView);
    const removeNode = useNodesStore((state) => state.removeNode);
    const getNode = useNodesStore((state) => state.getNode);
    const disableNodeView = useNodesStore((state) => state.disableNodeView);
    const currentOpenGroup = useNodesStore((state) => state.openedGroup);

    const findInConnectionsByNodeId = useConnectionsStore((state) => state.findInConnectionsByNodeId);
    const findOutConnectionsByNodeId = useConnectionsStore((state) => state.findOutConnectionsByNodeId);
    const removeConnections = useConnectionsStore((state) => state.removeConnections);
    const showConnectionsInsideOpenGroup = useConnectionsStore((state) => state.showConnectionsInsideOpenGroup);
    const showConnectionsOutsideGroup = useConnectionsStore((state) => state.showConnectionsOutsideGroup);
    const updateConnection = useConnectionsStore((state) => state.updateConnection);
    const takeConnectionsOutOfGroup = useConnectionsStore((state) => state.takeConnectionsOutOfGroup);

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

        const connectionsToRemove: Connection[] = [];
        const connectionsToAssignToGroup: Connection[] = [];

        selectedNodes.forEach((nodeId) => {
            const inCon = findInConnectionsByNodeId(nodeId, true, false);
            const outCon = findOutConnectionsByNodeId(nodeId, true, false);
            connectionsToAssignToGroup.push(...inCon, ...outCon);

            const filterOutside = (connection: Connection) => {
                const sourceInside =
                    selectedNodes.includes(connection.sourceNodeId ?? '') ||
                    selectedNodes.includes(connection.sourceGroupId ?? '') ||
                    connection.sourceGroupId === groupId;

                const targetInside =
                    selectedNodes.includes(connection.targetNodeId ?? '') ||
                    selectedNodes.includes(connection.targetGroupId ?? '') ||
                    connection.targetGroupId === groupId;

                const isGroupToNodeOrGroup =
                    (connection.sourceGroupId && selectedNodes.includes(connection.targetNodeId ?? '')) ||
                    (connection.targetGroupId && selectedNodes.includes(connection.sourceNodeId));

                const isGroupToNewGroup =
                    connection.sourceGroupId &&
                    selectedNodes.includes(connection.targetNodeId ?? '');

                const keep = (sourceInside && targetInside) || isGroupToNodeOrGroup;

                return !keep || isGroupToNewGroup;
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

        setSelectedNodes([]);
        openGroupStore(groupId);
        showGroup(groupId);
        disableAllNodesViewExceptByIds([...selectedNodes]);
        openGroup(groupId);
    };

    const closeGroup = (
        groupId: string,
    ) => {
        const group = getGroupById(groupId);

        if (!group || !group.group || !group.group.nodes) return;

        closeGroupStore(groupId);
        hideGroup(groupId);

        const {groupStack: newStack} = useNodesStore.getState();
        const parentGroupId = newStack[newStack.length - 1];
        if (parentGroupId) {
            showGroup(parentGroupId);
        }

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
        takeConnectionsOutOfGroup(groupId);
        removeConnections(connections);
        removeNode(groupId);
        dissolveGroupStore(groupId);
        enableAllNodesView();
    };

    const removeNodeFromGroup = (groupId: string, nodeId: string) => {
        const inConnections = findInConnectionsByNodeId(nodeId);
        const outConnections = findOutConnectionsByNodeId(nodeId);
        const connections = [...inConnections, ...outConnections];

        const group = getGroupById(groupId);
        const remainingCount = group?.group?.nodes?.length ?? 0;

        removeConnections(connections);
        removeNodeFromGroupStore(groupId, nodeId);
        disableNodeView(nodeId);

        if (remainingCount === 1) {
            dissolveGroup(groupId);
            const openedGroup = useNodesStore.getState().openedGroup;
            if (openedGroup) {
                openGroup(openedGroup);
                showGroup(openedGroup);
            }
        }
    };

    const deleteGroup = (groupId: string) => {
        const group = getGroupById(groupId);
        if (!group || !group.group || !group.group.nodes) return;

        const removeGroupRecursively = (id: string) => {
            const node = getNode(id);
            if (!node) return;

            if (node.type === NodeType.Group && node.group?.nodes) {
                node.group.nodes.forEach(removeGroupRecursively);
            }

            const inConnections = findInConnectionsByNodeId(id);
            const outConnections = findOutConnectionsByNodeId(id);
            removeConnections([...inConnections, ...outConnections]);
            removeNode(id);
        };

        group.group.nodes.forEach(removeGroupRecursively);

        const groupIn = findInConnectionsByNodeId(groupId);
        const groupOut = findOutConnectionsByNodeId(groupId);
        removeConnections([...groupIn, ...groupOut]);

        removeGroupStore(groupId);
    };

    const moveNodeToGroup = (nodeId: string, groupId: string) => {
        const inConnections = findInConnectionsByNodeId(nodeId);
        const outConnections = findOutConnectionsByNodeId(nodeId);
        removeConnections([...inConnections, ...outConnections]);
        addNodeToGroup(groupId, nodeId);
        setNodeToMoveToGroupId(null);
    };

    return {
        createGroup,
        closeGroup,
        deleteGroup,
        openGroup,
        dissolveGroup,
        removeNodeFromGroup,
        moveNodeToGroup
    };
};

export default useGrouping;
