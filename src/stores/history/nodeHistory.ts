import { Node, NodeVariable } from '@/types/types';
import { useHistoryStore } from '../historyStore';
import {
    AddNodeCommand,
    RemoveNodeCommand,
    UpdateNodePositionCommand,
    UpdateNodeCommand,
    UpdateNodeVariableCommand,
    MoveNodesCommand
} from '../commands';

// History-enabled wrapper functions for node operations
export const nodeHistoryActions = {
    // Add node with history
    addNodeWithHistory: (node: Node, forceNewHandle = false) => {
        const command = new AddNodeCommand(node, forceNewHandle);
        command.execute();
        useHistoryStore.getState().pushCommand(command);
    },

    // Remove node with history
    removeNodeWithHistory: (nodeId: string) => {
        const command = new RemoveNodeCommand(nodeId);
        command.execute();
        useHistoryStore.getState().pushCommand(command);
    },

    // Update node position with history
    updateNodePositionWithHistory: (nodeId: string, x: number, y: number) => {
        const command = new UpdateNodePositionCommand(nodeId, x, y);
        command.execute();
        useHistoryStore.getState().pushCommand(command);
    },

    // Update node with history
    updateNodeWithHistory: (nodeId: string, updatedFields: Partial<Node>) => {
        const command = new UpdateNodeCommand(nodeId, updatedFields);
        command.execute();
        useHistoryStore.getState().pushCommand(command);
    },

    // Update node variable with history
    updateNodeVariableWithHistory: (nodeId: string, variableHandle: string, newValue: null | string | number | boolean | string[] | NodeVariable[]) => {
        const command = new UpdateNodeVariableCommand(nodeId, variableHandle, newValue);
        command.execute();
        useHistoryStore.getState().pushCommand(command);
    },

    // Move multiple nodes with history (batched operation)
    moveNodesWithHistory: (nodePositions: Array<{ nodeId: string; x: number; y: number }>) => {
        const command = new MoveNodesCommand(nodePositions);
        command.execute();
        useHistoryStore.getState().pushCommand(command);
    },

    // Batch operations - useful for complex multi-node operations
    startNodeBatch: (description: string) => {
        useHistoryStore.getState().startBatch(description);
    },

    endNodeBatch: () => {
        useHistoryStore.getState().endBatch();
    },

    cancelNodeBatch: () => {
        useHistoryStore.getState().cancelBatch();
    }
};

// Example of how to use batched operations:
//
// // Move multiple selected nodes
// nodeHistoryActions.startNodeBatch("Move selected nodes");
// selectedNodes.forEach(node => {
//     nodeHistoryActions.updateNodePositionWithHistory(node.id, node.x + deltaX, node.y + deltaY);
// });
// nodeHistoryActions.endNodeBatch();
//
// // This will create a single undo/redo entry for the entire operation