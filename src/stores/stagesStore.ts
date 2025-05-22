import {create, StateCreator} from 'zustand';
import {Stage} from "@/types/types";
import {
    createStageAPI,
    deleteStageAPI,
    fetchStagesAPI, reorderStagesAPI,
    updateStageAPI
} from "@/api/publishApi";
import useEditorStore from "@/stores/editorStore";

type StagesStore = {
    stages: Stage[];
    hasInitialFetched: boolean;
    fetchStages: () => Promise<void>;
    createStage: (name: string, isProduction: boolean) => Promise<Stage | undefined>;
    deleteStage: (stageId: string) => Promise<void>;
    updateStage: (stageId: string, name: string, isProduction: boolean) => Promise<void>;
    reorderStages: (fromIndex: number, toIndex: number) => void;
};

const useStagesStore = create<StagesStore>((set: Parameters<StateCreator<StagesStore>>[0]) => ({
    stages: [],

    hasInitialFetched: false,

    fetchStages: async () => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;
        try {
            const result = await fetchStagesAPI(activeProjectId);
            set({stages: result, hasInitialFetched: true});
        } catch (error) {
            console.error("Failed to fetch stages:", error);
        }
    },

    createStage: async (name, isProduction) => {
        const {activeProjectId} = useEditorStore.getState();
        try {
            const stage = await createStageAPI(activeProjectId, name, isProduction);
            set((state) => ({
                stages: [...state.stages, stage],
            }));
            return stage;
        } catch (error) {
            console.error("Failed to add stage:", error);
        }
    },

    deleteStage: async (stageId) => {
        try {
            await deleteStageAPI(stageId);
            set((state) => ({
                stages: state.stages.filter((s) => s.id !== stageId),
            }));
        } catch (error) {
            console.error("Failed to delete stage:", error);
        }
    },

    updateStage: async (stageId, name, isProduction) => {
        try {
            const updated = await updateStageAPI(stageId, {
                name,
                is_production: isProduction,
            });
            set((state) => ({
                stages: state.stages.map((s) =>
                    s.id === stageId ? updated : s
                ),
            }));
        } catch (error) {
            console.error("Failed to update stage:", error);
        }
    },

    reorderStages: async (fromIndex, toIndex) => {
        const {activeProjectId} = useEditorStore.getState();
        set((state) => {
            const updated = [...state.stages];
            const [moved] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, moved);
            // optimistic update
            return {stages: updated};
        });

        try {
            const reordered = useStagesStore.getState().stages.map((s) => s.id);
            await reorderStagesAPI(activeProjectId!, reordered);
        } catch (error) {
            console.error("Failed to reorder stages:", error);
        }
    },
}));

export default useStagesStore;