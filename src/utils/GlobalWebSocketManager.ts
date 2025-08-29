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
            enabled: true,
            autoConnect: true,
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
        if (messageHandler) {
            connection.messageHandlers.add(messageHandler);
        }

        // Immediately call with current status
        statusCallback(connection.connectionStatus, connection.isConnected);

        // Return unsubscribe function
        return () => {
            connection.subscribers.delete(statusCallback);
            if (messageHandler) {
                connection.messageHandlers.delete(messageHandler);
            }

            // If no more subscribers, close the connection
            if (connection.subscribers.size === 0 && connection.messageHandlers.size === 0) {
                console.log('🔌 GLOBAL SINGLETON: No more subscribers, closing connection for', flowId);
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