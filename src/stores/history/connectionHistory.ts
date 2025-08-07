import { Connection } from '@/types/types';
import { useHistoryStore } from '../historyStore';
import {
    AddConnectionCommand,
    RemoveConnectionCommand,
    UpdateConnectionCommand,
    RemoveConnectionsCommand
} from '../commands';

// History-enabled wrapper functions for connection operations
export const connectionHistoryActions = {
    // Add connection with history
    addConnectionWithHistory: (connection: Connection) => {
        const command = new AddConnectionCommand(connection);
        command.execute();
        useHistoryStore.getState().pushCommand(command);
    },

    // Remove connection with history
    removeConnectionWithHistory: (connectionId: string) => {
        const command = new RemoveConnectionCommand(connectionId);
        command.execute();
        useHistoryStore.getState().pushCommand(command);
    },

    // Update connection with history
    updateConnectionWithHistory: (connection: Connection) => {
        const command = new UpdateConnectionCommand(connection);
        command.execute();
        useHistoryStore.getState().pushCommand(command);
    },

    // Remove multiple connections with history
    removeConnectionsWithHistory: (connectionIds: string[]) => {
        const command = new RemoveConnectionsCommand(connectionIds);
        command.execute();
        useHistoryStore.getState().pushCommand(command);
    },

    // Batch operations for connections
    startConnectionBatch: (description: string) => {
        useHistoryStore.getState().startBatch(description);
    },

    endConnectionBatch: () => {
        useHistoryStore.getState().endBatch();
    },

    cancelConnectionBatch: () => {
        useHistoryStore.getState().cancelBatch();
    }
};

// Example usage:
//
// // Remove all connections for a node being deleted
// connectionHistoryActions.startConnectionBatch("Remove node connections");
// const nodeConnections = getAllConnectionsForNode(nodeId);
// nodeConnections.forEach(conn => {
//     connectionHistoryActions.removeConnectionWithHistory(conn.id);
// });
// connectionHistoryActions.endConnectionBatch();