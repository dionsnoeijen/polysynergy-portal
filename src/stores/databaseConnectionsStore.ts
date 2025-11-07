import {create, StateCreator} from 'zustand';
import {
    fetchDatabaseConnections as fetchDatabaseConnectionsAPI,
    createDatabaseConnection as createDatabaseConnectionAPI,
    updateDatabaseConnection as updateDatabaseConnectionAPI,
    deleteDatabaseConnection as deleteDatabaseConnectionAPI,
    testDatabaseConnection as testDatabaseConnectionAPI,
} from '@/api/databaseConnectionsApi';
import useEditorStore from "@/stores/editorStore";
import {DatabaseConnection, DatabaseConnectionTestResult} from "@/types/types";

type DatabaseConnectionsStore = {
    reset: () => void;
    isFetching: boolean;
    hasInitialFetched: boolean;
    connections: DatabaseConnection[];
    connectionsById: Record<string, DatabaseConnection>;
    getDatabaseConnection: (connectionId: string) => DatabaseConnection | undefined;
    fetchDatabaseConnections: () => Promise<void>;
    createDatabaseConnection: (connection: Omit<DatabaseConnection, 'id'>) => Promise<DatabaseConnection | undefined>;
    updateDatabaseConnection: (connectionId: string, connection: Partial<DatabaseConnection>) => Promise<void>;
    deleteDatabaseConnection: (connectionId: string) => Promise<void>;
    testDatabaseConnection: (connectionId: string) => Promise<DatabaseConnectionTestResult>;
};

const useDatabaseConnectionsStore = create<DatabaseConnectionsStore>((
    set: Parameters<StateCreator<DatabaseConnectionsStore>>[0]
) => ({
    reset: () => {
        set({
            connections: [],
            hasInitialFetched: false,
            connectionsById: {},
        });
    },

    isFetching: false,
    hasInitialFetched: false,

    connections: [],
    connectionsById: {},

    getDatabaseConnection: (connectionId): DatabaseConnection | undefined => {
        return useDatabaseConnectionsStore
            .getState()
            .connections
            .find((connection) => connection.id === connectionId);
    },

    fetchDatabaseConnections: async () => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        set({isFetching: true});
        try {
            const data: DatabaseConnection[] = await fetchDatabaseConnectionsAPI(activeProjectId);
            const connectionsById = data.reduce((acc, connection) => {
                acc[connection.id] = connection;
                return acc;
            }, {} as Record<string, DatabaseConnection>);

            set({
                connections: data,
                connectionsById,
                hasInitialFetched: true
            });
        } finally {
            set({isFetching: false});
        }
    },

    createDatabaseConnection: async (connection: Omit<DatabaseConnection, 'id'>) => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return undefined;

        const newConnection = await createDatabaseConnectionAPI(activeProjectId, connection);

        set((state) => ({
            connections: [...state.connections, newConnection],
            connectionsById: {
                ...state.connectionsById,
                [newConnection.id]: newConnection
            }
        }));

        return newConnection;
    },

    updateDatabaseConnection: async (connectionId: string, connection: Partial<DatabaseConnection>) => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        const updatedConnection = await updateDatabaseConnectionAPI(connectionId, activeProjectId, connection);

        set((state) => ({
            connections: state.connections.map((c) =>
                c.id === connectionId ? updatedConnection : c
            ),
            connectionsById: {
                ...state.connectionsById,
                [connectionId]: updatedConnection
            }
        }));
    },

    deleteDatabaseConnection: async (connectionId: string) => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        await deleteDatabaseConnectionAPI(connectionId, activeProjectId);

        set((state) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {[connectionId]: _deleted, ...remainingById} = state.connectionsById;
            return {
                connections: state.connections.filter((c) => c.id !== connectionId),
                connectionsById: remainingById
            };
        });
    },

    testDatabaseConnection: async (connectionId: string): Promise<DatabaseConnectionTestResult> => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) {
            return {
                success: false,
                message: 'No active project'
            };
        }

        return await testDatabaseConnectionAPI(connectionId, activeProjectId);
    }
}));

export default useDatabaseConnectionsStore;
