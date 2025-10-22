import { useEffect } from 'react';
import useNodesStore from '@/stores/nodesStore';
import useConnectionsStore from '@/stores/connectionsStore';
import { NodeType, Connection } from '@/types/types';

const VISUAL_CONNECTION_PREFIX = 'warp-visual-source-';

/**
 * Hook to manage warp gate highlights when their source node is selected
 * Shows visual connections from all warp gates that point to this source node
 */
export const useSourceNodeWarpGateHighlight = (
    nodeId: string,
    isSelected: boolean
) => {
    useEffect(() => {
        if (!isSelected) {
            // Remove all visual connections for this source node
            const allConnections = useConnectionsStore.getState().connections;
            const visualConnectionsToRemove = allConnections.filter(conn =>
                conn.id.startsWith(`${VISUAL_CONNECTION_PREFIX}${nodeId}-`)
            );

            visualConnectionsToRemove.forEach(conn => {
                useConnectionsStore.getState().removeConnectionById(conn.id);
            });
            return;
        }

        // Find all warp gates that point to this source node
        const allNodes = useNodesStore.getState().nodes;
        const warpGates = allNodes.filter(node =>
            node.type === NodeType.WarpGate &&
            node.warpGate?.sourceNodeId === nodeId
        );

        // Wait for next frame to ensure DOM is updated
        const frame = requestAnimationFrame(() => {
            warpGates.forEach(gate => {
                const visualConnectionId = `${VISUAL_CONNECTION_PREFIX}${nodeId}-${gate.id}`;

                // Check if connection already exists
                const existingConnection = useConnectionsStore.getState().getConnection(visualConnectionId);
                if (existingConnection) return;

                const visualConnection: Connection = {
                    id: visualConnectionId,
                    sourceNodeId: gate.warpGate!.sourceNodeId,
                    sourceHandle: gate.warpGate!.sourceHandle,
                    targetNodeId: gate.id,
                    targetHandle: 'in_visual',
                    hidden: false,
                    disabled: false,
                    collapsed: false,
                };

                useConnectionsStore.getState().addConnection(visualConnection);
            });
        });

        // Cleanup
        return () => {
            cancelAnimationFrame(frame);
            const allConnections = useConnectionsStore.getState().connections;
            const visualConnectionsToRemove = allConnections.filter(conn =>
                conn.id.startsWith(`${VISUAL_CONNECTION_PREFIX}${nodeId}-`)
            );

            visualConnectionsToRemove.forEach(conn => {
                useConnectionsStore.getState().removeConnectionById(conn.id);
            });
        };
    }, [nodeId, isSelected]);
};
