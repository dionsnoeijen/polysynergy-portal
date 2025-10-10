import { WebSocketManager, ConnectionStatus } from './WebSocketManager';
import config from '@/config';

interface GlobalWebSocketConnection {
    manager: WebSocketManager;
    connectionStatus: ConnectionStatus;
    isConnected: boolean;
    subscribers: Set<(status: ConnectionStatus, isConnected: boolean) => void>;
    messageHandlers: Set<(event: MessageEvent) => void>;
}

class GlobalWebSocketSingleton {
    private connections = new Map<string, GlobalWebSocketConnection>();

    getOrCreateConnection(flowId: string): GlobalWebSocketConnection {
        if (this.connections.has(flowId)) {
            console.log('🔌 GLOBAL SINGLETON: Reusing existing connection for', flowId);
            return this.connections.get(flowId)!;
        }

        console.log('🔌 GLOBAL SINGLETON: Creating NEW connection for', flowId);
        const websocketUrl = `${config.WEBSOCKET_URL}/execution/${flowId}`;

        const manager = new WebSocketManager(websocketUrl, {
            debug: true,
            heartbeatInterval: 30000,
            pingTimeout: 5000,
            maxReconnectAttempts: 10,
            maxBackoffDelay: 30000
        });

        const connection: GlobalWebSocketConnection = {
            manager,
            connectionStatus: 'disconnected' as ConnectionStatus,
            isConnected: false,
            subscribers: new Set(),
            messageHandlers: new Set()
        };

        // Subscribe to status changes and notify all subscribers
        manager.onStatusChange((status: ConnectionStatus) => {
            connection.connectionStatus = status;
            connection.isConnected = status === 'connected';
            console.log('🔌 GLOBAL SINGLETON: Status changed for', flowId, status);

            connection.subscribers.forEach(callback => {
                callback(status, connection.isConnected);
            });
        });

        // Subscribe to messages and forward to all handlers
        manager.onMessage((event: MessageEvent) => {
            connection.messageHandlers.forEach(handler => handler(event));
        });

        // Connect immediately
        manager.connect();

        this.connections.set(flowId, connection);
        return connection;
    }

    subscribe(flowId: string, statusCallback: (status: ConnectionStatus, isConnected: boolean) => void, messageHandler?: (event: MessageEvent) => void) {
        const connection = this.getOrCreateConnection(flowId);

        connection.subscribers.add(statusCallback);

        // Only add message handler if it's not already in the set
        // This prevents duplicate processing when the same singleton handler is passed multiple times
        if (messageHandler && !connection.messageHandlers.has(messageHandler)) {
            console.log('🔌 GLOBAL SINGLETON: Adding message handler for', flowId, 'Total handlers:', connection.messageHandlers.size + 1);
            connection.messageHandlers.add(messageHandler);
        } else if (messageHandler) {
            console.log('🔌 GLOBAL SINGLETON: Message handler already exists for', flowId, '- skipping duplicate');
        }

        // Immediately call with current status
        statusCallback(connection.connectionStatus, connection.isConnected);

        // Return unsubscribe function
        return () => {
            connection.subscribers.delete(statusCallback);
            // Note: We don't delete the messageHandler here anymore because it's a singleton
            // The handler will be removed when the last subscriber unsubscribes

            // If no more status subscribers, we can consider cleaning up
            if (connection.subscribers.size === 0) {
                console.log('🔌 GLOBAL SINGLETON: No more status subscribers, closing connection for', flowId);
                connection.messageHandlers.clear(); // Clear all message handlers
                connection.manager.disconnect();
                this.connections.delete(flowId);
            }
        };
    }

    forceCloseAll() {
        console.log('🔌 GLOBAL SINGLETON: Force closing all connections:', this.connections.size);
        this.connections.forEach((connection, flowId) => {
            console.log('🔌 GLOBAL SINGLETON: Closing', flowId);
            connection.manager.disconnect();
        });
        this.connections.clear();
    }
}

// Create the global singleton instance
const globalWebSocketSingleton = new GlobalWebSocketSingleton();

// Force close all connections immediately on module load
globalWebSocketSingleton.forceCloseAll();

export default globalWebSocketSingleton;