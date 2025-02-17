import { useMemo } from "react";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";

const useVariablesForGroup = (groupId: string | null, checkDock = true) => {
    const getTrackedNode = useNodesStore((state) => state.getTrackedNode);
    const getNodeVariable = useNodesStore((state) => state.getNodeVariable);
    const getGroupById = useNodesStore((state) => state.getGroupById);
    const findInConnectionsByNodeId = useConnectionsStore((state) => state.findInConnectionsByNodeId);
    const findOutConnectionsByNodeId = useConnectionsStore((state) => state.findOutConnectionsByNodeId);
    const connections= useConnectionsStore((state) => state.connections);

    groupId = groupId?.startsWith("mirror-") ? groupId.replace("mirror-", "") : groupId;
    
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
