import {useMemo} from "react";
import useNodesStore, {NodesStore} from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import {NodeVariable} from "@/types/types";

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
    const connections = useConnectionsStore((state) => state.connections);

    groupId = groupId?.startsWith("mirror-") ? groupId.replace("mirror-", "") : groupId;

    const group = groupId ? getGroupById(groupId) : null;
    const node = getTrackedNode();

    const groupOverridesKey = useNodesStore((state) =>
        groupId ? getGroupOverridesKey(state, groupId) : ''
    );

    const variablesForGroup = useMemo(() => {
        if (!group) return null;

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

        return {inVariables, outVariables};
        // eslint-disable-next-line
    }, [node, group, connections, groupOverridesKey]);

    return {group, variablesForGroup};
};


export default useVariablesForGroup;
