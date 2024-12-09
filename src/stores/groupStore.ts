import { create } from 'zustand';
import { v4 as uuidv4 } from "uuid";
import useNodesStore from "@/stores/nodesStore";
import { groupDevData } from "@/stores/nodeDevData";

export type Group = {
    id: string;
    name: string;
    isOpen: boolean;
    isHidden: boolean;
    nodes: string[];
};

type GroupsStore = {
    groups: Record<string, Group>;
    openGroup: (groupId: string) => void;
    isNodeInGroup: (nodeId: string) => string | null;
    closeGroup: (groupId: string) => void;
    hideGroup: (groupId: string) => void;
    showGroup: (groupId: string) => void;
    addGroup: (group: Partial<Group>) => string;
    removeGroup: (groupId: string) => void;
    addNodeToGroup: (groupId: string, nodeId: string) => void;
    removeNodeFromGroup: (groupId: string, nodeId: string) => void;
    getOpenGroups: () => Group[];
    getClosedGroups: () => Group[];
    getNodesInGroup: (groupId: string) => string[];
    getGroupById: (groupId: string) => Group | undefined;
    getAllNodeIdsOfNodesThatAreInAClosedGroup: () => string[];
    updateGroup: (groupId: string, group: Partial<Group>) => void;
};

const nodesInGroupCache = new Map<string, string[]>();

const getNodesInGroup = (get: () => GroupsStore) => (groupId: string): string[] => {
    const { groups } = get();
    const group = groups[groupId];
    if (!group) return [];

    const cachedNodes = nodesInGroupCache.get(groupId);
    if (cachedNodes && cachedNodes === group.nodes) {
        return cachedNodes;
    }

    nodesInGroupCache.set(groupId, group.nodes);
    return group.nodes;
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
    groups: groupDevData,

    openGroup: (groupId) => set((state) => {
        const group = state.groups[groupId];
        return {
            groups: {
                ...state.groups,
                [groupId]: { ...group, isOpen: true }
            }
        };
    }),

    isNodeInGroup: (nodeId) => {
        const groups = get().groups;
        for (const groupId in groups) {
            if (groups[groupId].nodes.includes(nodeId)) {
                return groupId;
            }
        }
        return null;
    },

    closeGroup: (groupId) => set((state) => {
        const group = state.groups[groupId];
        return {
            groups: {
                ...state.groups,
                [groupId]: { ...group, isOpen: false }
            }
        };
    }),

    hideGroup: (groupId) => set((state) => {
        const group = state.groups[groupId];
        return {
            groups: {
                ...state.groups,
                [groupId]: { ...group, isHidden: true }
            }
        };
    }),

    showGroup: (groupId) => set((state) => {
        const group = state.groups[groupId];
        return {
            groups: {
                ...state.groups,
                [groupId]: { ...group, isHidden: false }
            }
        };
    }),

    addGroup: (group: Partial<Group>) => {
        const newGroup: Group = {
            id: group.id || uuidv4(),
            name: group.name || 'Untitled Group',
            isOpen: group.isOpen !== undefined ? group.isOpen : true,
            nodes: group.nodes || [],
            isHidden: false,
        };

        set((state) => ({
            groups: { ...state.groups, [newGroup.id]: newGroup }
        }));

        return newGroup.id;
    },

    removeGroup: (groupId) => set((state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [groupId]: _, ...remainingGroups } = state.groups;
        return { groups: remainingGroups };
    }),

    addNodeToGroup: (groupId, nodeId) => set((state) => {
        nodesInGroupCache.delete(groupId);
        const group = state.groups[groupId];
        return {
            groups: {
                ...state.groups,
                [groupId]: { ...group, nodes: [...group.nodes, nodeId] }
            }
        };
    }),

    removeNodeFromGroup: (groupId, nodeId) => set((state) => {
        nodesInGroupCache.delete(groupId);
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

    getGroupById: (groupId) => get().groups[groupId],

    getAllNodeIdsOfNodesThatAreInAClosedGroup: (): string[] => {
        const closedGroups = useGroupsStore.getState().getClosedGroups();
        return closedGroups.flatMap((group) => group.nodes);
    },

    updateGroup: (groupId, group) => set((state) => {
        nodesInGroupCache.delete(groupId);
        const currentGroup = state.groups[groupId];

        // if name is updated, sync with node
        if (group.name && currentGroup.name !== group.name) {
            useNodesStore.getState().updateNode(groupId, {name: group.name});
        }

        return {
            groups: {
                ...state.groups,
                [groupId]: { ...currentGroup, ...group }
            }
        };
    }),
}));

export default useGroupsStore;
