import { useCallback } from "react";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import { NodeType } from "@/types/types";
import useConnectionVisibility from "./useConnectionVisibility";

const useGroupManagement = () => {
    const { restoreConnectionVisibility } = useConnectionVisibility();

    const dissolveGroup = useCallback((groupId: string) => {
        // PERFORMANCE: Use getState() pattern to avoid store subscriptions
        const dissolveGroupStore = useNodesStore.getState().dissolveGroup;
        const removeNode = useNodesStore.getState().removeNode;
        const enableAllNodesView = useNodesStore.getState().enableAllNodesView;
        const findInConnectionsByNodeId = useConnectionsStore.getState().findInConnectionsByNodeId;
        const findOutConnectionsByNodeId = useConnectionsStore.getState().findOutConnectionsByNodeId;
        const removeConnections = useConnectionsStore.getState().removeConnections;
        const takeConnectionsOutOfGroup = useConnectionsStore.getState().takeConnectionsOutOfGroup;

        const inConnections = findInConnectionsByNodeId(groupId, true);
        const outConnections = findOutConnectionsByNodeId(groupId, true);
        const connections = [...inConnections, ...outConnections];
        takeConnectionsOutOfGroup(groupId);
        removeConnections(connections);
        removeNode(groupId);
        dissolveGroupStore(groupId);
        enableAllNodesView();

        // Restore proper connection visibility after dissolving group
        restoreConnectionVisibility();
    }, [restoreConnectionVisibility]);

    const removeNodeFromGroup = useCallback((groupId: string, nodeId: string) => {
        // PERFORMANCE: Use getState() pattern to avoid store subscriptions
        const getGroupById = useNodesStore.getState().getGroupById;
        const removeNodeFromGroupStore = useNodesStore.getState().removeNodeFromGroup;
        const disableNodeView = useNodesStore.getState().disableNodeView;
        const openGroupStore = useNodesStore.getState().openGroup;
        const showGroup = useNodesStore.getState().showGroup;
        const findInConnectionsByNodeId = useConnectionsStore.getState().findInConnectionsByNodeId;
        const findOutConnectionsByNodeId = useConnectionsStore.getState().findOutConnectionsByNodeId;
        const removeConnections = useConnectionsStore.getState().removeConnections;

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
                openGroupStore(openedGroup);
                showGroup(openedGroup);
            }
        }
    }, [dissolveGroup]);

    const deleteGroup = useCallback((groupId: string) => {
        // PERFORMANCE: Use getState() pattern to avoid store subscriptions
        const getGroupById = useNodesStore.getState().getGroupById;
        const getNode = useNodesStore.getState().getNode;
        const removeNode = useNodesStore.getState().removeNode;
        const removeGroupStore = useNodesStore.getState().removeGroup;
        const findInConnectionsByNodeId = useConnectionsStore.getState().findInConnectionsByNodeId;
        const findOutConnectionsByNodeId = useConnectionsStore.getState().findOutConnectionsByNodeId;
        const removeConnections = useConnectionsStore.getState().removeConnections;

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
    }, []);

    const moveNodeToGroup = useCallback((nodeId: string, groupId: string) => {
        // PERFORMANCE: Use getState() pattern to avoid store subscriptions
        const getNode = useNodesStore.getState().getNode;
        const addNodeToGroup = useNodesStore.getState().addNodeToGroup;
        const setNodeToMoveToGroupId = useEditorStore.getState().setNodeToMoveToGroupId;
        const findInConnectionsByNodeId = useConnectionsStore.getState().findInConnectionsByNodeId;
        const findOutConnectionsByNodeId = useConnectionsStore.getState().findOutConnectionsByNodeId;
        const removeConnections = useConnectionsStore.getState().removeConnections;

        const node = getNode(nodeId);

        // If we're moving a group, we need to preserve connections inside it
        if (node?.type === NodeType.Group) {
            // Only remove boundary connections (where the group itself is source/target)
            // These are connections with sourceGroupId or targetGroupId === nodeId
            const inConnections = findInConnectionsByNodeId(nodeId, true);
            const outConnections = findOutConnectionsByNodeId(nodeId, true);

            // Filter to only remove external connections
            // Keep ALL internal connections (isInGroup === nodeId), including:
            // - Node to Node connections within the group
            // - Group boundary to Node connections (internal inputs)
            // - Node to Group boundary connections (internal outputs)
            const allFoundConnections = [...inConnections, ...outConnections];
            const boundaryConnections = allFoundConnections.filter(c => {
                // Remove only connections that are NOT internal
                return c.isInGroup !== nodeId;
            });

            removeConnections(boundaryConnections);
            // Internal connections (isInGroup === nodeId) are preserved!
        } else {
            // For regular nodes, remove all connections as before
            const inConnections = findInConnectionsByNodeId(nodeId);
            const outConnections = findOutConnectionsByNodeId(nodeId);
            removeConnections([...inConnections, ...outConnections]);
        }

        addNodeToGroup(groupId, nodeId);
        setNodeToMoveToGroupId(null);
    }, []);

    return {
        dissolveGroup,
        removeNodeFromGroup,
        deleteGroup,
        moveNodeToGroup
    };
};

export default useGroupManagement;