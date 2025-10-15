import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Fundamental } from '@/types/types';

type TreeStateStore = {
    // Tree state organized by project ID
    treeStateByProject: Record<string, Fundamental[]>;

    // Actions
    getTreeStateForProject: (projectId: string) => Fundamental[];
    setTreeStateForProject: (projectId: string, state: Fundamental[]) => void;
    toggleTreeForProject: (projectId: string, tree: Fundamental) => void;
    isTreeOpenForProject: (projectId: string, tree: Fundamental) => boolean;
    openTreeForProject: (projectId: string, tree: Fundamental) => void;
    closeTreeForProject: (projectId: string, tree: Fundamental) => void;
};

// Default trees that should be open for new projects
const DEFAULT_OPEN_TREES: Fundamental[] = [
    Fundamental.Route,
    Fundamental.Schedule,
    Fundamental.Blueprint
];

const useTreeStateStore = create<TreeStateStore>()(
    persist(
        (set, get) => ({
            treeStateByProject: {},

            getTreeStateForProject: (projectId: string) => {
                const state = get().treeStateByProject[projectId];
                // Return default state if project doesn't have saved state yet
                return state || DEFAULT_OPEN_TREES;
            },

            setTreeStateForProject: (projectId: string, state: Fundamental[]) => {
                set((store) => ({
                    treeStateByProject: {
                        ...store.treeStateByProject,
                        [projectId]: state
                    }
                }));
            },

            toggleTreeForProject: (projectId: string, tree: Fundamental) => {
                const currentState = get().getTreeStateForProject(projectId);
                const isOpen = currentState.includes(tree);

                if (isOpen) {
                    // Close tree
                    get().setTreeStateForProject(
                        projectId,
                        currentState.filter(t => t !== tree)
                    );
                } else {
                    // Open tree
                    get().setTreeStateForProject(
                        projectId,
                        [...currentState, tree]
                    );
                }
            },

            isTreeOpenForProject: (projectId: string, tree: Fundamental) => {
                const state = get().getTreeStateForProject(projectId);
                return state.includes(tree);
            },

            openTreeForProject: (projectId: string, tree: Fundamental) => {
                const currentState = get().getTreeStateForProject(projectId);
                if (!currentState.includes(tree)) {
                    get().setTreeStateForProject(projectId, [...currentState, tree]);
                }
            },

            closeTreeForProject: (projectId: string, tree: Fundamental) => {
                const currentState = get().getTreeStateForProject(projectId);
                if (currentState.includes(tree)) {
                    get().setTreeStateForProject(
                        projectId,
                        currentState.filter(t => t !== tree)
                    );
                }
            }
        }),
        {
            name: 'tree-state-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useTreeStateStore;
