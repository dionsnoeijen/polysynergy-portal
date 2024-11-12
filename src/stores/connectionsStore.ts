import { create } from 'zustand';

export type Connection = {
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    sourceNodeUuid: string;
    sourceHandle: string;
    targetNodeUuid?: string;
    targetHandle?: string;
};

type ConnectionsStore = {
    connections: Connection[];
    getConnection: (connectionId: string) => Connection | undefined;
    getConnections: () => Connection[];
    addConnection: (connection: Connection) => void;
    removeConnectionById: (connectionId: string) => void;
    removeConnection: (connection: Connection) => void;
    updateConnection: (connection: Connection) => void;
    findInConnectionsByNodeId: (nodeId: string) => Connection[];
    findOutConnectionsByNodeId: (nodeId: string) => Connection[];
    updateConnectionEnd: (
        connectionId: string,
        endX: number,
        endY: number,
        targetNodeUuid?: string,
        targetHandle?: string
    ) => void;
    clearConnections: () => void;
};

export const useConnectionsStore = create<ConnectionsStore>((set) => ({
    connections: [],

    getConnection: (connectionId: string): Connection | undefined => {
        return useConnectionsStore.getState()
            .connections
            .find((c) => c.id === connectionId);
    },

    getConnections: (): Connection[] => {
        return useConnectionsStore.getState().connections;
    },

    addConnection: (connection: Connection) => {
        set((state) => ({ connections: [...state.connections, connection] }));
    },

    removeConnectionById: (connectionId: string) => {
        set((state) => ({
            connections: state.connections.filter((c) => c.id !== connectionId),
        }));
    },

    removeConnection: (connection: Connection) => {
        set((state) => ({
            connections: state.connections.filter((c) => c.id !== connection.id),
        }));
    },

    updateConnection: (connection: Connection) => {
        set((state) => ({
            connections: state.connections.map((c) => (c.id === connection.id ? connection : c)),
        }));
    },

    findInConnectionsByNodeId: (nodeId: string): Connection[] => {
        return useConnectionsStore
            .getState()
            .connections
            .filter((c) => c.targetNodeUuid === nodeId);
    },

    findOutConnectionsByNodeId: (nodeId: string): Connection[] => {
        return useConnectionsStore
            .getState()
            .connections
            .filter((c) => c.sourceNodeUuid === nodeId);
    },

    moveConnectionsRight(): void {

    },

    moveConnectionsLeft(): void {

    },

    updateConnectionEnd: (
        connectionId: string,
        endX: number,
        endY: number,
        targetNodeUuid?: string,
        targetHandle?: string
    ) => {

        // Make sure no connection can be made to self
        const connection = useConnectionsStore.getState().connections.find((c) => c.id === connectionId);
        if (connection?.sourceNodeUuid === targetNodeUuid) {
            useConnectionsStore.getState().removeConnectionById(connectionId);
            return;
        }

        set((state) => ({
            connections: state.connections.map((c) => (
                c.id === connectionId ? { ...c, endX, endY, targetNodeUuid, targetHandle } : c)),
        }));
    },

    clearConnections: () => {
        set({ connections: [] });
    },
}));
