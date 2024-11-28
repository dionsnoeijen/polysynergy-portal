import { useMemo } from "react";
import useNodesStore from "@/stores/nodesStore";
import useGroupsStore from "@/stores/groupStore";
import { useConnectionsStore } from "@/stores/connectionsStore";

const useVariablesForGroup = (groupId: string | null, checkDock = true) => {
    const { getGroupById } = useGroupsStore();
    const { getTrackedNode, getNodeVariable } = useNodesStore();
    const { findInConnectionsByNodeId, findOutConnectionsByNodeId, connections } = useConnectionsStore();

    const group = groupId ? getGroupById(groupId) : null;
    const node = getTrackedNode();

    const variablesForGroup = useMemo(() => {
        if (!group) return null;

        const outConnections = findInConnectionsByNodeId(group.id);
        const inConnections = findOutConnectionsByNodeId(group.id);

        const inVariables = inConnections
            .map((connection) => ({
                variable: getNodeVariable(connection.targetNodeId as string, connection.targetHandle as string),
                nodeId: connection.targetNodeId,
            }))
            .filter((item) => {
                if (!item.variable) return false;
                return checkDock ? item.variable.has_dock : true;
            });

        const outVariables = outConnections
            .map((connection) => ({
                variable: getNodeVariable(connection.sourceNodeId, connection.sourceHandle),
                nodeId: connection.sourceNodeId,
            }))
            .filter((item) => {
                if (!item.variable) return false;
                return checkDock ? item.variable.has_dock : true;
            });

        return { inVariables, outVariables };
    // eslint-disable-next-line
    }, [node, group, connections]);

    return { group, variablesForGroup };
};


export default useVariablesForGroup;
