import {create} from 'zustand';
import {v4 as uuidv4} from "uuid";
import {FlowState, Group, Node, NodeType, NodeVariable, NodeVariableType} from "@/types/types";
import {adjectives, animals, colors, uniqueNamesGenerator} from 'unique-names-generator';
import useConnectionsStore from "@/stores/connectionsStore";
import useEditorStore from "@/stores/editorStore";

export type NodesStore = {
    nodes: Node[];
    addTempNodes: (nodes: Node[]) => void;
    clearTempNodes: () => void;
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
    addNode: (node: Node, forceNewHandle?: boolean) => void;
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
    getNodeSubVariable: (nodeId: string, variableHandle: string) => NodeVariable | undefined;
    getSecretNodes: () => Node[];
    getEnvironmentVariableNodes: () => Node[];
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
    leadsToPlayConfig: (startNodeId: string) => Node | undefined;
    findMainPlayNode: () => Node | undefined;
    detachService: (nodeId: string) => Node | undefined;

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
    dissolveGroup: (groupId: string) => void;
    setGroupNameOverride: (nodeId: string, variableHandle: string, name: string) => void;
    setGroupConnectorColorOverride: (nodeId: string, variableHandle: string, color: string) => void;
    findNearestVisibleGroupWithCount: (nodeId: string) => { groupId: string, count: number } | null;

    groupStack: string[];
    openedGroup: string | null;
    initGroups: (groupStack: string[], openedGroup: string | null) => void;
    getNodesByServiceHandleAndVariant: (handle: string, variant: number) => Node[];
};

const nodesByIdsCache = new Map<string, Node[]>();

export const createDefaultNode = (overrides = {}): Partial<Node> => ({
    id: uuidv4(),
    handle: uniqueNamesGenerator({dictionaries: [adjectives, animals, colors]}),
    name: "Default Name",
    category: "hidden",
    type: NodeType.Rows,
    view: {x: 0, y: 0, width: 200, height: 200, collapsed: false},
    flowState: FlowState.Enabled,
    driven: false,
    variables: [],
    ...overrides,
});

const useNodesStore = create<NodesStore>((set, get) => ({
    nodes: [],

    trackedNodeId: null,

    groupStack: [],

    openedGroup: null,

    initGroups: (groupStack: string[], openedGroup: string | null) => {
        set({
            groupStack,
            openedGroup
        });
    },

    getNodesByServiceHandleAndVariant: (handle: string, variant: number): Node[] => {
        return get().nodes.filter(
            (node) =>
                node.service?.handle === handle &&
                node.service?.variant === variant
        );
    },

    addTempNodes: (nodes) => {
        nodes.map((node) => {
            node.temp = true;
        });
        set((state) => ({
            nodes: [...state.nodes, ...nodes]
        }));
    },

    clearTempNodes: () => {
        set((state) => ({
            nodes: state.nodes.filter((node) => !node.temp)
        }));
    },

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
        // more driving connections. Otherwise, it makes no sense.
        if ((flowState === FlowState.FlowIn || flowState === FlowState.FlowStop) &&
            drivingConnections.length > 0
        ) {
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
                node.id === nodeId && !node.driven
                    ? {
                        ...node,
                        flowState: FlowState.FlowStop,
                        driven: true,
                    }
                    : node
            ),
        }));
    },

    addNode: (node, forceNewHandle = false) => {
        nodesByIdsCache.clear();

        node.id = node.id ? node.id : uuidv4();
        if (forceNewHandle || !node.handle) {
            node.handle = uniqueNamesGenerator({
                dictionaries: [
                    adjectives,
                    animals,
                    colors,
                ]
            });
        }

        if (node.flowState === undefined) {
            node.flowState = node.default_flow_state as FlowState;
        }
        if (node.flowState === undefined ||
            node.default_flow_state === null) {
            node.flowState = FlowState.Enabled;
        }
        if (node.driven === undefined) {
            node.driven = false;
        }

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

        set((state) => ({
            nodes: [...state.nodes, node]
        }));

        // useHistoryStore.getState().save();
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

        // useHistoryStore.getState().save();
    },

    removeNode: (nodeId) => {
        nodesByIdsCache.clear();
        set((state) => ({
            nodes: state.nodes.filter((node) => node.id !== nodeId),
        }));

        // useHistoryStore.getState().save();
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

        const visibleNodes = get().nodes.filter(
            (node) =>
                !nodeIdsOfNodesInClosedGroups.includes(node.id) &&
                !node.temp
        );

        requestAnimationFrame(() => {
            useEditorStore.getState().setVisibleNodeCount(visibleNodes.length);
        });

        return visibleNodes;
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

        if (!node) return undefined;

        if (variableHandle === 'node') {
            return {
                handle: 'node',
                name: node.name,
                type: NodeVariableType.Node,
                value: null,
                published: false,
                has_in: true
            }
        }

        return node?.variables.find((variable) => variable.handle === variableHandle);
    },

    getSecretNodes: (): Node[] => {
        return get().nodes.filter(
            (node) => node.path === 'nodes.nodes.secret.variable_secret.VariableSecret'
        );
    },

    getEnvironmentVariableNodes: (): Node[] => {
        return get().nodes.filter(
            (node) => node.path === 'nodes.nodes.environment.variable_environment.VariableEnvironment'
        );
    },

    getNodeSubVariable: (nodeId, variableHandle) => {
        const node = get().getNode(nodeId);
        if (!node) return undefined;
        const variableHandleParts = variableHandle.split('.');
        const fullVariable = get().getNodeVariable(nodeId, variableHandleParts[0]);
        if (!fullVariable) return undefined;
        const subVariable = (fullVariable?.value as NodeVariable[]).find((variable) => variable.handle === variableHandleParts[1]);
        if (!subVariable) return undefined;
        subVariable.name = fullVariable.name + '.' + subVariable.handle;
        subVariable.parentHandle = fullVariable.handle;
        return subVariable;
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

    updateNodeVariable: (
        nodeId: string,
        variableHandle: string,
        newValue: null | string | number | boolean | string[] | NodeVariable[]
    ) => {
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

        const [mainHandle, subHandle] = variableHandle.split(".");

        set((state) => {
            const updatedNodes = state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        variables: node.variables.map((variable) => {
                            if (variable.handle !== mainHandle) return variable;

                            if (subHandle && Array.isArray(variable.value)) {
                                return {
                                    ...variable,
                                    value: variable.value.map((subVar: NodeVariable) =>
                                        subVar.handle === subHandle
                                            ? {
                                                ...subVar,
                                                published: !subVar.published,
                                            }
                                            : subVar
                                    ),
                                };
                            }

                            return {
                                ...variable,
                                published: !variable.published,
                            };
                        }),
                    }
                    : node
            );

            const editorStore = useEditorStore.getState();
            const isEditingThisVar =
                editorStore.formEditRecordId === nodeId &&
                editorStore.formEditVariable?.handle === variableHandle;

            if (isEditingThisVar) {
                useEditorStore.setState({
                    formEditVariable: {
                        ...editorStore.formEditVariable,
                        published: !editorStore?.formEditVariable?.published,
                    } as NodeVariable,
                });
            }

            return {nodes: updatedNodes};
        });
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
        const {groupStack} = get();
        if (nodeId) {
            if (groupStack[groupStack.length - 1] !== nodeId) {
                set((state) => ({
                    groupStack: [...state.groupStack, nodeId],
                    openedGroup: nodeId,
                }));
            }
        } else {
            set({
                groupStack: [],
                openedGroup: null,
            });
        }

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

    dissolveGroup: (groupId: string) => {
        const {groupStack} = get();

        // Remove from groupStack by id
        const newStack = groupStack.filter((id) => id !== groupId);
        set({
            groupStack: newStack,
            openedGroup: newStack.length > 0 ? newStack[newStack.length - 1] : null,
        });
    },

    setGroupNameOverride: (nodeId, variableHandle, name) => {
        nodesByIdsCache.clear();

        set((state) => ({
            nodes: state.nodes.map((node) => {
                if (node.id !== nodeId) return node;

                // Subvariabele (bijv. dict.subHandle)
                if (variableHandle.includes('.')) {
                    const [parentHandle, subHandle] = variableHandle.split('.');

                    return {
                        ...node,
                        variables: node.variables.map((variable) => {
                            if (variable.handle !== parentHandle) return variable;

                            if (Array.isArray(variable.value)) {
                                const updatedValue = (variable.value as NodeVariable[]).map((subvar) =>
                                    subvar.handle === subHandle
                                        ? {
                                            ...subvar,
                                            group_name_override: name,
                                        }
                                        : subvar
                                );

                                return {
                                    ...variable,
                                    value: updatedValue,
                                };
                            }

                            return variable;
                        }),
                    };
                }

                // Normale variabele
                return {
                    ...node,
                    variables: node.variables.map((variable) =>
                        variable.handle === variableHandle
                            ? {
                                ...variable,
                                group_name_override: name,
                            }
                            : variable
                    ),
                };
            }),
        }));
    },

    setGroupConnectorColorOverride: (nodeId, handle, color: string) => {
        nodesByIdsCache.clear();

        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        variables: node.variables.map((variable) =>
                            variable.handle === handle
                                ? {
                                    ...variable,
                                    group_connector_color_override: color,
                                }
                                : variable
                        ),
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
        const {groupStack} = get();
        if (groupStack.length > 0) {
            const newStack = [...groupStack];
            newStack.pop();
            set({
                groupStack: newStack,
                openedGroup: newStack.length > 0 ? newStack[newStack.length - 1] : null,
            });
        }

        // On some occasions (not sure what the cause is, the stack
        // can contain a node that is not a group. This is a workaround
        // to clean the groupStack and openedGroup
        if (groupStack.length > 0) {
            const updatedGroupStack = get().groupStack;
            const lastGroupId = updatedGroupStack[updatedGroupStack.length - 1];
            const lastGroupNode = get().nodes.find((node) => node.id === lastGroupId && node.type === NodeType.Group);
            if (!lastGroupNode) {
                set({
                    groupStack: [],
                    openedGroup: null,
                });
            }
        }

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

    removeNodeFromGroup: (groupId: string, nodeToRemove: string) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === groupId && node.type === NodeType.Group
                    ? {
                        ...node,
                        group: {
                            ...node.group,
                            nodes: node.group?.nodes?.filter((id) => id !== nodeToRemove) || [],
                        },
                    }
                    : node
            ),
        }));
        // If the group stack contains a groupId below this groupId,
        // reassign the nodeToRemove to that groupId
        const groupStack = get().groupStack;
        const groupIndex = groupStack.indexOf(groupId);
        if (groupIndex > 0) {
            const newGroupId = groupStack[groupIndex - 1];
            set((state) => ({
                nodes: state.nodes.map((node) =>
                    node.id === newGroupId && node.type === NodeType.Group
                        ? {
                            ...node,
                            group: {
                                ...node.group,
                                nodes: [...(node.group?.nodes || []), nodeToRemove],
                            },
                        }
                        : node
                ),
            }));
        }
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

    findNearestVisibleGroupWithCount: (nodeId: string): { groupId: string, count: number } | null => {
        const {getState} = useNodesStore;
        let currentNodeId: string | null = nodeId;

        while (currentNodeId) {
            const parentGroupId = getState().isNodeInGroup(currentNodeId);
            if (!parentGroupId) return null;
            const parentGroup = getState().getGroupById(parentGroupId);
            if (parentGroup?.group?.isHidden === true) {
                const count = parentGroup.group?.nodes?.length || 0;
                return {groupId: parentGroupId, count};
            }

            currentNodeId = parentGroupId;
        }

        return null;
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
        // If node.view.isDeletable is set to false (explicitly), the node is not deletable
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
    },

    leadsToPlayConfig: (startNodeId: string): Node | undefined => {
        const visited = new Set<string>();

        const dfs = (nodeId: string): Node | undefined => {
            if (visited.has(nodeId)) return undefined;
            visited.add(nodeId);

            const node = get().getNode(nodeId);
            if (!node) return undefined;

            if (node.path === "nodes.nodes.play.config.PlayConfig" ||
                node.path === "nodes.nodes.play.play.Play") {
                return node;
            }

            const {findInConnectionsByNodeId, findOutConnectionsByNodeId} = useConnectionsStore.getState();

            const inputConns = findInConnectionsByNodeId(nodeId);
            const outputConns = findOutConnectionsByNodeId(nodeId);

            const neighborIds = [
                ...inputConns.map(conn => conn.sourceNodeId),
                ...outputConns.map(conn => conn.targetNodeId)
            ];

            for (const neighborId of neighborIds) {
                const result = dfs(neighborId as string);
                if (result) return result;
            }

            return undefined;
        };

        return dfs(startNodeId);
    },

    findMainPlayNode: (): Node | undefined => {
        const nodes = get().nodes;

        return nodes.find((node) =>
            node.path === "nodes.nodes.mock.mock_schedule.MockSchedule" ||
            node.path === "nodes.nodes.mock.mock_route_request.MockRouteRequest"
        );
    },

    detachService: (nodeId: string): Node | undefined => {
        const nodes = get().nodes;
        const node = nodes.find((node) => node.id === nodeId);

        if (!node) return undefined;

        // Remove the node.service property
        const updatedNode = {
            ...node,
            service: undefined,
        };

        // Update the node in the store
        set((state) => ({
            nodes: state.nodes.map((n) => (n.id === nodeId ? updatedNode : n)),
        }));

        return node;

    }
}));

export default useNodesStore;
