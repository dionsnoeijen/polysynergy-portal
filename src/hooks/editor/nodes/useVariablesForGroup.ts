import {useMemo} from "react";
import useNodesStore, {NodesStore} from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import {NodeVariable, NodeType} from "@/types/types";

const getGroupOverridesKey = (state: NodesStore, groupId: string) => {
    const group = state.getGroupById(groupId);
    if (!group?.group?.nodes) return '';

    return group.group.nodes
        .map((nodeId: string) => {
            const node = state.nodes.find((n) => n.id === nodeId);
            if (!node) return '';

            return node.variables.map((v: NodeVariable) => {
                const parent = v.group_name_override ?? '';
                const children = v.type === 'dict' && Array.isArray(v.value)
                    ? (v.value as NodeVariable[]).map((sub) => sub.group_name_override ?? '').join('|')
                    : '';

                return `${parent}|${children}`;
            }).join('|');
        })
        .join('|');
};

const useVariablesForGroup = (groupId: string | null) => {
    const getTrackedNode = useNodesStore((state) => state.getTrackedNode);
    const getNodeVariable = useNodesStore((state) => state.getNodeVariable);
    const getNodeSubVariable = useNodesStore((state) => state.getNodeSubVariable);
    const getGroupById = useNodesStore((state) => state.getGroupById);
    const getNode = useNodesStore((state) => state.getNode);
    const connections = useConnectionsStore((state) => state.connections);

    groupId = groupId?.startsWith("mirror-") ? groupId.replace("mirror-", "") : groupId;

    const group = groupId ? getGroupById(groupId) : null;
    const node = getTrackedNode();

    const groupOverridesKey = useNodesStore((state) =>
        groupId ? getGroupOverridesKey(state, groupId) : ''
    );

    const variablesForGroup = useMemo(() => {
        if (!group) return null;

        // Recursive function to collect exposed variables from this group and all nested groups
        const collectExposedVariables = (currentGroupId: string, visited = new Set<string>()): Array<{ variable: NodeVariable; nodeId: string }> => {
            // Prevent infinite loops
            if (visited.has(currentGroupId)) return [];
            visited.add(currentGroupId);

            const currentGroup = getGroupById(currentGroupId);
            if (!currentGroup?.group?.nodes) return [];

            const exposed: Array<{ variable: NodeVariable; nodeId: string }> = [];

            // For each node in this group
            currentGroup.group.nodes.forEach((nodeId: string) => {
                const node = getNode(nodeId);
                if (!node) return;

                // If it's a group, recurse into it
                if (node.type === NodeType.Group) {
                    const nestedExposed = collectExposedVariables(nodeId, visited);
                    exposed.push(...nestedExposed);
                } else {
                    // Check each variable for exposed_to_group
                    node.variables.forEach((variable: NodeVariable) => {
                        if (variable.exposed_to_group) {
                            exposed.push({
                                variable,
                                nodeId: node.id,
                            });
                        }

                        // Also check sub-variables in dicts
                        if (variable.type === 'dict' && Array.isArray(variable.value)) {
                            (variable.value as NodeVariable[]).forEach((subVar: NodeVariable) => {
                                if (subVar.exposed_to_group) {
                                    exposed.push({
                                        variable: {
                                            ...subVar,
                                            name: `${variable.name}.${subVar.handle}`,
                                            parentHandle: variable.handle,
                                        },
                                        nodeId: node.id,
                                    });
                                }
                            });
                        }
                    });
                }
            });

            return exposed;
        };

        // Helper: check if a node is inside this group
        const isNodeInGroup = (nodeId: string): boolean => {
            return group.group?.nodes?.includes(nodeId) ?? false;
        };

        // IN variabelen: connections van buiten naar binnen de group
        // Source moet BUITEN de group zijn, target moet BINNEN de group zijn
        const inConnections = connections.filter(c =>
            c.isInGroup === group.id &&
            c.targetNodeId &&
            c.targetNodeId !== group.id &&
            !c.targetGroupId &&
            isNodeInGroup(c.targetNodeId) &&
            !isNodeInGroup(c.sourceNodeId)
        );

        // OUT variabelen: connections van binnen naar buiten de group
        // Source moet BINNEN de group zijn, target moet BUITEN de group zijn (of niet bestaan voor boundary)
        const outConnections = connections.filter(c =>
            c.isInGroup === group.id &&
            c.sourceNodeId &&
            c.sourceNodeId !== group.id &&
            !c.sourceGroupId &&
            isNodeInGroup(c.sourceNodeId) &&
            (!c.targetNodeId || !isNodeInGroup(c.targetNodeId))
        );

        const inVariables = inConnections
            .map((connection) => {
                if (
                    connection.targetHandle === undefined ||
                    connection.targetNodeId === undefined
                ) return null;

                let variable = getNodeVariable(
                    connection.targetNodeId,
                    connection.targetHandle
                );

                if (connection?.targetHandle?.indexOf('.') > -1) {
                    variable = getNodeSubVariable(
                        connection.targetNodeId,
                        connection.targetHandle
                    )
                }

                if (!variable) return null;

                return {
                    variable,
                    nodeId: connection.targetNodeId,
                }
            })
            .filter(Boolean);

        const outVariables = outConnections
            .map((connection) => {
                if (!connection.sourceNodeId || !connection.sourceHandle) return null;

                let variable = getNodeVariable(connection.sourceNodeId, connection.sourceHandle);

                // Check voor sub-variabelen
                if (connection.sourceHandle?.indexOf('.') > -1) {
                    variable = getNodeSubVariable(connection.sourceNodeId, connection.sourceHandle);
                }

                if (!variable) return null;

                return {
                    variable,
                    nodeId: connection.sourceNodeId,
                };
            })
            .filter(Boolean);

        // Collect all exposed variables from this group and nested groups
        const exposedVariables = collectExposedVariables(group.id);

        return {inVariables, outVariables, exposedVariables};
        // eslint-disable-next-line
    }, [node, group, connections, groupOverridesKey]);

    return {group, variablesForGroup};
};


export default useVariablesForGroup;
