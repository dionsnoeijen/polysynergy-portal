import {create} from 'zustand';
import {v4 as uuidv4} from "uuid";
import {Node, NodeSetupVersion, NodeType, NodeVariable, NodeView, Route} from "@/types/types";
import {fetchDynamicRoute as fetchDynamicRouteAPI} from "@/api/dynamicRoutesApi";
import useGroupsStore from "@/stores/groupStore";
import useEditorStore from "@/stores/editorStore";

type NodesStore = {
    nodes: Node[];
    currentRouteData?: Route;
    setCurrentRouteData: (route: Route) => void;
    enableAllNodesView: () => void;
    disableAllNodesViewExceptByIds: (nodeIds: string[]) => void;
    disableNodeView: (nodeId: string) => void;
    disableNode: (nodeId: string) => void;
    enableNode: (nodeId: string) => void;
    driveNode: (nodeId: string) => void;
    trackedNodeId: string | null;
    toggleNodeViewCollapsedState: (nodeId: string) => void;
    toggleNodeVariableOpenState: (nodeId: string, variableHandle: string) => void;
    getNodeVariableOpenState: (nodeId: string, variableHandle: string) => boolean;
    addNode: (node: Node) => void;
    addGroupNode: (node: Partial<Node>) => void;
    removeNode: (nodeId: string) => void;
    updateNode: (nodeId: string, updatedFields: Partial<Node>) => void;
    setAddingStatus: (nodeId: string, adding: boolean) => void;
    updateNodePosition: (nodeId: string, x: number, y: number) => void;
    updateNodePositionByDelta: (nodeId: string, deltaX: number, deltaY: number) => void;
    updateNodeWidth: (nodeId: string, width: number) => void;
    updateNodeHeight: (nodeId: string, height: number) => void;
    getNode: (nodeId: string) => Node | undefined;
    getNodes: () => Node[];
    getNodesByIds: (nodeIds: string[]) => Node[];
    getNodeVariable: (nodeId: string, variableHandle: string) => NodeVariable | undefined;
    getNodesToRender: () => Node[];
    updateNodeVariable: (nodeId: string, variableHandle: string, newValue: null | string | number | boolean | string[] | NodeVariable[]) => void;
    getTrackedNode: () => Node | null;
    fetchDynamicRouteNodeSetupContent: (routeId: string) => Promise<void> | undefined;
};

const nodesByIdsCache = new Map<string, Node[]>();

export const createDefaultNode = (overrides = {}): Node => ({
    id: uuidv4(),
    name: "Default Name",
    category: "hidden",
    type: NodeType.Rows,
    view: {x: 0, y: 0, width: 200, height: 200, collapsed: false},
    enabled: true,
    driven: false,
    variables: [],
    ...overrides,
});

const useNodesStore = create<NodesStore>((set, get) => ({
    nodes: [],
    currentRouteData: undefined,
    setCurrentRouteData: (route: Route) => {
        set({currentRouteData: route});
    },
    trackedNodeId: null,

    toggleNodeViewCollapsedState: (nodeId: string) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        view: {
                            ...node.view,
                            collapsed: !node.view.collapsed,
                        },
                    }
                    : node
            ),
        }));
    },
    
    toggleNodeVariableOpenState: (nodeId: string, variableHandle: string) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        view: {
                            ...node.view,
                            isOpenMap: {
                                ...node.view.isOpenMap,
                                [variableHandle]: !node.view.isOpenMap?.[variableHandle],
                            },
                        },
                    }
                    : node
            ),
        }));
    },

    getNodeVariableOpenState: (nodeId: string, variableHandle: string): boolean => {
        const node = get().nodes.find((node) => node.id === nodeId);
        return node?.view.isOpenMap?.[variableHandle] || false;
    },

    enableAllNodesView: () => {
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

    disableAllNodesViewExceptByIds: (nodeIds) => {
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

    disableNodeView: (nodeId) => {
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

    disableNode: (nodeId: string) => {
        nodesByIdsCache.clear();
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        enabled: false,
                        driven: false
                    }
                    : node
            ),
        }));
    },

    enableNode: (nodeId: string) => {
        nodesByIdsCache.clear();
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        enabled: true,
                        driven: false
                    }
                    : node
            ),
        }));
    },

    driveNode: (nodeId: string) => {
        nodesByIdsCache.clear();
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        enabled: true,
                        driven: true,
                    }
                    : node
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
            adding: true,
            collapsed: false,
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

        node.type = NodeType.Group;
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
                node.id === nodeId ? {...node, ...updatedFields} : node
            ),
        }));
    },

    setAddingStatus: (nodeId: string, adding: boolean) => {
        nodesByIdsCache.clear();
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId ? {...node, view: {...node.view, adding}} : node
            ),
        }));
    },

    updateNodePosition: (nodeId: string, x: number, y: number) => {
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

    updateNodeVariable: (nodeId: string, variableHandle: string, newValue: null | string | number | boolean | string[] | NodeVariable[]) => {
        nodesByIdsCache.clear();
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        variables: node.variables.map((variable) =>
                            variable.handle === variableHandle
                                ? {
                                    ...variable,
                                    value: newValue as null | string | number | boolean | string[] | NodeVariable[],
                                }
                                : variable
                        ),
                    }
                    : node
            ),
            trackedNodeId: nodeId,
        }));
    },

    getTrackedNode: () => {
        const {nodes, trackedNodeId} = get();
        if (!trackedNodeId) return null;
        return nodes.find((node) => node.id === trackedNodeId) || null;
    },

    fetchDynamicRouteNodeSetupContent: async (routeId: string) => {
        const route: Route = await fetchDynamicRouteAPI(routeId);
        if (!route.id) {
            console.error('Failed to fetch dynamic route:', route);
            return;
        }
        set({currentRouteData: route});

        const {editingRouteVersions} = useEditorStore.getState();
        const editingCurrentRouteVersion = editingRouteVersions[route.id];

        if (editingCurrentRouteVersion) {
            const version = route.node_setup?.versions.find(
                (v) => v.id === editingCurrentRouteVersion
            );
            if (version) {
                set({nodes: version.content});
                return;
            }
        }

        const publishedVersion = route.node_setup?.versions.find(
            (v: NodeSetupVersion) => v.id === route.node_setup?.published_version?.id
        );
        if (publishedVersion) {
            set({nodes: publishedVersion.content});
        } else {
            const latestVersion = route.node_setup?.versions.reduce((prev, curr) =>
                prev.version_number > curr.version_number ? prev : curr
            );
            if (latestVersion) {
                set({nodes: latestVersion.content});
            }
        }

        set({nodes: []});
    },
}));

export default useNodesStore;
