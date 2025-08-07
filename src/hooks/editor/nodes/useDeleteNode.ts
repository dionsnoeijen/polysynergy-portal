import useConnectionsStore from "@/stores/connectionsStore";
import useNodesStore from "@/stores/nodesStore";
import { NodeType } from "@/types/types";
import useGrouping from "@/hooks/editor/nodes/useGrouping";
import { nodeHistoryActions, connectionHistoryActions } from "@/stores/history";

export const useDeleteNode = () => {
    const removeNode = useNodesStore((state) => state.removeNode);
    const getNode = useNodesStore((state) => state.getNode);
    const removeConnections = useConnectionsStore((state) => state.removeConnections);
    const findInConnectionsByNodeId = useConnectionsStore((state) => state.findInConnectionsByNodeId);
    const findOutConnectionsByNodeId = useConnectionsStore((state) => state.findOutConnectionsByNodeId);
    const isNodeInGroup = useNodesStore((state) => state.isNodeInGroup);

    const { deleteGroup, removeNodeFromGroup } = useGrouping();

    const handleDeleteSelectedNodes = (selectedNodes: string[]) => {
        // Use batching for multiple node deletions
        if (selectedNodes.length > 1) {
            nodeHistoryActions.startNodeBatch(`Delete ${selectedNodes.length} nodes`);
        }
        
        try {
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
            
            if (selectedNodes.length > 1) {
                nodeHistoryActions.endNodeBatch();
            }
        } catch (error) {
            if (selectedNodes.length > 1) {
                nodeHistoryActions.cancelNodeBatch();
            }
            throw error;
        }
    };

    const handleDeleteNode = (nodeId: string) => {
        const inConnections = findInConnectionsByNodeId(nodeId);
        const outConnections = findOutConnectionsByNodeId(nodeId);
        const connections = [...inConnections, ...outConnections];
        
        // Remove connections with history
        connections.forEach(connection => {
            connectionHistoryActions.removeConnectionWithHistory(connection.id);
        });
        
        // Remove node with history
        nodeHistoryActions.removeNodeWithHistory(nodeId);
    };

    return { handleDeleteSelectedNodes, handleDeleteNode };
}
