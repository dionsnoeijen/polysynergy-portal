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
    hidden?: boolean;
    disabled?: boolean;
    targetGroupId?: string;
    sourceGroupId?: string;
};

type ConnectionsStore = {
    connections: Connection[];
    getConnection: (connectionId: string) => Connection | undefined;
    addConnection: (connection: Connection) => Connection;
    removeConnectionById: (connectionId: string) => void;
    removeConnection: (connection: Connection) => void;
    removeConnections: (connections: Connection[]) => void;
    updateConnection: (connection: Connection) => void;
    findInConnectionsByNodeId: (nodeId: string, includeGroupId?: boolean) => Connection[];
    findOutConnectionsByNodeId: (nodeId: string, includeGroupId?: boolean) => Connection[];
    findInConnectionsByNodeIdAndHandle: (nodeId: string, handle: string, matchExact?: boolean) => Connection[];
    findOutConnectionsByNodeIdAndHandle: (nodeId: string, handle: string, matchExact?: boolean) => Connection[];
    hideConnectionsByIds: (connectionIds: string[]) => void;
    showConnectionsByIds: (connectionIds: string[]) => void;
    updateConnectionEnd: (
        connectionId: string,
        endX: number,
        endY: number,
        targetNodeId?: string,
        targetHandle?: string
    ) => void;
    clearConnections: () => void;
};

const memoizedResults = new Map();

export const useConnectionsStore = create<ConnectionsStore>((set, get) => ({
    connections: [],

    getConnection: (connectionId: string): Connection | undefined => {
        return useConnectionsStore.getState()
            .connections
            .find((c) => c.id === connectionId);
    },

    addConnection: (connection: Connection): Connection => {
        memoizedResults.clear();
        set((state) => ({
            connections: [
                ...state.connections,
                { ...connection, hidden: connection.hidden ?? false },
            ],
        }));
        return connection;
    },

    removeConnectionById: (connectionId: string) => {
        memoizedResults.clear();
        set((state) => ({
            connections: state.connections.filter((c) => c.id !== connectionId),
        }));
    },

    removeConnection: (connection: Connection) => {
        memoizedResults.clear();
        set((state) => ({
            connections: state.connections.filter((c) => c.id !== connection.id),
        }));
    },

    removeConnections: (connections: Connection[]) => {
        memoizedResults.clear();
        set((state) => ({
            connections: state.connections.filter((c) => !connections.includes(c)),
        }));
    },

    updateConnection: (connection: Connection) => {
        memoizedResults.clear();
        set((state) => ({
            connections: state.connections.map((c) => {
                if (c.id === connection.id) {
                    return { ...c, ...connection };
                }
                return c;
            }),
        }));
    },

    findInConnectionsByNodeId: (
        nodeId: string,
        includeGroupId: boolean = false
    ): Connection[] => {
        const key = `in-${nodeId}-${includeGroupId}`;
        if (!memoizedResults.has(key)) {
            const result = get()
                .connections
                .filter((c) => {
                    if (!includeGroupId) {
                        return c.targetNodeId === nodeId
                    }
                    return c.targetNodeId === nodeId || c.targetGroupId === nodeId;
                });
            memoizedResults.set(key, result);
        }
        return memoizedResults.get(key);
    },

    findOutConnectionsByNodeId: (
        nodeId: string,
        includeGroupId: boolean = false
    ): Connection[] => {
        const key = `out-${nodeId}-${includeGroupId}`;
        if (!memoizedResults.has(key)) {
            const result = get()
                .connections
                .filter((c) => {
                    if (!includeGroupId) {
                        return c.sourceNodeId === nodeId;
                    }
                    return c.sourceNodeId === nodeId || c.sourceGroupId === nodeId;
                });
            memoizedResults.set(key, result);
        }
        return memoizedResults.get(key);
    },

    findInConnectionsByNodeIdAndHandle: (
        nodeId: string,
        handle: string,
        matchExact: boolean = true
    ): Connection[] => {
        return get()
            .connections
            .filter((c) => {
                if (c.targetGroupId) {
                    return (
                        c.targetGroupId === nodeId &&
                        (matchExact
                            ? c.targetHandle === handle
                            : c.targetHandle?.startsWith(handle))
                    );
                }

                return (
                    c.targetNodeId === nodeId &&
                    (matchExact
                        ? c.targetHandle === handle
                        : c.targetHandle?.startsWith(handle))
                );
            });
    },

    findOutConnectionsByNodeIdAndHandle: (
        nodeId: string,
        handle: string,
        matchExact: boolean = true
    ): Connection[] => {
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

    hideConnectionsByIds: (connectionIds: string[]) => {
        memoizedResults.clear();
        set((state) => ({
            connections: state.connections.map((c) => (
                connectionIds.includes(c.id) ? { ...c, hidden: true } : c)),
        }));
    },

    showConnectionsByIds: (connectionIds: string[]) => {
        memoizedResults.clear();
        set((state) => ({
            connections: state.connections.map((c) => (
                connectionIds.includes(c.id) ? { ...c, hidden: false } : c)),
        }));
    },

    updateConnectionEnd: (
        connectionId: string,
        endX: number,
        endY: number,
        targetNodeId?: string,
        targetHandle?: string
    ) => {
        memoizedResults.clear();
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
