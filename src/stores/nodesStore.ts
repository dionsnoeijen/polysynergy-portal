import {create} from 'zustand';
import {v4 as uuidv4} from "uuid";
import {FlowState, Group, Node, NodeType, NodeVariable} from "@/types/types";
import {adjectives, animals, colors, uniqueNamesGenerator} from 'unique-names-generator';
import useConnectionsStore from "@/stores/connectionsStore";

type NodesStore = {
    nodes: Node[];
    enableAllNodesView: () => void;
    enableNodesView: (nodeIds: string[]) => void;
    disableAllNodesViewExceptByIds: (nodeIds: string[]) => void;
    disableNodeView: (nodeId: string) => void;
    setNodeFlowState: (nodeId: string, flowState: FlowState) => void;
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
    updateNodeVariablePublishedTitle: (nodeId: string, variableHandle: string, title: string) => void;
    updateNodeVariablePublishedDescription: (nodeId: string, variableHandle: string, description: string) => void;
    getNodesToRender: () => Node[];
    updateNodeVariable: (nodeId: string, variableHandle: string, newValue: null | string | number | boolean | string[] | NodeVariable[]) => void;
    toggleNodeVariablePublished: (nodeId: string, variableHandle: string) => void;
    updateNodeHandle: (nodeId: string, handle: string) => void;
    getTrackedNode: () => Node | null;
    initNodes: (nodes: Node[]) => void;
    isNodeInService: (nodeIds: string[]) => boolean;
    isNodeDeletable: (nodeIds: string[]) => boolean;
    getAllNestedNodesByIds: (nodeIds: string[]) => Node[];
    getNodesByPath: (path: string) => Node[] | undefined;

    openGroup: (nodeId: string) => void;
    isNodeInGroup: (nodeId: string) => string | null;
    closeGroup: (nodeId: string) => void;
    hideGroup: (nodeId: string) => void;
    showGroup: (nodeId: string) => void;
    removeGroup: (nodeId: string) => void;
    addNodeToGroup: (nodeId: string, nodeToAddId: string) => void;
    removeNodeFromGroup: (nodeId: string, nodeToAddId: string) => void;
    getOpenGroups: () => Node[];
    getClosedGroups: () => Node[];
    getNodesInGroup: (nodeId: string) => string[];
    getGroupById: (nodeId: string) => Node | undefined;
    getAllNodeIdsOfNodesThatAreInAClosedGroup: () => string[];
    updateGroup: (nodeId: string, group: Partial<Group>) => void;
};

const nodesByIdsCache = new Map<string, Node[]>();

export const createDefaultNode = (overrides = {}): Partial<Node> => ({
    id: uuidv4(),
    handle: uniqueNamesGenerator({dictionaries: [adjectives, colors, animals]}),
    name: "Default Name",
    category: "hidden",
    type: NodeType.Rows,
    view: { x: 0, y: 0, width: 200, height: 200, collapsed: false },
    flowState: FlowState.Enabled,
    driven: false,
    variables: [],
    ...overrides,
});

const useNodesStore = create<NodesStore>((set, get) => ({
    nodes: [],
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

    enableNodesView: (nodeIds: string[]) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                nodeIds.includes(node.id)
                    ? {
                        ...node,
                        view: {
                            ...node.view,
                            disabled: false,
                        },
                    }
                    : node
            ),
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

    setNodeFlowState: (nodeId: string, flowState: FlowState) => {
        nodesByIdsCache.clear();

        console.log("setNodeFlowState", nodeId, flowState);

        // If the flow state is going to be set to FlowState.Enabled,
        // First check if this is allowed by checkin if there are other
        // driving connections. If not.... then make sure that
        // 1: Te driven property will be set to false
        // 2: The flowState will be set to FlowState.Enabled
        // Otherwise, do nothing.
        const drivingConnections = useConnectionsStore
            .getState()
            .findInConnectionsByNodeIdAndHandle(nodeId, 'node');

        if (flowState === FlowState.Enabled) {
            // 1 driving connection means it's going to be emptied.
            if (drivingConnections.length === 1) {
                set((state) => ({
                    nodes: state.nodes.map((node) =>
                        node.id === nodeId ? {
                            ...node,
                            flowState,
                            driven: false
                        } : node
                    ),
                }));
            }
        }

        // If the flow state is going to be set to FlowState.FlowIn of FlowState.FlowStop,
        // First check if this is allowed by checking if there are one or
        // more driving connections. Otherwise it makes no sense.
        if ((flowState === FlowState.FlowIn || flowState === FlowState.FlowStop) &&
            drivingConnections.length > 0
        ) {
            console.log('SETTING TO FLOWIN OR FLOWSTOP', flowState);
            set((state) => ({
                nodes: state.nodes.map((node) =>
                    node.id === nodeId ? {
                        ...node,
                        flowState,
                    } : node
                ),
            }));
        }
    },

    driveNode: (nodeId: string) => {
        nodesByIdsCache.clear();
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        flowState: FlowState.FlowStop,
                        driven: true,
                    }
                    : node
            ),
        }));
    },

    addNode: (node) => {
        nodesByIdsCache.clear();

        node.id = node.id ? node.id : uuidv4();
        node.handle = node.handle ? node.handle : uniqueNamesGenerator({dictionaries: [adjectives, colors, animals]});
        node.flowState = FlowState.Enabled;
        node.driven = false;

        if (!node.view) {
            node.view = {
                x: 0,
                y: 0,
                width: 200,
                height: 200,
                disabled: false,
                adding: true,
                collapsed: false,
            };
        }

        set((state) => ({ nodes: [...state.nodes, node],}));
    },

    addGroupNode: (node: Partial<Node>) => {
        nodesByIdsCache.clear();
        const newNode: Node = {
            ...createDefaultNode(node) as Node,
            type: NodeType.Group,
            category: NodeType.Group,
            name: "Untitled",
        };
        set((state) => ({
            nodes: [...state.nodes, newNode],
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
        if (!get().nodes) return [];

        const nodeIdsOfNodesInClosedGroups = get()
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

    updateNodeVariablePublishedTitle: (nodeId: string, variableHandle: string, title: string) => {
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
                                    published_title: title,
                                }
                                : variable
                        ),
                    }
                    : node
            ),
        }));
    },

    updateNodeVariablePublishedDescription: (nodeId: string, variableHandle: string, description: string) => {
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
                                    published_description: description,
                                }
                                : variable
                        ),
                    }
                    : node
            ),
        }));
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

    toggleNodeVariablePublished: (nodeId: string, variableHandle: string) => {
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
                                    published: !variable.published,
                                }
                                : variable
                        ),
                    }
                    : node
            ),
        }));
    },

    updateNodeHandle: (nodeId: string, handle: string) => {
        nodesByIdsCache.clear();
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        handle,
                    }
                    : node
            ),
        }));
    },

    getTrackedNode: () => {
        const {nodes, trackedNodeId} = get();
        if (!trackedNodeId) return null;
        return nodes.find((node) => node.id === trackedNodeId) || null;
    },

    openGroup: (nodeId: string) => {
        set((state: NodesStore) => ({
            nodes: state.nodes.map((node: Node) =>
                node.id === nodeId && node.type === NodeType.Group
                    ? {
                        ...node,
                        group: {
                            ...node.group,
                            isOpen: true,
                        },
                    }
                    : node
            ),
        }));
    },

    isNodeInGroup: (nodeId: string): string | null => {
        const nodes = get().nodes;

        const groupNodes = nodes.filter((node) => node.type === NodeType.Group);

        for (const groupNode of groupNodes) {
            if (groupNode.group?.nodes?.includes(nodeId)) {
                return groupNode.id;
            }
        }

        return null;
    },

    closeGroup: (nodeId: string) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId && node.type === NodeType.Group
                    ? {
                        ...node,
                        group: {
                            ...node.group,
                            isOpen: false,
                        },
                    }
                    : node
            ),
        }));
    },

    hideGroup: (nodeId: string) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId && node.type === NodeType.Group
                    ? {
                        ...node,
                        group: {
                            ...node.group,
                            isHidden: true,
                        },
                    }
                    : node
            ),
        }));
    },

    showGroup: (nodeId: string) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId && node.type === NodeType.Group
                    ? {
                        ...node,
                        group: {
                            ...node.group,
                            isHidden: false,
                        },
                    }
                    : node
            ),
        }));
    },

    removeGroup: (nodeId: string) => {
        set((state) => ({
            nodes: state.nodes.filter((node) => node.id !== nodeId || node.type !== NodeType.Group),
        }));
    },

    addNodeToGroup: (nodeId: string, nodeToAddId: string) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId && node.type === NodeType.Group // Controleer of het de juiste groep is
                    ? {
                        ...node,
                        group: {
                            ...node.group, // Behoud bestaande group-properties
                            nodes: [...(node.group?.nodes || []), nodeToAddId], // Voeg nodeId toe aan de nodes-array
                        },
                    }
                    : node
            ),
        }));
    },

    removeNodeFromGroup: (nodeId: string, nodeToAddId: string) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId && node.type === NodeType.Group // Controleer of het de juiste groep is
                    ? {
                        ...node,
                        group: {
                            ...node.group, // Behoud bestaande group-properties
                            nodes: node.group?.nodes?.filter((id) => id !== nodeToAddId) || [], // Verwijder nodeId uit de nodes-array
                        },
                    }
                    : node
            ),
        }));
    },

    getOpenGroups: () => {
        if (!get().nodes) return [];
        const state = get();
        return state.nodes.filter(
            (node) => node.type === NodeType.Group && node.group?.isOpen
        );
    },

    getClosedGroups: () => {
        const state = get();
        return state.nodes.filter(
            (node) => node.type === NodeType.Group && !node.group?.isOpen
        );
    },

    getNodesInGroup: (nodeId: string): string[] => {
        const state = get();
        const groupNode = state.nodes.find(
            (node) => node.id === nodeId && node.type === NodeType.Group
        );

        if (!groupNode || !groupNode.group || !groupNode.group.nodes) return [];

        return groupNode.group.nodes;
    },

    getGroupById: (nodeId: string): Node | undefined => {
        const state = get();
        return state.nodes.find(
            (node) => node.id === nodeId && node.type === NodeType.Group
        );
    },

    getAllNodeIdsOfNodesThatAreInAClosedGroup: (): string[] => {
        const state = get(); // Haal de huidige state op
        const closedGroups = state.nodes.filter(
            (node) => node.type === NodeType.Group && !node.group?.isOpen // Vind gesloten groepen
        );

        return closedGroups.flatMap((group) => group.group?.nodes || []);
    },

    updateGroup: (nodeId: string, updatedGroup: Partial<Group>) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId && node.type === NodeType.Group
                    ? {
                        ...node,
                        group: {
                            ...node.group,
                            ...updatedGroup,
                        },
                    }
                    : node
            ),
        }));
    },

    initNodes: (nodes: Node[]) => {
        set({nodes});
    },

    isNodeInService: (nodeIds: string[]): boolean => {
        const state = get();
        const nodes = state.nodes;

        const checkServiceRecursively = (currentNodeId: string, visited: Set<string> = new Set()): boolean => {
            if (visited.has(currentNodeId)) return false;
            visited.add(currentNodeId);

            const node = nodes.find(n => n.id === currentNodeId);
            if (!node) return false;

            const groupId = state.isNodeInGroup(currentNodeId);
            if (!groupId) return false;

            const groupNode = nodes.find(n => n.id === groupId);
            if (!groupNode) return false;
            if (groupNode.service) return true;

            return checkServiceRecursively(groupId, visited);
        };

        return nodeIds.some(nodeId => {
            const node = nodes.find(n => n.id === nodeId);
            if (!node) return false;
            if (node.service) return false;
            return checkServiceRecursively(nodeId);
        });
    },

    isNodeDeletable: (nodeIds: string[]): boolean => {
        // If node.view.isDeletable is set to false, the node is not deletable
        // in any other case it is
        const state = get();
        const nodes = state.nodes;
        return nodeIds.every(nodeId => {
            const node = nodes.find(n => n.id === nodeId);
            return node?.view.isDeletable !== false;
        });
    },

    getAllNestedNodesByIds: (nodeIds: string[]): Node[] => {
        const state = get();
        const allNodes = state.nodes;
        const resultNodeIds = new Set<string>(nodeIds);

        const collectNestedNodes = (currentNodeId: string) => {
            const node = allNodes.find(n => n.id === currentNodeId);
            if (!node || node.type !== NodeType.Group || !node.group?.nodes) return;

            node.group.nodes.forEach((nestedNodeId) => {
                if (!resultNodeIds.has(nestedNodeId)) {
                    resultNodeIds.add(nestedNodeId);
                    const nestedNode = allNodes.find(n => n.id === nestedNodeId);
                    if (nestedNode?.type === NodeType.Group) {
                        collectNestedNodes(nestedNodeId);
                    }
                }
            });
        };

        nodeIds.forEach((nodeId) => {
            collectNestedNodes(nodeId);
        });

        return Array.from(resultNodeIds).map((id) => allNodes.find(n => n.id === id)!).filter(Boolean);
    },

    getNodesByPath: (path: string): Node[] | undefined => {
        const state = get();
        return state.nodes.filter((node) => node.path === path);
    }
}));

export default useNodesStore;
