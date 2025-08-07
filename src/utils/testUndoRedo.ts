// Test utility for undo/redo functionality
// This file demonstrates how to use the new history system

import { nodeHistoryActions, connectionHistoryActions } from '@/stores/history';
import { Node, Connection } from '@/types/types';

// Example: How to add a node with history tracking
export const addNodeWithHistory = (node: Node) => {
    nodeHistoryActions.addNodeWithHistory(node, false);
};

// Example: How to move multiple nodes with batching
export const moveSelectedNodesWithHistory = (nodePositions: Array<{ nodeId: string; x: number; y: number }>) => {
    // This will create a single undo/redo entry for moving all selected nodes
    nodeHistoryActions.moveNodesWithHistory(nodePositions);
};

// Example: How to perform a complex operation with manual batching
export const performComplexOperationWithHistory = (
    nodesToAdd: Node[],
    connectionsToAdd: Connection[],
    nodesToRemove: string[]
) => {
    // Start a batch operation
    nodeHistoryActions.startNodeBatch("Complex workflow operation");
    
    try {
        // Add nodes
        nodesToAdd.forEach(node => {
            nodeHistoryActions.addNodeWithHistory(node, false);
        });
        
        // Add connections
        connectionsToAdd.forEach(connection => {
            connectionHistoryActions.addConnectionWithHistory(connection);
        });
        
        // Remove nodes
        nodesToRemove.forEach(nodeId => {
            nodeHistoryActions.removeNodeWithHistory(nodeId);
        });
        
        // End batch - this creates a single undo/redo entry
        nodeHistoryActions.endNodeBatch();
    } catch (error) {
        // Cancel batch if something goes wrong
        nodeHistoryActions.cancelNodeBatch();
        throw error;
    }
};

// Usage examples:
// 1. Simple node addition: addNodeWithHistory(newNode);
// 2. Moving nodes: moveSelectedNodesWithHistory([{nodeId: '1', x: 100, y: 200}]);
// 3. Complex operations: performComplexOperationWithHistory(nodes, connections, nodeIds);