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
    updateConnections: (payload: {
        connectionId: string;
        projectUuid: string;
        routeUuid: string;
        sourceNodeUuid: string;
        sourceHandle: string;
        targetNodeUuid: string;
        targetHandle: string;
    }) => void;
    updateNodePosition: (nodeId: string, deltaX: number, deltaY: number, projectUuid: string, routeUuid: string) => void;
    addNode: (projectUuid: string, routeUuid: string, node: Node) => void;
    removeNode: (projectUuid: string, routeUuid: string, nodeUuid: string) => void;
    getNodes: (projectUuid: string, routeUuid: string) => Node[];
};

const useNodesStore = create<NodesStore>((set) => ({
    nodes: {
        '72b38eed-dfb5-4a96-be50-1e2872e1581e': {
           'a2ac29df-2130-41da-b64d-b0314c19e47a': [
               {
                   uuid: 'a2ac29df-2130-41da-b64d-b0314c19e47a',
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
                   ],
               }
           ]
        }
    },

    updateConnections: ({connectionId, projectUuid, routeUuid, sourceNodeUuid, sourceHandle, targetNodeUuid, targetHandle}) => {
        set((state) => {
            const projectNodes = state.nodes[projectUuid];
            const routeNodes = projectNodes[routeUuid];

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
                    [projectUuid]: {
                        ...projectNodes,
                        [routeUuid]: updatedRouteNodes,
                    },
                },
            };
        });
    },

    addNode: (projectUuid, routeUuid, node) => {
        set((state) => ({
            nodes: {
                ...state.nodes,
                [projectUuid]: {
                    ...state.nodes[projectUuid],
                    [routeUuid]: [...(state.nodes[projectUuid]?.[routeUuid] || []), node],
                },
            },
        }));
    },

    removeNode: (projectUuid, routeUuid, nodeUuid) => {
        set((state: NodesStore) => {
            const projectNodes = state.nodes[projectUuid] || {};
            const routeNodes = projectNodes[routeUuid]?.filter((node) => node.uuid !== nodeUuid) || [];
            return {
                nodes: {
                    ...state.nodes,
                    [projectUuid]: {
                        ...projectNodes,
                        [routeUuid]: routeNodes,
                    },
                },
            };
        });
    },

    updateNodePosition: (nodeId, deltaX, deltaY, projectUuid, routeUuid) => {
        set((state) => {
            const projectNodes = state.nodes[projectUuid];
            const routeNodes = projectNodes[routeUuid].map((node) =>
                node.uuid === nodeId
                    ? { ...node, x: node.x + deltaX, y: node.y + deltaY }
                    : node
            );

            return {
                nodes: {
                    ...state.nodes,
                    [projectUuid]: {
                        ...projectNodes,
                        [routeUuid]: routeNodes,
                    },
                },
            };
        });
    },

    getNodes: (projectUuid, routeUuid): Node[] => {
        return (useNodesStore.getState().nodes[projectUuid]?.[routeUuid] || []);
    }
}));

export default useNodesStore;
