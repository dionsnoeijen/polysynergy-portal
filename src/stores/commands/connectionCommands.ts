import { Command } from '../historyStore';
import { Connection } from '@/types/types';
import useConnectionsStore from '../connectionsStore';

// Command for adding a connection
export class AddConnectionCommand implements Command {
    private connection: Connection;
    private connectionBackup: Connection | null = null;

    constructor(connection: Connection) {
        this.connection = { ...connection }; // Deep copy
    }

    execute(): void {
        const result = useConnectionsStore.getState().addConnection(this.connection);
        if (result) {
            this.connectionBackup = result; // Store the actual connection that was added
        }
    }

    undo(): void {
        if (this.connectionBackup) {
            useConnectionsStore.getState().removeConnection(this.connectionBackup);
        } else {
            useConnectionsStore.getState().removeConnectionById(this.connection.id);
        }
    }

    getDescription(): string {
        return `Add connection: ${this.connection.sourceNodeId} → ${this.connection.targetNodeId}`;
    }
}

// Command for removing a connection
export class RemoveConnectionCommand implements Command {
    private connection: Connection;
    private connectionBackup: Connection;

    constructor(connectionId: string) {
        const existingConnection = useConnectionsStore.getState().getConnection(connectionId);
        if (!existingConnection) {
            throw new Error(`Connection with id ${connectionId} not found`);
        }
        this.connection = existingConnection;
        this.connectionBackup = JSON.parse(JSON.stringify(existingConnection)); // Deep copy
    }

    execute(): void {
        useConnectionsStore.getState().removeConnection(this.connection);
    }

    undo(): void {
        useConnectionsStore.getState().addConnection(this.connectionBackup);
    }

    getDescription(): string {
        return `Remove connection: ${this.connection.sourceNodeId} → ${this.connection.targetNodeId}`;
    }
}

// Command for updating a connection
export class UpdateConnectionCommand implements Command {
    private oldConnection: Connection;
    private newConnection: Connection;

    constructor(newConnection: Connection) {
        const existingConnection = useConnectionsStore.getState().getConnection(newConnection.id);
        if (!existingConnection) {
            throw new Error(`Connection with id ${newConnection.id} not found`);
        }
        
        this.oldConnection = JSON.parse(JSON.stringify(existingConnection)); // Deep copy
        this.newConnection = { ...newConnection }; // Deep copy
    }

    execute(): void {
        useConnectionsStore.getState().updateConnection(this.newConnection);
    }

    undo(): void {
        useConnectionsStore.getState().updateConnection(this.oldConnection);
    }

    getDescription(): string {
        return `Update connection: ${this.newConnection.sourceNodeId} → ${this.newConnection.targetNodeId}`;
    }
}

// Batch command for removing multiple connections
export class RemoveConnectionsCommand implements Command {
    private commands: RemoveConnectionCommand[] = [];

    constructor(connectionIds: string[]) {
        this.commands = connectionIds.map(id => new RemoveConnectionCommand(id));
    }

    execute(): void {
        this.commands.forEach(cmd => cmd.execute());
    }

    undo(): void {
        // Undo in reverse order
        this.commands.slice().reverse().forEach(cmd => cmd.undo());
    }

    getDescription(): string {
        return `Remove ${this.commands.length} connection${this.commands.length > 1 ? 's' : ''}`;
    }
}