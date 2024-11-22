import { create } from 'zustand';

export type Connection = {
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    sourceNodeId: string;
    sourceHandle: string;
    targetNodeId?: string;
    targetHandle?: string;
    collapsed?: boolean;
};

type ConnectionsStore = {
    connections: Connection[];
    getConnection: (connectionId: string) => Connection | undefined;
    addConnection: (connection: Connection) => void;
    removeConnectionById: (connectionId: string) => void;
    removeConnection: (connection: Connection) => void;
    removeConnections: (connections: Connection[]) => void;
    updateConnection: (connection: Connection) => void;
    findInConnectionsByNodeId: (nodeId: string) => Connection[];
    findOutConnectionsByNodeId: (nodeId: string) => Connection[];
    findInConnectionsByNodeIdAndHandle: (nodeId: string, handle: string, matchExact?: boolean) => Connection[];
    findOutConnectionsByNodeIdAndHandle: (nodeId: string, handle: string, matchExact?: boolean) => Connection[];
    updateConnectionEnd: (
        connectionId: string,
        endX: number,
        endY: number,
        targetNodeId?: string,
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

    removeConnections: (connections: Connection[]) => {
        set((state) => ({
            connections: state.connections.filter((c) => !connections.includes(c)),
        }));
    },

    updateConnection: (connection: Connection) => {
        set((state) => ({
            connections: state.connections.map((c) =>
                c.id === connection.id ? connection : c
            ),
        }));
    },

    findInConnectionsByNodeId: (nodeId: string): Connection[] => {
        return useConnectionsStore
            .getState()
            .connections
            .filter((c) => c.targetNodeId === nodeId);
    },

    findOutConnectionsByNodeId: (nodeId: string): Connection[] => {
        return useConnectionsStore
            .getState()
            .connections
            .filter((c) => c.sourceNodeId === nodeId);
    },

    findInConnectionsByNodeIdAndHandle: (nodeId: string, handle: string, matchExact: boolean = true): Connection[] => {
        return useConnectionsStore
            .getState()
            .connections
            .filter((c) =>
                c.targetNodeId === nodeId &&
                (matchExact
                    ? c.targetHandle === handle
                    : c.targetHandle?.startsWith(handle))
            );
    },

    findOutConnectionsByNodeIdAndHandle: (nodeId: string, handle: string, matchExact: boolean = true): Connection[] => {
        return useConnectionsStore
            .getState()
            .connections
            .filter((c) =>
                c.sourceNodeId === nodeId &&
                (matchExact
                    ? c.sourceHandle === handle
                    : c.sourceHandle?.startsWith(handle))
            );
    },

    updateConnectionEnd: (
        connectionId: string,
        endX: number,
        endY: number,
        targetNodeId?: string,
        targetHandle?: string
    ) => {
        const connection = useConnectionsStore.getState().connections.find((c) => c.id === connectionId);
        if (connection?.sourceNodeId === targetNodeId) {
            useConnectionsStore.getState().removeConnectionById(connectionId);
            return;
        }

        set((state) => ({
            connections: state.connections.map((c) => (
                c.id === connectionId ? { ...c, endX, endY, targetNodeId, targetHandle } : c)),
        }));
    },

    clearConnections: () => {
        set({ connections: [] });
    },
}));
