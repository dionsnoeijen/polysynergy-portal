import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import { updateConnectionsDirectly } from "@/utils/updateConnectionsDirectly";
import { getNodeBoundsFromState } from "@/utils/positionUtils";
import useConnectionVisibility from "./useConnectionVisibility";

const useGroupNavigation = () => {
    const setSelectedNodes = useEditorStore((state) => state.setSelectedNodes);

    const closeGroupStore = useNodesStore((state) => state.closeGroup);
    const openGroupStore = useNodesStore((state) => state.openGroup);
    const hideGroup = useNodesStore((state) => state.hideGroup);
    const showGroup = useNodesStore((state) => state.showGroup);
    const getNodesInGroup = useNodesStore((state) => state.getNodesInGroup);
    const getGroupById = useNodesStore((state) => state.getGroupById);
    const isNodeInGroup = useNodesStore((state) => state.isNodeInGroup);
    const updateNodePositionByDelta = useNodesStore((state) => state.updateNodePositionByDelta);
    const updateMultipleNodePositionsByDelta = useNodesStore((state) => state.updateMultipleNodePositionsByDelta);
    const disableAllNodesViewExceptByIds = useNodesStore((state) => state.disableAllNodesViewExceptByIds);
    const enableAllNodesView = useNodesStore((state) => state.enableAllNodesView);
    const enableNodesView = useNodesStore((state) => state.enableNodesView);
    const getNode = useNodesStore((state) => state.getNode);
    const currentOpenGroup = useNodesStore((state) => state.openedGroup);

    const { showConnectionsInsideOpenGroup, showConnectionsOutsideGroup } = useConnectionVisibility();

    const closeGroup = (groupId: string) => {
        const group = getGroupById(groupId);

        if (!group || !group.group || !group.group.nodes) return;

        closeGroupStore(groupId);
        hideGroup(groupId);

        const { groupStack: newStack } = useNodesStore.getState();
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

        // Batch update all node positions in one go instead of forEach
        updateMultipleNodePositionsByDelta(
            nodesInGroup.map((nodeId) => ({ nodeId, deltaX: diffX, deltaY: diffY }))
        );

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

    return {
        closeGroup,
        openGroup
    };
};

export default useGroupNavigation;