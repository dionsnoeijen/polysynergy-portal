import { create } from 'zustand';

export type Group = {
    uuid: string;
    name: string;
    isOpen: boolean;
    parentGroupId?: string;
    nodes: string[]; // UUID's van de nodes in deze groep
    inConnections: string[];
    outConnections: string[];
};

type GroupsStore = {
    groups: Record<string, Group>;
    toggleGroupOpen: (groupId: string) => void;
    addGroup: (group: Group) => void;
    removeGroup: (groupId: string) => void;
    addNodeToGroup: (groupId: string, nodeId: string) => void;
    removeNodeFromGroup: (groupId: string, nodeId: string) => void;
};

const useGroupsStore = create<GroupsStore>((set) => ({
    groups: {},

    toggleGroupOpen: (groupId) => set((state) => {
        const group = state.groups[groupId];
        return {
            groups: {
                ...state.groups,
                [groupId]: { ...group, isOpen: !group.isOpen }
            }
        };
    }),

    addGroup: (group) => set((state) => ({
        groups: { ...state.groups, [group.uuid]: group }
    })),

    removeGroup: (groupId) => set((state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [groupId]: _, ...remainingGroups } = state.groups;
        return { groups: remainingGroups };
    }),

    addNodeToGroup: (groupId, nodeId) => set((state) => {
        const group = state.groups[groupId];
        return {
            groups: {
                ...state.groups,
                [groupId]: { ...group, nodes: [...group.nodes, nodeId] }
            }
        };
    }),

    removeNodeFromGroup: (groupId, nodeId) => set((state) => {
        const group = state.groups[groupId];
        return {
            groups: {
                ...state.groups,
                [groupId]: { ...group, nodes: group.nodes.filter(id => id !== nodeId) }
            }
        };
    }),
}));

export default useGroupsStore;
