import { create } from 'zustand';
import { useEditorStore } from '@/stores/editorStore';
import { InOut } from "@/types/types";

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
    in_connections?: null|string[];
    out_connections?: null|string[];
    has_dock?: boolean;
};

export type Node = {
    uuid: string;
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    enabled: string[] | boolean;
    variables: NodeVariable[];
};

type NodesStore = {
    nodes: Record<string, Record<string, Node[]>>;
    removeConnectionFromNode: (
        connectionId: string,
        nodeUuid: string,
        handle: string,
        direction: InOut
    ) => void;
    updateConnections: (payload: {
        connectionId: string;
        sourceNodeUuid: string;
        sourceHandle: string;
        targetNodeUuid: string;
        targetHandle: string;
    }) => void;
    updateNodePosition: (nodeId: string, deltaX: number, deltaY: number) => void;
    updateNodeWidth: (nodeId: string, width: number) => void;
    updateNodeHeight: (nodeId: string, newHeight: number) => void;
    addNode: (node: Node) => void;
    removeNode: (nodeUuid: string) => void;
    getNode: (nodeUuid: string) => Node | undefined;
    getNodes: () => Node[];
    getNodesByIds: (nodeIds: string[]) => Node[];
};

const getNodesByIds = (get: () => NodesStore) => (nodeIds: string[]): Node[] => {
    const { activeProjectId, activeRouteId } = useEditorStore.getState();
    const allNodes = get().nodes[activeProjectId]?.[activeRouteId] || [];
    return allNodes.filter((node) => nodeIds.includes(node.uuid));
};

const useNodesStore = create<NodesStore>((set, get) => ({
    nodes: {
        '72b38eed-dfb5-4a96-be50-1e2872e1581e': {
           'a2ac29df-2130-41da-b64d-b0314c19e47a': [
               {
                   uuid: 'e8941d69-af86-4cbc-83cd-758c8b80e89c',
                   name: 'Route',
                   type: 'route',
                   x: 100,
                   y: 100,
                   width: 200,
                   height: 200,
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
                                   in_connections: [],
                                   out_connections: [],
                               },
                               {
                                   name: '{age}',
                                   handle: 'age',
                                   value: 30,
                                   type: NodeVariableType.Number,
                                   in_connections: [],
                                   out_connections: [],
                               },
                               {
                                   name: '{uuid}',
                                   handle: 'uuid',
                                   value: 30,
                                   type: NodeVariableType.String,
                                   in_connections: [],
                                   out_connections: [],
                               },
                               {
                                   name: '{space}',
                                   handle: 'space',
                                   value: 30,
                                   type: NodeVariableType.Number,
                                   in_connections: [],
                                   out_connections: [],
                               },
                           ],
                           type: NodeVariableType.Array,
                           in_connections: [],
                           out_connections: [],
                           has_dock: true,
                       },
                       {
                           name: 'Name',
                           handle: 'name',
                           value: 'John Doe',
                           type: NodeVariableType.String,
                           in_connections: [],
                           out_connections: [],
                           has_dock: false,
                       },
                       {
                           name: 'Age',
                           handle: 'age',
                           value: 30,
                           type: NodeVariableType.Number,
                           in_connections: null,
                           out_connections: [],
                           has_dock: true,
                       },
                       {
                           name: 'Human',
                           handle: 'human',
                           value: true,
                           type: NodeVariableType.Boolean,
                           in_connections: [],
                           out_connections: [],
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
                                   in_connections: [],
                                   out_connections: [],
                               },
                               {
                                   name: '{age}',
                                   handle: 'age',
                                   value: 30,
                                   type: NodeVariableType.Number,
                                   in_connections: [],
                                   out_connections: [],
                               },
                               {
                                   name: '{uuid}',
                                   handle: 'uuid',
                                   value: 30,
                                   type: NodeVariableType.String,
                                   in_connections: [],
                                   out_connections: [],
                               },
                               {
                                   name: '{space}',
                                   handle: 'space',
                                   value: 30,
                                   type: NodeVariableType.Number,
                                   in_connections: [],
                                   out_connections: [],
                               },
                           ],
                           type: NodeVariableType.Array,
                           in_connections: [],
                           out_connections: [],
                           has_dock: true,
                       },
                   ],
               },
               {
                   uuid: '15bcbcac-ae11-4ca4-ac9b-601f431a90db',
                   name: 'Route',
                   type: 'route',
                   x: 400,
                   y: 100,
                   width: 200,
                   height: 200,
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
                                   in_connections: [],
                                   out_connections: [],
                               },
                               {
                                   name: '{age}',
                                   handle: 'age',
                                   value: 30,
                                   type: NodeVariableType.Number,
                                   in_connections: [],
                                   out_connections: [],
                               },
                               {
                                   name: '{uuid}',
                                   handle: 'uuid',
                                   value: 30,
                                   type: NodeVariableType.String,
                                   in_connections: [],
                                   out_connections: [],
                               },
                               {
                                   name: '{space}',
                                   handle: 'space',
                                   value: 30,
                                   type: NodeVariableType.Number,
                                   in_connections: [],
                                   out_connections: [],
                               },
                           ],
                           type: NodeVariableType.Array,
                           in_connections: [],
                           out_connections: [],
                           has_dock: true,
                       },
                       {
                           name: 'Name',
                           handle: 'name',
                           value: 'John Doe',
                           type: NodeVariableType.String,
                           in_connections: [],
                           out_connections: [],
                           has_dock: false,
                       },
                       {
                           name: 'Age',
                           handle: 'age',
                           value: 30,
                           type: NodeVariableType.Number,
                           in_connections: null,
                           out_connections: [],
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
                                   in_connections: [],
                                   out_connections: [],
                               },
                               {
                                   name: '{age}',
                                   handle: 'age',
                                   value: 30,
                                   type: NodeVariableType.Number,
                                   in_connections: [],
                                   out_connections: [],
                               },
                               {
                                   name: '{uuid}',
                                   handle: 'uuid',
                                   value: 30,
                                   type: NodeVariableType.String,
                                   in_connections: [],
                                   out_connections: [],
                               },
                               {
                                   name: '{space}',
                                   handle: 'space',
                                   value: 30,
                                   type: NodeVariableType.Number,
                                   in_connections: [],
                                   out_connections: [],
                               },
                           ],
                           type: NodeVariableType.Array,
                           in_connections: [],
                           out_connections: [],
                           has_dock: true,
                       },
                   ],
               },
               {
                   uuid: '4fcee4b2-49cf-405f-bf30-1dcb61abd79e',
                   name: 'Route',
                   type: 'route',
                   x: 700,
                   y: 100,
                   width: 200,
                   height: 200,
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
                                   in_connections: [],
                                   out_connections: [],
                               },
                               {
                                   name: '{age}',
                                   handle: 'age',
                                   value: 30,
                                   type: NodeVariableType.Number,
                                   in_connections: [],
                                   out_connections: [],
                               },
                               {
                                   name: '{uuid}',
                                   handle: 'uuid',
                                   value: 30,
                                   type: NodeVariableType.String,
                                   in_connections: [],
                                   out_connections: [],
                               },
                               {
                                   name: '{space}',
                                   handle: 'space',
                                   value: 30,
                                   type: NodeVariableType.Number,
                                   in_connections: [],
                                   out_connections: [],
                               },
                           ],
                           type: NodeVariableType.Array,
                           in_connections: [],
                           out_connections: [],
                           has_dock: true,
                       },
                       {
                           name: 'Name',
                           handle: 'name',
                           value: 'John Doe',
                           type: NodeVariableType.String,
                           in_connections: [],
                           out_connections: [],
                           has_dock: false,
                       },
                       {
                           name: 'Age',
                           handle: 'age',
                           value: 30,
                           type: NodeVariableType.Number,
                           in_connections: null,
                           out_connections: [],
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
                                   in_connections: [],
                                   out_connections: [],
                               },
                               {
                                   name: '{age}',
                                   handle: 'age',
                                   value: 30,
                                   type: NodeVariableType.Number,
                                   in_connections: [],
                                   out_connections: [],
                               },
                               {
                                   name: '{uuid}',
                                   handle: 'uuid',
                                   value: 30,
                                   type: NodeVariableType.String,
                                   in_connections: [],
                                   out_connections: [],
                               },
                               {
                                   name: '{space}',
                                   handle: 'space',
                                   value: 30,
                                   type: NodeVariableType.Number,
                                   in_connections: [],
                                   out_connections: [],
                               },
                           ],
                           type: NodeVariableType.Array,
                           in_connections: [],
                           out_connections: [],
                           has_dock: true,
                       },
                   ],
               }
           ]
        }
    },

    removeConnectionFromNode: (connectionId: string, nodeUuid: string, handle: string, direction: InOut) => {
        const { activeProjectId, activeRouteId } = useEditorStore.getState();

        set((state) => {
            const projectNodes = state.nodes[activeProjectId];
            const routeNodes = projectNodes[activeRouteId];

            const updatedRouteNodes = routeNodes.map((node) => {
                if (node.uuid === nodeUuid) {
                    return {
                        ...node,
                        variables: node.variables.map((variable) => {
                            if (variable.handle === handle) {
                                if (direction === 'in') {
                                    return {
                                        ...variable,
                                        in_connections: (variable.in_connections || []).filter(
                                            (id) => id !== connectionId
                                        ),
                                    };
                                } else {
                                    return {
                                        ...variable,
                                        out_connections: (variable.out_connections || []).filter(
                                            (id) => id !== connectionId
                                        ),
                                    };
                                }
                            }
                            return variable;
                        }),
                    };
                }
                return node;
            });

            return {
                nodes: {
                    ...state.nodes,
                    [activeProjectId]: {
                        ...projectNodes,
                        [activeRouteId]: updatedRouteNodes,
                    },
                },
            };
        });
    },


    updateConnections: ({connectionId, sourceNodeUuid, sourceHandle, targetNodeUuid, targetHandle}) => {
        const { activeProjectId, activeRouteId } = useEditorStore.getState();
        set((state) => {
            const projectNodes = state.nodes[activeProjectId];
            const routeNodes = projectNodes[activeRouteId];

            const updatedRouteNodes = routeNodes.map((node) => {
                if (node.uuid === sourceNodeUuid) {
                    return {
                        ...node,
                        variables: node.variables.map((variable) =>
                            variable.handle === sourceHandle
                                ? {
                                    ...variable,
                                    out_connections: [...(variable.out_connections || []), connectionId],
                                }
                                : variable
                        ),
                    };
                }
                if (node.uuid === targetNodeUuid) {
                    return {
                        ...node,
                        variables: node.variables.map((variable) =>
                            variable.handle === targetHandle
                                ? {
                                    ...variable,
                                    in_connections: [...(variable.in_connections || []), connectionId],
                                }
                                : variable
                        ),
                    };
                }
                return node;
            });

            return {
                nodes: {
                    ...state.nodes,
                    [activeProjectId]: {
                        ...projectNodes,
                        [activeRouteId]: updatedRouteNodes,
                    },
                },
            };
        });
    },

    addNode: (node) => {
        const { activeProjectId, activeRouteId } = useEditorStore.getState();
        set((state) => ({
            nodes: {
                ...state.nodes,
                [activeProjectId]: {
                    ...state.nodes[activeProjectId],
                    [activeRouteId]: [...(state.nodes[activeProjectId]?.[activeRouteId] || []), node],
                },
            },
        }));
    },

    removeNode: (nodeUuid) => {
        const { activeProjectId, activeRouteId } = useEditorStore.getState();
        set((state: NodesStore) => {
            const projectNodes = state.nodes[activeProjectId] || {};
            const routeNodes = projectNodes[activeRouteId]?.filter((node) => node.uuid !== nodeUuid) || [];
            return {
                nodes: {
                    ...state.nodes,
                    [activeProjectId]: {
                        ...projectNodes,
                        [activeRouteId]: routeNodes,
                    },
                },
            };
        });
    },

    updateNodeWidth: (nodeId, width) => {
        const { activeRouteId, activeProjectId } = useEditorStore.getState();

        set((state) => {
            const projectNodes = state.nodes[activeProjectId];
            const routeNodes = projectNodes[activeRouteId].map((node) =>
                node.uuid === nodeId
                    ? { ...node, width }
                    : node
            );

            return {
                nodes: {
                    ...state.nodes,
                    [activeProjectId]: {
                        ...projectNodes,
                        [activeRouteId]: routeNodes,
                    },
                },
            };
        });
    },

    updateNodeHeight: (nodeId, newHeight) => {
        const { activeRouteId, activeProjectId } = useEditorStore.getState();

        set((state) => {
            const projectNodes = state.nodes[activeProjectId];
            const routeNodes = projectNodes[activeRouteId].map((node) =>
                node.uuid === nodeId
                    ? { ...node, height: newHeight }
                    : node
            );

            return {
                nodes: {
                    ...state.nodes,
                    [activeProjectId]: {
                        ...projectNodes,
                        [activeRouteId]: routeNodes,
                    },
                },
            };
        });
    },

    updateNodePosition: (nodeId, deltaX, deltaY) => {
        const { activeProjectId, activeRouteId } = useEditorStore.getState();

        set((state) => {
            const projectNodes = state.nodes[activeProjectId];
            const routeNodes = projectNodes[activeRouteId].map((node) =>
                node.uuid === nodeId
                    ? { ...node, x: node.x + deltaX, y: node.y + deltaY }
                    : node
            );

            return {
                nodes: {
                    ...state.nodes,
                    [activeProjectId]: {
                        ...projectNodes,
                        [activeRouteId]: routeNodes,
                    },
                },
            };
        });
    },

    getNode: (nodeUuid): Node | undefined => {
        const { activeProjectId, activeRouteId } = useEditorStore.getState();
        return (get().nodes[activeProjectId]?.[activeRouteId] || []).find(
            (node) => node.uuid === nodeUuid
        );
    },

    getNodes: (): Node[] => {
        const { activeProjectId, activeRouteId } = useEditorStore.getState();
        return get().nodes[activeProjectId]?.[activeRouteId] || [];
    },

    getNodesByIds: getNodesByIds(get),
}));

export default useNodesStore;
