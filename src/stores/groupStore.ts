import { create } from 'zustand';
import { v4 as uuidv4 } from "uuid";

export type Group = {
    id: string;
    name: string;
    isOpen: boolean;
    nodes: string[];
    parentGroupId?: string;
    inConnections?: string[];
    outConnections?: string[];
};

type GroupsStore = {
    groups: Record<string, Group>;
    toggleGroupOpen: (groupId: string) => void;
    closeGroup: (groupId: string) => void;
    addGroup: (group: Partial<Group>) => void;
    removeGroup: (groupId: string) => void;
    addNodeToGroup: (groupId: string, nodeId: string) => void;
    removeNodeFromGroup: (groupId: string, nodeId: string) => void;
    getOpenGroups: () => Group[];
    getClosedGroups: () => Group[];
    getNodesInGroup: (groupId: string) => string[];
};

const getNodesInGroup = (get: () => GroupsStore) => (groupId: string): string[] => {
    const { groups } = get();
    return groups[groupId]?.nodes || [];
};

const getOpenGroups = (get: () => GroupsStore) => (): Group[] => {
    const { groups } = get();
    return Object.values(groups).filter((group) => group.isOpen);
};

const getClosedGroups = (get: () => GroupsStore) => (): Group[] => {
    const { groups } = get();
    return Object.values(groups).filter((group) => !group.isOpen);
};

const useGroupsStore = create<GroupsStore>((set, get) => ({
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

    closeGroup: (groupId) => set((state) => {
        const group = state.groups[groupId];
        return {
            groups: {
                ...state.groups,
                [groupId]: { ...group, isOpen: false }
            }
        };
    }),

    addGroup: (group: Partial<Group>) => {
        const newGroup: Group = {
            id: group.id || uuidv4(),
            name: group.name || 'Untitled Group',
            isOpen: group.isOpen !== undefined ? group.isOpen : true,
            parentGroupId: group.parentGroupId,
            nodes: group.nodes || [],
            inConnections: group.inConnections || [],
            outConnections: group.outConnections || []
        };

        set((state) => ({
            groups: { ...state.groups, [newGroup.id]: newGroup }
        }));
    },

    removeGroup: (groupId) => set((state) => {
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

    getOpenGroups: getOpenGroups(get),
    getClosedGroups: getClosedGroups(get),
    getNodesInGroup: getNodesInGroup(get),
}));

export default useGroupsStore;
