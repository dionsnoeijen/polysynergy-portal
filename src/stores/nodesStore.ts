import { create } from 'zustand';

export enum NodeVariableType {
    String = 'string',
    Number = 'number',
    Boolean = 'boolean',
    Array = 'array'
}

export type NodeVariable = {
    name: string;
    handle: string;
    value?: null | string | number | boolean | string[] | NodeVariable[];
    default_value?: null | string | number | boolean | string[] | NodeVariable[];
    type: NodeVariableType;
    has_dock?: boolean;
};

export type NodeView = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type Node = {
    id: string;
    name: string;
    type: string;
    view: NodeView;
    enabled: string[] | boolean;
    variables: NodeVariable[];
};

type NodesStore = {
    nodes: Node[];
    addNode: (node: Node) => void;
    removeNode: (nodeId: string) => void;
    updateNode: (nodeId: string, updatedFields: Partial<Node>) => void;
    updateNodePosition: (nodeId: string, deltaX: number, deltaY: number) => void;
    updateNodeWidth: (nodeId: string, width: number) => void;
    updateNodeHeight: (nodeId: string, height: number) => void;
    getNode: (nodeId: string) => Node | undefined;
    getNodes: () => Node[];
    getNodesByIds: (nodeIds: string[]) => Node[];
    getNodeVariable: (nodeId: string, variableHandle: string) => NodeVariable | undefined;
    updateNodeVariable: (nodeId: string, variableHandle: string, newValue: any) => void;
};

const nodesByIdsCache = new Map<string, Node[]>();

const useNodesStore = create<NodesStore>((set, get) => ({
    nodes: [
        {
            id: 'e8941d69-af86-4cbc-83cd-758c8b80e89c',
            view: {
                x: 100,
                y: 100,
                width: 200,
                height: 200,
            },
            name: 'Route',
            type: 'route',
            enabled: true,
            variables: [
                {
                    name: 'Route Variables',
                    handle: 'routeVariables',
                    value: [
                        {
                            name: '{amount}',
                            handle: 'amount',
                            value: null,
                            default_value: 30,
                            type: NodeVariableType.String,
                        },
                        {
                            name: '{age}',
                            handle: 'age',
                            value: 30,
                            type: NodeVariableType.Number,
                        },
                        {
                            name: '{id}',
                            handle: 'id',
                            value: '59027142-1a33-4d75-8ee6-231d7b4a3335',
                            type: NodeVariableType.String,
                        },
                        {
                            name: '{space}',
                            handle: 'space',
                            value: 30,
                            type: NodeVariableType.Number,
                        },
                    ],
                    type: NodeVariableType.Array,
                    has_dock: true,
                },
                {
                    name: 'Name',
                    handle: 'name',
                    value: 'John Doe',
                    type: NodeVariableType.String,
                    has_dock: false,
                },
                {
                    name: 'Age',
                    handle: 'age',
                    value: 30,
                    type: NodeVariableType.Number,
                    has_dock: true,
                },
                {
                    name: 'Human',
                    handle: 'human',
                    value: true,
                    type: NodeVariableType.Boolean,
                    has_dock: true,
                },
                {
                    name: 'Super Variables',
                    handle: 'superVariables',
                    value: [
                        {
                            name: '{amount}',
                            handle: 'amount',
                            value: null,
                            default_value: 30,
                            type: NodeVariableType.String,
                        },
                        {
                            name: '{age}',
                            handle: 'age',
                            value: 30,
                            type: NodeVariableType.Number,
                        },
                        {
                            name: '{id}',
                            handle: 'id',
                            value: 30,
                            type: NodeVariableType.String,
                        },
                        {
                            name: '{space}',
                            handle: 'space',
                            value: 30,
                            type: NodeVariableType.Number,
                        },
                    ],
                    type: NodeVariableType.Array,
                    has_dock: true,
                },
            ],
        },
        {
            id: '15bcbcac-ae11-4ca4-ac9b-601f431a90db',
            view: {
                x: 400,
                y: 100,
                width: 200,
                height: 200,
            },
            name: 'Route',
            type: 'route',
            enabled: true,
            variables: [
                {
                    name: 'Route Variables',
                    handle: 'routeVariables',
                    value: [
                        {
                            name: '{amount}',
                            handle: 'amount',
                            value: null,
                            default_value: 30,
                            type: NodeVariableType.String,
                        },
                        {
                            name: '{age}',
                            handle: 'age',
                            value: 30,
                            type: NodeVariableType.Number,
                        },
                        {
                            name: '{id}',
                            handle: 'id',
                            value: 30,
                            type: NodeVariableType.String,
                        },
                        {
                            name: '{space}',
                            handle: 'space',
                            value: 30,
                            type: NodeVariableType.Number,
                        },
                    ],
                    type: NodeVariableType.Array,
                    has_dock: true,
                },
                {
                    name: 'Name',
                    handle: 'name',
                    value: 'John Doe',
                    type: NodeVariableType.String,
                    has_dock: false,
                },
                {
                    name: 'Age',
                    handle: 'age',
                    value: 30,
                    type: NodeVariableType.Number,
                    has_dock: true,
                },
                {
                    name: 'Super Variables',
                    handle: 'superVariables',
                    value: [
                        {
                            name: '{amount}',
                            handle: 'amount',
                            value: null,
                            default_value: 30,
                            type: NodeVariableType.String,
                        },
                        {
                            name: '{age}',
                            handle: 'age',
                            value: 30,
                            type: NodeVariableType.Number,
                        },
                        {
                            name: '{id}',
                            handle: 'id',
                            value: 30,
                            type: NodeVariableType.String,
                        },
                        {
                            name: '{space}',
                            handle: 'space',
                            value: 30,
                            type: NodeVariableType.Number,
                        },
                    ],
                    type: NodeVariableType.Array,
                    has_dock: true,
                },
            ],
        },
        {
            id: '4fcee4b2-49cf-405f-bf30-1dcb61abd79e',
            view: {
                x: 700,
                y: 100,
                width: 200,
                height: 200,
            },
            name: 'Route',
            type: 'route',
            enabled: true,
            variables: [
                {
                    name: 'Route Variables',
                    handle: 'routeVariables',
                    value: [
                        {
                            name: '{amount}',
                            handle: 'amount',
                            value: null,
                            default_value: 30,
                            type: NodeVariableType.String,
                        },
                        {
                            name: '{age}',
                            handle: 'age',
                            value: 30,
                            type: NodeVariableType.Number,
                        },
                        {
                            name: '{id}',
                            handle: 'id',
                            value: 30,
                            type: NodeVariableType.String,
                        },
                        {
                            name: '{space}',
                            handle: 'space',
                            value: 30,
                            type: NodeVariableType.Number,
                        },
                    ],
                    type: NodeVariableType.Array,
                    has_dock: true,
                },
                {
                    name: 'Name',
                    handle: 'name',
                    value: 'John Doe',
                    type: NodeVariableType.String,
                    has_dock: false,
                },
                {
                    name: 'Age',
                    handle: 'age',
                    value: 30,
                    type: NodeVariableType.Number,
                    has_dock: true,
                },
                {
                    name: 'Super Variables',
                    handle: 'superVariables',
                    value: [
                        {
                            name: '{amount}',
                            handle: 'amount',
                            value: null,
                            default_value: 30,
                            type: NodeVariableType.String,
                        },
                        {
                            name: '{age}',
                            handle: 'age',
                            value: 30,
                            type: NodeVariableType.Number,
                        },
                        {
                            name: '{id}',
                            handle: 'id',
                            value: 30,
                            type: NodeVariableType.String,
                        },
                        {
                            name: '{space}',
                            handle: 'space',
                            value: 30,
                            type: NodeVariableType.Number,
                        },
                    ],
                    type: NodeVariableType.Array,
                    has_dock: true,
                },
            ],
        }
    ],

    addNode: (node) => {
        nodesByIdsCache.clear();
        set((state) => ({
            nodes: [...state.nodes, node],
        }));
    },

    removeNode: (nodeId) => {
        nodesByIdsCache.clear();
        set((state) => ({
            nodes: state.nodes.filter((node) => node.id !== nodeId),
        }));
    },

    updateNode: (nodeId, updatedFields) => {
        nodesByIdsCache.clear();
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId ? { ...node, ...updatedFields } : node
            ),
        }));
    },

    updateNodePosition: (nodeId, deltaX, deltaY) => {
        nodesByIdsCache.clear();
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        view: {
                            ...node.view,
                            x: node.view.x + deltaX,
                            y: node.view.y + deltaY,
                        },
                    }
                    : node
            ),
        }));
    },

    updateNodeWidth: (nodeId, width) => {
        nodesByIdsCache.clear();
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        view: {
                            ...node.view,
                            width,
                        },
                    }
                    : node
            ),
        }));
    },

    updateNodeHeight: (nodeId, height) => {
        nodesByIdsCache.clear();
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        view: {
                            ...node.view,
                            height,
                        },
                    }
                    : node
            ),
        }));
    },

    getNode: (nodeId) => {
        return get().nodes.find((node) => node.id === nodeId);
    },

    getNodes: () => {
        return get().nodes;
    },

    getNodesByIds: (nodeIds) => {
        const cacheKey = JSON.stringify(nodeIds.sort());
        if (nodesByIdsCache.has(cacheKey)) {
            return nodesByIdsCache.get(cacheKey)!;
        }

        const nodes = get().nodes.filter((node) => nodeIds.includes(node.id));
        nodesByIdsCache.set(cacheKey, nodes);
        return nodes;
    },

    getNodeVariable: (nodeId, variableHandle) => {
        const node = get().getNode(nodeId);
        return node?.variables.find((variable) => variable.handle === variableHandle);
    },

    updateNodeVariable: (nodeId, variableHandle, newValue) => {
        nodesByIdsCache.clear();
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        variables: node.variables.map((variable) =>
                            variable.handle === variableHandle
                                ? { ...variable, value: newValue }
                                : variable
                        ),
                    }
                    : node
            ),
        }));
    },
}));

export default useNodesStore;
