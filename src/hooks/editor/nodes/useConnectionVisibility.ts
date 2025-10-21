import { useCallback } from 'react';
import useNodesStore from '@/stores/nodesStore';
import useConnectionsStore from '@/stores/connectionsStore';
import { Connection } from '@/types/types';
import { updateConnectionsDirectly } from '@/utils/updateConnectionsDirectly';

const useConnectionVisibility = () => {
    // PERFORMANCE: Convert store subscriptions to getState() pattern
    // This hook is called through the chain: useConnectionVisibility → useGroupManagement →
    // useGrouping → useNodeContextMenu → useNodeInteractions → NodeRows
    // With 100 nodes, this creates 300 unnecessary subscriptions (3 per node)

    const getGroupById = useCallback((groupId: string) =>
        useNodesStore.getState().getGroupById(groupId),
        []
    );

    const showConnectionsInsideOpenGroup = useCallback((group: any) =>
        useConnectionsStore.getState().showConnectionsInsideOpenGroup(group),
        []
    );

    const showConnectionsOutsideGroup = useCallback(() =>
        useConnectionsStore.getState().showConnectionsOutsideGroup(),
        []
    );

    const restoreConnectionVisibility = useCallback(() => {
        const { groupStack: newStack } = useNodesStore.getState();
        const parentGroupId = newStack[newStack.length - 1];
        let showConnections: Connection[] = [];

        if (parentGroupId) {
            const parentGroup = getGroupById(parentGroupId);
            if (parentGroup) {
                showConnections = showConnectionsInsideOpenGroup(parentGroup);
            }
        } else {
            showConnections = showConnectionsOutsideGroup();
        }

        setTimeout(() => {
            updateConnectionsDirectly(showConnections);
        }, 0);
    }, [getGroupById, showConnectionsInsideOpenGroup, showConnectionsOutsideGroup]);

    return {
        restoreConnectionVisibility,
        showConnectionsInsideOpenGroup,
        showConnectionsOutsideGroup
    };
};

export default useConnectionVisibility;