import { Node } from '@/types/types';
import useConnectionsStore from "@/stores/connectionsStore";
import { calculateConnectorPositionByAttributes } from "@/utils/positionUtils";
import { InOut } from "@/types/types";

const useToggleConnectionCollapse = (node: Node) => {
    const {
        findInConnectionsByNodeId,
        findOutConnectionsByNodeId,
        findInConnectionsByNodeIdAndHandle,
        findOutConnectionsByNodeIdAndHandle,
        updateConnection
    } = useConnectionsStore();

    const collapseConnections = (handle: string) => {
        const inConnections = findInConnectionsByNodeIdAndHandle(node.id, handle, false);
        const outConnections = findOutConnectionsByNodeIdAndHandle(node.id, handle, false);

        const connectorPosition = calculateConnectorPositionByAttributes(
            node.id,
            handle,
            InOut.In
        );

        inConnections.forEach((connection) => {
            updateConnection({
                ...connection,
                endX: connectorPosition.x,
                endY: connectorPosition.y,
                collapsed: true,
            });
        });

        outConnections.forEach((connection) => {
            updateConnection({
                ...connection,
                startX: connectorPosition.x,
                startY: connectorPosition.y,
                collapsed: true,
            });
        });

        updateAllConnectionsForNode();
    };

    const openConnections = (handle: string) => {
        const inConnections = findInConnectionsByNodeIdAndHandle(node.id, handle, false);
        const outConnections = findOutConnectionsByNodeIdAndHandle(node.id, handle, false);

        inConnections.forEach((connection) => {
            const endConnectorPosition = calculateConnectorPositionByAttributes(
                connection.targetNodeId || '',
                connection.targetHandle || '',
                InOut.In
            );
            updateConnection({
                ...connection,
                endX: endConnectorPosition.x,
                endY: endConnectorPosition.y,
                collapsed: false,
            });
        });

        outConnections.forEach((connection) => {
            const startConnectorPosition = calculateConnectorPositionByAttributes(
                connection.sourceNodeId,
                connection.sourceHandle,
                InOut.Out
            );
            updateConnection({
                ...connection,
                startX: startConnectorPosition.x,
                startY: startConnectorPosition.y,
                collapsed: false,
            });
        });

        updateAllConnectionsForNode();
    };

    const updateAllConnectionsForNode = () => {
        const allInConnections = findInConnectionsByNodeId(node.id);
        const allOutConnections = findOutConnectionsByNodeId(node.id);

        allInConnections.forEach((connection) => {
            const targetHandle = connection.collapsed
                ? getParentHandle(connection.targetHandle)
                : connection.targetHandle;

            const endConnectorPosition = calculateConnectorPositionByAttributes(
                connection.targetNodeId || '',
                targetHandle || '',
                InOut.In
            );

            updateConnection({
                ...connection,
                endX: endConnectorPosition.x,
                endY: endConnectorPosition.y,
            });
        });

        allOutConnections.forEach((connection) => {
            const sourceHandle = connection.collapsed
                ? getParentHandle(connection.sourceHandle)
                : connection.sourceHandle;

            const startConnectorPosition = calculateConnectorPositionByAttributes(
                connection.sourceNodeId,
                sourceHandle || '',
                InOut.Out
            );

            updateConnection({
                ...connection,
                startX: startConnectorPosition.x,
                startY: startConnectorPosition.y,
            });
        });
    };

    const getParentHandle = (handle: string | undefined): string | undefined => {
        if (!handle) return undefined;
        return handle.split('.')[0];
    };

    return { collapseConnections, openConnections };
};

export default useToggleConnectionCollapse;
