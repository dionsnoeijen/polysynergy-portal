import { useConnectionsStore } from "@/stores/connectionsStore";
import useNodesStore from "@/stores/nodesStore";
import { NodeType } from "@/types/types";
import useGrouping from "@/hooks/editor/nodes/useGrouping";

export const useDeleteNode = () => {
    const { removeNode, getNode } = useNodesStore();
    const {
        removeConnections,
        findInConnectionsByNodeId,
        findOutConnectionsByNodeId
    } = useConnectionsStore();
    const { deleteGroup } = useGrouping();

    const handleDeleteSelectedNodes = (selectedNodes: string[]) => {
        selectedNodes.map((nodeId) => {
            const node = getNode(nodeId);
            if (!node) return;
            if (node?.node_type === NodeType.Group) {
                deleteGroup(nodeId);
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
