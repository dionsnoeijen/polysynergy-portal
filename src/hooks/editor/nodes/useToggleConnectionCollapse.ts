import { Node } from '@/types/types';
import useConnectionsStore from "@/stores/connectionsStore";

const useToggleConnectionCollapse = (node: Node) => {
    const {
        findInConnectionsByNodeIdAndHandle,
        findOutConnectionsByNodeIdAndHandle,
        updateConnection
    } = useConnectionsStore();

    const collapseConnections = (handle: string) => {
        const inConnections = findInConnectionsByNodeIdAndHandle(node.id, handle, false);
        const outConnections = findOutConnectionsByNodeIdAndHandle(node.id, handle, false);

        [...inConnections, ...outConnections].forEach((connection) => {
            updateConnection({
                ...connection,
                collapsed: true,
            });
        });
    };

    const openConnections = (handle: string) => {
        const inConnections = findInConnectionsByNodeIdAndHandle(node.id, handle, false);
        const outConnections = findOutConnectionsByNodeIdAndHandle(node.id, handle, false);

        [...inConnections, ...outConnections].forEach((connection) => {
            updateConnection({
                ...connection,
                collapsed: false,
            });
        });
    };

    return { collapseConnections, openConnections };
};

export default useToggleConnectionCollapse;
