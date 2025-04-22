import {create} from 'zustand';
import {Connection, FlowState, Node, NodeEnabledConnector} from "@/types/types";
import useNodesStore from "@/stores/nodesStore";

type ConnectionsStore = {
    connections: Connection[];

    addTempConnections: (connections: Connection[]) => void;
    clearTempConnections: () => void;

    updateConnectionsHandle: (
        nodeId: string,
        fromHandle: string,
        toHandle: string
    ) => void;

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
    hideConnectionsOutsideGroup: () => Connection[];
    getConnectionsInsideGroup: (group: Node) => Connection[];
    removeConnectionsLinkedToVariable: (nodeId: string, variableName: string) => void;
    takeConnectionsOutOfGroup: (groupId: string) => Connection[];
    updateConnectionEnd: (
        connectionId: string,
        endX: number,
        endY: number,
        targetNodeId?: string,
        targetHandle?: string
    ) => void;
    clearConnections: () => void;
    initConnections: (connections: Connection[]) => void;
    isValueConnected: (nodeId: string, handle: string) => boolean;
};

const memoizedResults = new Map();

const useConnectionsStore = create<ConnectionsStore>((set, get) => ({
    connections: [],

    addTempConnections: (connections: Connection[]) => {
        connections.map((connection) => {
            connection.temp = true;
        });
        set((state) => ({
            connections: [
                ...state.connections,
                ...connections,
            ],
        }));
    },

    clearTempConnections: () => {
        set((state) => ({
            connections: state.connections.filter((c) => !c.temp),
        }));
    },

    updateConnectionsHandle: (
        nodeId: string,
        fromHandle: string,
        toHandle: string
    ) => {
        const { connections } = get();
        const updated = connections.map((c) => {
            if (c.targetNodeId === nodeId && c.targetHandle === fromHandle) {
                return { ...c, targetHandle: toHandle };
            }
            if (c.sourceNodeId === nodeId && c.sourceHandle === fromHandle) {
                return { ...c, sourceHandle: toHandle };
            }
            return c;
        });
        set({ connections: updated });
    },

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
                {...connection, hidden: connection.hidden ?? false},
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
                    return {...c, ...connection};
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
            connections: state.connections.map((c) => ({...c, hidden: true})),
        }));
    },

    showAllConnections: () => {
        memoizedResults.clear();
        set((state) => ({
            connections: state.connections.map((c) => ({...c, hidden: false})),
        }));
    },

    hideConnectionsByIds: (connectionIds: string[]) => {
        memoizedResults.clear();
        set((state) => ({
            connections: state.connections.map((c) => (
                connectionIds.includes(c.id) ? {...c, hidden: true} : c)),
        }));
    },

    showConnectionsByIds: (connectionIds: string[]) => {
        memoizedResults.clear();
        set((state) => ({
            connections: state.connections.map((c) => (
                connectionIds.includes(c.id) ? {...c, hidden: false} : c)),
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

    hideConnectionsOutsideGroup: (): Connection[] => {
        memoizedResults.clear();

        useConnectionsStore.getState().hideAllConnections();

        const hideConnections = useConnectionsStore
            .getState()
            .getConnectionsNotInAGroup();

        console.log(hideConnections);

        useConnectionsStore.getState()
            .hideConnectionsByIds(hideConnections.map((c) => c.id));

        return hideConnections;
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

    removeConnectionsLinkedToVariable: (nodeId: string, variableName: string) => {
        const { connections } = get();

        const isRelevantConnection = (c: Connection) =>
            (c.targetNodeId === nodeId && c.targetHandle?.startsWith(variableName)) ||
            (c.sourceNodeId === nodeId && c.sourceHandle?.startsWith(variableName));

        const connectionsToRemove = connections.filter(isRelevantConnection);

        if (connectionsToRemove.length > 0) {
            get().removeConnections(connectionsToRemove);
        }
    },

    takeConnectionsOutOfGroup: (groupId: string): Connection[] => {
        memoizedResults.clear();

        const connectionsInGroup: Connection[] = get().connections.filter(
            (connection) => connection.isInGroup === groupId
        );

        if (connectionsInGroup.length === 0) {
            return [];
        }

        set((state) => ({
            connections: state.connections.map((c): Connection =>
                c.isInGroup === groupId ? {...c, isInGroup: null} : c
            ),
        }));

        return connectionsInGroup;
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
                c.id === connectionId ? {...c, endX, endY, targetNodeId, targetHandle} : c)),
        }));
    },

    clearConnections: () => {
        set({connections: []});
    },

    initConnections: (connections: Connection[]) => {
        set({connections});
    },

    isValueConnected: (nodeId: string, handle: string): boolean => {
        return useConnectionsStore
            .getState()
            .connections
            .some((c) => c.targetNodeId === nodeId && c.targetHandle === handle);
    },
}));

export default useConnectionsStore;
