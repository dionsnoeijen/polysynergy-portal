import {create, StateCreator} from 'zustand';
import {Blueprint} from "@/types/types";
import {
    fetchBlueprints as fetchBlueprintsAPI,
    storeBlueprint as storeBlueprintAPI
} from "@/api/blueprintApi";
import useEditorStore from "@/stores/editorStore";

type BlueprintsStore = {
    blueprints: Blueprint[];
    getBlueprint: (blueprintId: string) => Blueprint | undefined;
    fetchBlueprints: () => Promise<void>;
    storeBlueprint: (blueprint: Blueprint) => Promise<void>;
}

const useBlueprintsStore = create<BlueprintsStore>((
    set: Parameters<StateCreator<BlueprintsStore>>[0],
    get: () => BlueprintsStore,
) => ({
    blueprints: [],

    getBlueprint: (blueprintId: string): Blueprint | undefined => {
        return get().blueprints.find((blueprint: Blueprint) => blueprint.id === blueprintId);
    },

    storeBlueprint: async (blueprint: Blueprint) => {
        const { activeProjectId } = useEditorStore.getState();
        try {
            blueprint.project_ids = [activeProjectId];
            const response = await storeBlueprintAPI(blueprint);
            blueprint.id = response.id;
            set((state) => ({blueprints: [...state.blueprints, blueprint]}));
        } catch (error) {
            console.error('Failed to store blueprint:', error);
        }
    },

    fetchBlueprints: async () => {
        const { activeProjectId } = useEditorStore.getState();
        if (!activeProjectId) return;
        try {
            const data: Blueprint[] = await fetchBlueprintsAPI(activeProjectId);
            set({ blueprints: data });
        } catch (error) {
            console.error('Failed to fetch blueprints:', error);
        }
    }
}));

export default useBlueprintsStore;