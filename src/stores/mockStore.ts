import { create } from 'zustand';

type MockConnection = {
    uuid: string;
    source_node_id: string;
    source_handle: string;
    target_node_id: string;
    target_handle: string;
    killer: boolean;
    touched: boolean;
}

type NodeVariables = {
    // eslint-disable-next-line
    [key: string]: any;
}

export type MockNode = {
    id: string;
    handle: string;
    order: number;
    type: string;
    killed: boolean;
    runId: string;
    started: boolean;
    variables: NodeVariables;
    status?: 'executing' | 'success' | 'error' | 'killed';
}

type MockState = {
    mockConnections: MockConnection[];
    setMockConnections(mockConnections: MockConnection[]): void;
    mockNodes: MockNode[];
    addOrUpdateMockNode: (node: MockNode) => void;
    getMockNode: (nodeId: string) => MockNode | undefined;
    getMockConnection: (connectionId: string) => MockConnection | undefined;
    clearMockStore: () => void;
    setHasMockData: (hasMockData: boolean) => void;
    hasMockData: boolean;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockResultsByNodeId: Record<string, any>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMockResultForNode: (nodeId: string, result: any) => void;
    clearMockResults: () => void;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getMockResultForNode: (nodeId: string) => any | undefined;
};

const useMockStore = create<MockState>((set, get) => ({
    mockConnections: [],
    setMockConnections: (mockConnections) => set({ mockConnections }),
    mockNodes: [],
    addOrUpdateMockNode: (newNode) => {
        const existing = get().mockNodes.find((n) => n.id === newNode.id);
        if (existing) {
            set({
                mockNodes: get().mockNodes.map((n) =>
                    n.id === newNode.id ? { ...existing, ...newNode } : n
                ),
            });
        } else {
            set({
                mockNodes: [...get().mockNodes, { ...newNode, order: get().mockNodes.length }],
            });
        }
    },
    getMockNode: (nodeId) => {
        return get().mockNodes.find((node) => node.id.replace(/-\d+$/, '') === nodeId);
    },
    getMockConnection: (connectionId) => {
        return get().mockConnections.find((connection) => connection.uuid === connectionId);
    },
    clearMockStore: () => {
        set({
            mockConnections: [],
            mockNodes: [],
            hasMockData: false
        });
    },
    setHasMockData: (hasMockData) => set({ hasMockData }),
    hasMockData: false,

    mockResultsByNodeId: {},
    setMockResultForNode: (nodeId, result) => set((state) => ({
        mockResultsByNodeId: {
            ...state.mockResultsByNodeId,
            [nodeId]: result,
        }
    })),
    clearMockResults: () => set({ mockResultsByNodeId: {} }),
    getMockResultForNode: (nodeId) => get().mockResultsByNodeId[nodeId] || undefined,
}));

export default useMockStore;