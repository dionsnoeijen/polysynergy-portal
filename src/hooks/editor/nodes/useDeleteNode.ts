import useConnectionsStore from "@/stores/connectionsStore";
import useNodesStore from "@/stores/nodesStore";
import { NodeType } from "@/types/types";
import useGrouping from "@/hooks/editor/nodes/useGrouping";

export const useDeleteNode = () => {
    const removeNode = useNodesStore((state) => state.removeNode);
    const getNode = useNodesStore((state) => state.getNode);
    const removeConnections = useConnectionsStore((state) => state.removeConnections);
    const findInConnectionsByNodeId = useConnectionsStore((state) => state.findInConnectionsByNodeId);
    const findOutConnectionsByNodeId = useConnectionsStore((state) => state.findOutConnectionsByNodeId);
    const isNodeInGroup = useNodesStore((state) => state.isNodeInGroup);

    const { deleteGroup, removeNodeFromGroup } = useGrouping();

    const handleDeleteSelectedNodes = (selectedNodes: string[]) => {
        selectedNodes.map((nodeId) => {
            const node = getNode(nodeId);
            if (!node) return;
            if (node?.type === NodeType.Group) {
                deleteGroup(nodeId);
            }
            const groupId = isNodeInGroup(nodeId);
            if (groupId) {
                removeNodeFromGroup(groupId, nodeId);
            }
            handleDeleteNode(nodeId);
        });
    };

    const handleDeleteNode = (nodeId: string) => {
        const inConnections = findInConnectionsByNodeId(nodeId);
        const outConnections = findOutConnectionsByNodeId(nodeId);
        const connections = [...inConnections, ...outConnections];
        removeConnections(connections);
        removeNode(nodeId);
    };

    return { handleDeleteSelectedNodes, handleDeleteNode };
}
