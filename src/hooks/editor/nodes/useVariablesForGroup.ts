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

const useVariablesForGroup = (groupId: string | null, checkDock = true) => {
    const getTrackedNode = useNodesStore((state) => state.getTrackedNode);
    const getNodeVariable = useNodesStore((state) => state.getNodeVariable);
    const getNodeSubVariable = useNodesStore((state) => state.getNodeSubVariable);
    const getGroupById = useNodesStore((state) => state.getGroupById);
    const findInConnectionsByNodeId = useConnectionsStore((state) => state.findInConnectionsByNodeId);
    const findOutConnectionsByNodeId = useConnectionsStore((state) => state.findOutConnectionsByNodeId);
    const connections = useConnectionsStore((state) => state.connections);

    groupId = groupId?.startsWith("mirror-") ? groupId.replace("mirror-", "") : groupId;

    const group = groupId ? getGroupById(groupId) : null;
    const node = getTrackedNode();

    const groupOverridesKey = useNodesStore((state) =>
        groupId ? getGroupOverridesKey(state, groupId) : ''
    );

    const variablesForGroup = useMemo(() => {
        if (!group) return null;

        const outConnections = findInConnectionsByNodeId(group.id);
        const inConnections = findOutConnectionsByNodeId(group.id);

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
            .filter(Boolean)
            .filter((item) => {
                if (!item || !item.variable) return false;
                return checkDock ? item.variable.has_dock : true;
            });

        const outVariables = outConnections
            .map((connection) => ({
                variable: getNodeVariable(connection.sourceNodeId, connection.sourceHandle),
                nodeId: connection.sourceNodeId,
            }))
            .filter(Boolean)
            .filter((item) => {
                if (!item.variable) return false;
                return checkDock ? item.variable.has_dock : true;
            });

        return {inVariables, outVariables};
        // eslint-disable-next-line
    }, [node, group, connections, groupOverridesKey]);

    return {group, variablesForGroup};
};


export default useVariablesForGroup;
