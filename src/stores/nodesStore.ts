import { create } from 'zustand';
import { nodeDevData } from "@/stores/nodeDevData";
import { v4 as uuidv4 } from "uuid";
import { Node, NodeType, NodeVariable, NodeView } from "@/types/types";
import useGroupsStore from "@/stores/groupStore";

type NodesStore = {
    nodes: Node[];
    enableAllNodes: () => void;
    disableAllNodesExceptByIds: (nodeIds: string[]) => void;
    disableNode: (nodeId: string) => void;
    trackedNodeId: string | null;
    addNode: (node: Node) => void;
    addGroupNode: (node: Partial<Node>) => void;
    removeNode: (nodeId: string) => void;
    updateNode: (nodeId: string, updatedFields: Partial<Node>) => void;
    updateNodePosition: (nodeId: string, x: number, y: number) => void;
    updateNodePositionByDelta: (nodeId: string, deltaX: number, deltaY: number) => void;
    updateNodeWidth: (nodeId: string, width: number) => void;
    updateNodeHeight: (nodeId: string, height: number) => void;
    getNode: (nodeId: string) => Node | undefined;
    getNodes: () => Node[];
    getNodesByIds: (nodeIds: string[]) => Node[];
    getNodeVariable: (nodeId: string, variableHandle: string) => NodeVariable | undefined;
    getNodesToRender: () => Node[];
    updateNodeVariable: (nodeId: string, variableHandle: string, newValue: string | number | boolean | string[] | NodeVariable[] | null | undefined) => void;
    getTrackedNode: () => Node | null;
};

const nodesByIdsCache = new Map<string, Node[]>();

export const createDefaultNode = (overrides = {}): Node => ({
    id: uuidv4(),
    name: "Default Name",
    category: "hidden",
    type: NodeType.Rows,
    view: {x:0, y:0, width:200, height:200},
    enabled: true,
    driven: false,
    variables: [],
    ...overrides,
});

const useNodesStore = create<NodesStore>((set, get) => ({
    nodes: [],
    trackedNodeId: null,

    enableAllNodes: () => {
        set((state) => ({
            nodes: state.nodes.map((node) => ({
                ...node,
                view: {
                    ...node.view,
                    disabled: false,
                },
            })),
        }));
    },

    disableAllNodesExceptByIds: (nodeIds) => {
        set((state) => ({
            nodes: state.nodes.map((node) => ({
                ...node,
                view: {
                    ...node.view,
                    disabled: !nodeIds.includes(node.id),
                },
            })),
        }));
    },

    disableNode: (nodeId) => {
        nodesByIdsCache.clear();
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId ? {
                    ...node,
                    view: {
                        ...node.view,
                        disabled: true,
                    },
                } : node
            ),
        }));
    },

    addNode: (node) => {
        nodesByIdsCache.clear();

        const defaultNodeView: NodeView = {
            x: 0,
            y: 0,
            width: 200,
            height: 200,
            disabled: false,
            adding: true
        };

        node.id = uuidv4();
        node.enabled = true;
        node.driven = false;

        if (!node.view) {
            node.view = defaultNodeView;
        }

        set((state) => ({
            nodes: [...state.nodes, node],
        }));
    },

    addGroupNode: (node: Partial<Node>) => {
        nodesByIdsCache.clear();

        node.type = "group";
        node.category = "group";
        node.name = "Untitled Group";

        const defaultNode = createDefaultNode(node);
        set((state) => ({
            nodes: [...state.nodes, defaultNode],
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

    updateNodePosition: (nodeId, x, y) => {
        nodesByIdsCache.clear();
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        view: {
                            ...node.view,
                            x,
                            y,
                        },
                    }
                    : node
            ),
        }));
    },

    updateNodePositionByDelta: (nodeId, deltaX, deltaY) => {
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

    getNodesToRender: (): Node[] => {
        const nodeIdsOfNodesInClosedGroups = useGroupsStore
            .getState()
            .getAllNodeIdsOfNodesThatAreInAClosedGroup();

        return get().nodes.filter(
            (node) => !nodeIdsOfNodesInClosedGroups.includes(node.id)
        );
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
            trackedNodeId: nodeId
        }));
    },

    getTrackedNode: () => {
        const { nodes, trackedNodeId } = get();
        if (!trackedNodeId) return null;
        return nodes.find((node) => node.id === trackedNodeId) || null;
    },
}));

export default useNodesStore;
