import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import { NodeType } from "@/types/types";
import useConnectionVisibility from "./useConnectionVisibility";

const useGroupManagement = () => {
    const setNodeToMoveToGroupId = useEditorStore((state) => state.setNodeToMoveToGroupId);

    const dissolveGroupStore = useNodesStore((state) => state.dissolveGroup);
    const removeGroupStore = useNodesStore((state) => state.removeGroup);
    const removeNodeFromGroupStore = useNodesStore((state) => state.removeNodeFromGroup);
    const getGroupById = useNodesStore((state) => state.getGroupById);
    const addNodeToGroup = useNodesStore((state) => state.addNodeToGroup);
    const enableAllNodesView = useNodesStore((state) => state.enableAllNodesView);
    const removeNode = useNodesStore((state) => state.removeNode);
    const getNode = useNodesStore((state) => state.getNode);
    const disableNodeView = useNodesStore((state) => state.disableNodeView);
    const openGroupStore = useNodesStore((state) => state.openGroup);
    const showGroup = useNodesStore((state) => state.showGroup);

    const findInConnectionsByNodeId = useConnectionsStore((state) => state.findInConnectionsByNodeId);
    const findOutConnectionsByNodeId = useConnectionsStore((state) => state.findOutConnectionsByNodeId);
    const removeConnections = useConnectionsStore((state) => state.removeConnections);
    const takeConnectionsOutOfGroup = useConnectionsStore((state) => state.takeConnectionsOutOfGroup);

    const { restoreConnectionVisibility } = useConnectionVisibility();

    const dissolveGroup = (groupId: string) => {
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
                openGroupStore(openedGroup);
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
    };

    return {
        dissolveGroup,
        removeNodeFromGroup,
        deleteGroup,
        moveNodeToGroup
    };
};

export default useGroupManagement;