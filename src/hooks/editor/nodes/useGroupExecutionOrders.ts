import { useMemo } from 'react';
import useNodesStore from '@/stores/nodesStore';
import useMockStore from '@/stores/mockStore';
import { NodeType } from '@/types/types';

export const useGroupExecutionOrders = (groupNodeId: string) => {
    const getNodesInGroup = useNodesStore(s => s.getNodesInGroup);
    const getNode = useNodesStore(s => s.getNode);
    const getMockNode = useMockStore(s => s.getMockNode);
    // Subscribe to mockNodes length to trigger re-render when mock data changes
    const mockNodesLength = useMockStore(s => s.mockNodes.length);

    const orders = useMemo(() => {
        const collectOrders = (nodeIds: string[]): number[] => {
            const result: number[] = [];

            for (const childId of nodeIds) {
                const childNode = getNode(childId);
                if (!childNode) continue;

                // If child is a group, recurse
                if (childNode.category === NodeType.Group) {
                    const nestedNodeIds = getNodesInGroup(childId);
                    result.push(...collectOrders(nestedNodeIds));
                } else {
                    // Regular node - get mock data (no run ID filtering)
                    const mockNode = getMockNode(childId);
                    if (mockNode && mockNode.order !== undefined) {
                        result.push(mockNode.order);
                    }
                }
            }

            return result;
        };

        const nodeIds = getNodesInGroup(groupNodeId);
        const allOrders = collectOrders(nodeIds);

        // Sort and return unique orders
        return [...new Set(allOrders)].sort((a, b) => a - b);
    }, [groupNodeId, getNodesInGroup, getNode, getMockNode, mockNodesLength]);

    return orders;
};
