import { useCallback } from "react";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import { updateConnectionsDirectly } from "@/utils/updateConnectionsDirectly";
import { getNodeBoundsFromState } from "@/utils/positionUtils";
import useConnectionVisibility from "./useConnectionVisibility";

const useGroupNavigation = () => {
    const { showConnectionsInsideOpenGroup, showConnectionsOutsideGroup } = useConnectionVisibility();

    const closeGroup = useCallback((groupId: string) => {
        // PERFORMANCE: Use getState() pattern to avoid store subscriptions
        const setSelectedNodes = useEditorStore.getState().setSelectedNodes;
        const closeGroupStore = useNodesStore.getState().closeGroup;
        const hideGroup = useNodesStore.getState().hideGroup;
        const showGroup = useNodesStore.getState().showGroup;
        const getNodesInGroup = useNodesStore.getState().getNodesInGroup;
        const getGroupById = useNodesStore.getState().getGroupById;
        const isNodeInGroup = useNodesStore.getState().isNodeInGroup;
        const enableAllNodesView = useNodesStore.getState().enableAllNodesView;
        const enableNodesView = useNodesStore.getState().enableNodesView;

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
    }, [showConnectionsInsideOpenGroup, showConnectionsOutsideGroup]);

    const openGroup = useCallback((groupId: string) => {
        // PERFORMANCE: Use getState() pattern to avoid store subscriptions
        const setSelectedNodes = useEditorStore.getState().setSelectedNodes;
        const openGroupStore = useNodesStore.getState().openGroup;
        const hideGroup = useNodesStore.getState().hideGroup;
        const showGroup = useNodesStore.getState().showGroup;
        const getNodesInGroup = useNodesStore.getState().getNodesInGroup;
        const updateMultipleNodePositionsByDelta = useNodesStore.getState().updateMultipleNodePositionsByDelta;
        const disableAllNodesViewExceptByIds = useNodesStore.getState().disableAllNodesViewExceptByIds;
        const getNode = useNodesStore.getState().getNode;
        const currentOpenGroup = useNodesStore.getState().openedGroup;

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
    }, [showConnectionsInsideOpenGroup]);

    return {
        closeGroup,
        openGroup
    };
};

export default useGroupNavigation;