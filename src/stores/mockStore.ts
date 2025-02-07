import { create } from 'zustand';

type MockConnection = {
    uuid: string;
    source_node_id: string;
    source_handle: string;
    target_node_id: string;
    target_handle: string;
    killer: boolean;
}

type NodeVariables = {
    // eslint-disable-next-line
    [key: string]: any;
}

export type MockNode = {
    id: string;
    order: number;
    type: string;
    is_killed: boolean;
    variables: NodeVariables;
}

type MockState = {
    mockConnections: MockConnection[];
    setMockConnections(mockConnections: MockConnection[]): void;
    mockNodes: MockNode[];
    setMockNodes(mockNodes: MockNode[]): void;
    getMockNode: (nodeId: string) => MockNode | undefined;
    getMockConnection: (connectionId: string) => MockConnection | undefined;
    clearMockStore: () => void;
    hasMockData: () => boolean;
};

const useMockStore = create<MockState>((set, get) => ({
    mockConnections: [],
    setMockConnections: (mockConnections) => set({ mockConnections }),
    mockNodes: [],
    setMockNodes: (incomingMockNodes) => set(() => {
      if (!Array.isArray(incomingMockNodes)) {
        return { mockNodes: [] };
      }
      return {
        mockNodes: incomingMockNodes.map((node, index) => ({
          ...node,
          order: index
        }))
      };
    }),
    getMockNode: (nodeId: string) => {
        return get().mockNodes.find((node) => node.id === nodeId);
    },
    getMockConnection: (connectionId: string) => {
        return get().mockConnections.find((connection) => connection.uuid === connectionId);
    },
    clearMockStore: () => {
        set({
            mockConnections: [],
            mockNodes: []
        });
    },
    hasMockData: () => {
        return get().mockConnections.length > 0 || get().mockNodes.length > 0
    }
}));

export default useMockStore;