import { useConnectionsStore } from "@/stores/connectionsStore";
import useNodesStore from "@/stores/nodesStore";

export const useDeleteNode = () => {
    const { removeNode } = useNodesStore();
    const {
        removeConnections,
        findInConnectionsByNodeId,
        findOutConnectionsByNodeId
    } = useConnectionsStore();

    const handleDeleteSelectedNodes = (selectedNodes: string[]) => {
        selectedNodes.map((nodeId) => {
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
