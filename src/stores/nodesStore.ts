import { create } from 'zustand';
import { nodeDevData } from "@/stores/nodeDevData";
import { v4 as uuidv4 } from "uuid";
import { Node, NodeType, NodeVariable } from "@/types/types";

type NodesStore = {
    nodes: Node[];
    addNode: (node: Node) => void;
    addGroupNode: (node: Node) => void;
    removeNode: (nodeId: string) => void;
    updateNode: (nodeId: string, updatedFields: Partial<Node>) => void;
    updateNodePosition: (nodeId: string, deltaX: number, deltaY: number) => void;
    updateNodeWidth: (nodeId: string, width: number) => void;
    updateNodeHeight: (nodeId: string, height: number) => void;
    getNode: (nodeId: string) => Node | undefined;
    getNodes: () => Node[];
    getNodesByIds: (nodeIds: string[]) => Node[];
    getNodeVariable: (nodeId: string, variableHandle: string) => NodeVariable | undefined;
    updateNodeVariable: (nodeId: string, variableHandle: string, newValue: string | number | boolean | string[] | NodeVariable[] | null | undefined) => void;
};

const nodesByIdsCache = new Map<string, Node[]>();

const useNodesStore = create<NodesStore>((set, get) => ({
    nodes: nodeDevData,

    addNode: (node) => {
        nodesByIdsCache.clear();
        set((state) => ({
            nodes: [...state.nodes, node],
        }));
    },

    addGroupNode: (node: Node) => {
        nodesByIdsCache.clear();

        node.id = uuidv4();
        node.isOpen = true;
        node.type = NodeType.Group;

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
