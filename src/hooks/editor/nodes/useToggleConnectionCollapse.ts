import { useCallback } from 'react';
import { Node } from '@/types/types';
import useConnectionsStore from "@/stores/connectionsStore";

const useToggleConnectionCollapse = (node: Node) => {
    // PERFORMANCE: Use getState() pattern to avoid store subscriptions
    const collapseConnections = useCallback((handle: string) => {
        const { findInConnectionsByNodeIdAndHandle, findOutConnectionsByNodeIdAndHandle, updateConnection } =
            useConnectionsStore.getState();

        const inConnections = findInConnectionsByNodeIdAndHandle(node.id, handle, false);
        const outConnections = findOutConnectionsByNodeIdAndHandle(node.id, handle, false);

        [...inConnections, ...outConnections].forEach((connection) => {
            updateConnection({
                ...connection,
                collapsed: true,
            });
        });
    }, [node.id]);

    const openConnections = useCallback((handle: string) => {
        const { findInConnectionsByNodeIdAndHandle, findOutConnectionsByNodeIdAndHandle, updateConnection } =
            useConnectionsStore.getState();

        const inConnections = findInConnectionsByNodeIdAndHandle(node.id, handle, false);
        const outConnections = findOutConnectionsByNodeIdAndHandle(node.id, handle, false);

        [...inConnections, ...outConnections].forEach((connection) => {
            updateConnection({
                ...connection,
                collapsed: false,
            });
        });
    }, [node.id]);

    return { collapseConnections, openConnections };
};

export default useToggleConnectionCollapse;
