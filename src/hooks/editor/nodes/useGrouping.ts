import useGroupCreation from './useGroupCreation';
import useGroupNavigation from './useGroupNavigation';
import useGroupManagement from './useGroupManagement';

const useGrouping = () => {
    const { createGroup: createGroupBase } = useGroupCreation();
    const { closeGroup, openGroup } = useGroupNavigation();
    const { dissolveGroup, deleteGroup, removeNodeFromGroup, moveNodeToGroup } = useGroupManagement();

    // Enhanced createGroup that also opens the group after creation
    const createGroup = () => {
        const groupId = createGroupBase();
        if (groupId) {
            openGroup(groupId);
        }
    };

    return {
        createGroup,
        closeGroup,
        deleteGroup,
        openGroup,
        dissolveGroup,
        removeNodeFromGroup,
        moveNodeToGroup
    };
};

export default useGrouping;
