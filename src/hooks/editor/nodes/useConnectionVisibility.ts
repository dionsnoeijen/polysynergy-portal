import useNodesStore from '@/stores/nodesStore';
import useConnectionsStore from '@/stores/connectionsStore';
import { Connection } from '@/types/types';
import { updateConnectionsDirectly } from '@/utils/updateConnectionsDirectly';

const useConnectionVisibility = () => {
    const getGroupById = useNodesStore((state) => state.getGroupById);
    const showConnectionsInsideOpenGroup = useConnectionsStore((state) => state.showConnectionsInsideOpenGroup);
    const showConnectionsOutsideGroup = useConnectionsStore((state) => state.showConnectionsOutsideGroup);

    const restoreConnectionVisibility = () => {
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
    };

    return {
        restoreConnectionVisibility,
        showConnectionsInsideOpenGroup,
        showConnectionsOutsideGroup
    };
};

export default useConnectionVisibility;