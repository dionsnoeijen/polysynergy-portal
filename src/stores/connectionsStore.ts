import {create} from 'zustand';
import {Connection, FlowState, Node, NodeEnabledConnector} from "@/types/types";
import useNodesStore from "@/stores/nodesStore";

type ConnectionsStore = {
    connections: Connection[];
    getConnection: (connectionId: string) => Connection | undefined;
    addConnection: (connection: Connection) => Connection | undefined;
    removeConnectionById: (connectionId: string) => void;
    removeConnection: (connection: Connection) => void;
    removeConnections: (connections: Connection[]) => void;
    updateConnection: (connection: Connection) => void;
    findInConnectionsByNodeId: (nodeId: string, includeGroupId?: boolean, includeHidden?: boolean) => Connection[];
    findOutConnectionsByNodeId: (nodeId: string, includeGroupId?: boolean, includeHidden?: boolean) => Connection[];
    findInConnectionsByNodeIdAndHandle: (nodeId: string, handle: string, matchExact?: boolean) => Connection[];
    findOutConnectionsByNodeIdAndHandle: (nodeId: string, handle: string, matchExact?: boolean) => Connection[];
    hideAllConnections: () => void;
    showAllConnections: () => void;
    hideConnectionsByIds: (connectionIds: string[]) => void;
    showConnectionsByIds: (connectionIds: string[]) => void;
    showConnectionsInsideOpenGroup: (group: Node) => Connection[];
    getConnectionsNotInAGroup: () => Connection[];
    showConnectionsOutsideGroup: () => Connection[];
    getConnectionsInsideGroup: (group: Node) => Connection[];
    updateConnectionEnd: (
        connectionId: string,
        endX: number,
        endY: number,
        targetNodeId?: string,
        targetHandle?: string
    ) => void;
    clearConnections: () => void;
    initConnections: (connections: Connection[]) => void;
};

const memoizedResults = new Map();

const useConnectionsStore = create<ConnectionsStore>((set, get) => ({
    connections: [],

    getConnection: (connectionId: string): Connection | undefined => {
        return useConnectionsStore.getState()
            .connections
            .find((c) => c.id === connectionId);
    },

    addConnection: (connection: Connection): Connection | undefined => {
        memoizedResults.clear();

        if (connection.targetHandle === NodeEnabledConnector.Node) {
            if (!connection.targetNodeId) return;

            useNodesStore.getState().driveNode(connection.targetNodeId);
        }

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

        const connection = useConnectionsStore
            .getState()
            .connections.find((c) => c.id === connectionId);

        if (!connection) return;
        if (connection.targetHandle === NodeEnabledConnector.Node) {
            if (!connection.targetNodeId) return;
            useNodesStore
                .getState()
                .setNodeFlowState(connection.targetNodeId, FlowState.FlowStop);
        }

        set((state) => ({
            connections: state.connections.filter((c) => c.id !== connectionId),
        }));
    },

    removeConnection: (connection: Connection) => {
        memoizedResults.clear();

        if (connection.targetHandle === NodeEnabledConnector.Node) {
            if (!connection.targetNodeId) return;

            useNodesStore.getState().setNodeFlowState(connection.targetNodeId, FlowState.Enabled);
        }

        set((state) => ({
            connections: state.connections.filter((c) => c.id !== connection.id),
        }));
    },

    removeConnections: (connectionsToRemove: Connection[]) => {
        memoizedResults.clear();

        const idsToRemove = new Set(connectionsToRemove.map((conn) => conn.id));

        connectionsToRemove.forEach((connection: Connection) => {
            if (connection.targetHandle === NodeEnabledConnector.Node) {
                if (!connection.targetNodeId) return;

                useNodesStore.getState().setNodeFlowState(connection.targetNodeId, FlowState.Enabled);
            }
        });

        set((state) => ({
            connections: state.connections.filter((c) => !idsToRemove.has(c.id)),
        }));
    },

    updateConnection: (connection: Connection) => {
        memoizedResults.clear();

        if (connection.targetHandle === NodeEnabledConnector.Node) {
            if (!connection.targetNodeId) return;
            useNodesStore.getState().driveNode(connection.targetNodeId);
        }

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
        includeGroupId: boolean = false,
        includeHidden: boolean = true
    ): Connection[] => {
        const key = `in-${nodeId}-${includeGroupId}-${includeHidden}`;
        if (!memoizedResults.has(key)) {
            const result = get().connections.filter((c) => {
                const matchesNode = includeGroupId
                    ? c.targetNodeId === nodeId || c.targetGroupId === nodeId
                    : c.targetNodeId === nodeId;

                if (!matchesNode) return false;

                return !(!includeHidden && c.hidden);
            });

            memoizedResults.set(key, result);
        }
        return memoizedResults.get(key);
    },

    findOutConnectionsByNodeId: (
        nodeId: string,
        includeGroupId: boolean = false,
        includeHidden: boolean = true
    ): Connection[] => {
        const key = `out-${nodeId}-${includeGroupId}-${includeHidden}`;
        if (!memoizedResults.has(key)) {
            const result = get().connections.filter((c) => {
                const matchesNode = includeGroupId
                    ? (c.sourceNodeId === nodeId || c.sourceGroupId === nodeId)
                    : (c.sourceNodeId === nodeId);

                if (!matchesNode) return false;
                return !(!includeHidden && c.hidden);
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
                            : c.targetHandle?.startsWith(handle + '.'))
                    );
                }
                return (
                    c.targetNodeId === nodeId &&
                    (matchExact
                        ? c.targetHandle === handle
                        : c.targetHandle?.startsWith(handle + '.'))
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
                    : c.sourceHandle?.startsWith(handle + '.'))
            );
    },

    hideAllConnections: () => {
        memoizedResults.clear();
        set((state) => ({
            connections: state.connections.map((c) => ({ ...c, hidden: true })),
        }));
    },

    showAllConnections: () => {
        memoizedResults.clear();
        set((state) => ({
            connections: state.connections.map((c) => ({ ...c, hidden: false })),
        }));
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

    showConnectionsOutsideGroup: (): Connection[] => {
        memoizedResults.clear();

        useConnectionsStore.getState().hideAllConnections();

        const showConnections = useConnectionsStore
            .getState()
            .getConnectionsNotInAGroup();

        useConnectionsStore.getState()
            .showConnectionsByIds(showConnections.map((c) => c.id));

        return showConnections;
    },

    showConnectionsInsideOpenGroup: (group: Node): Connection[] => {
        memoizedResults.clear();
        useConnectionsStore.getState().hideAllConnections();
        const showConnections = useConnectionsStore
            .getState()
            .getConnectionsInsideGroup(group);

        useConnectionsStore.getState().showConnectionsByIds(showConnections.map((c) => c.id));
        return showConnections;
    },

    getConnectionsNotInAGroup: (): Connection[] => {
        memoizedResults.clear();

        return useConnectionsStore
            .getState()
            .connections
            .filter((connection) => (connection.isInGroup === null));
    },

    getConnectionsInsideGroup: (group: Node): Connection[] => {
        memoizedResults.clear();

        const connectionsInOpenGroup =
            get().connections.filter((connection) => (
                connection.isInGroup === group.id
            ));

        if (!connectionsInOpenGroup || connectionsInOpenGroup.length === 0) {
            return [];
        }

        return connectionsInOpenGroup;
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

    initConnections: (connections: Connection[]) => {
        set({ connections });
    }
}));

export default useConnectionsStore;
