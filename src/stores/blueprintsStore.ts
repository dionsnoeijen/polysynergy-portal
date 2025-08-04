import {create, StateCreator} from 'zustand';
import {Blueprint} from "@/types/types";
import {
    fetchBlueprints as fetchBlueprintsAPI,
    storeBlueprint as storeBlueprintAPI,
    updateBlueprint as updateBlueprintAPI,
    deleteBlueprint as deleteBlueprintAPI
} from "@/api/blueprintApi";
import useEditorStore from "@/stores/editorStore";

type BlueprintsStore = {
    reset: () => void;
    isFetching: boolean;
    hasInitialFetched: boolean;
    blueprints: Blueprint[];
    getBlueprint: (blueprintId: string) => Blueprint | undefined;
    fetchBlueprints: () => Promise<void>;
    storeBlueprint: (blueprint: Blueprint) => Promise<void>;
    updateBlueprint: (blueprint: Blueprint) => Promise<Blueprint | undefined>;
    deleteBlueprint: (blueprintId: string) => Promise<void>;
}

const useBlueprintsStore = create<BlueprintsStore>((
    set: Parameters<StateCreator<BlueprintsStore>>[0],
    get: () => BlueprintsStore,
) => ({
    reset: () => {
        set({
            blueprints: [],
            hasInitialFetched: false,
        });
    },

    isFetching: false,
    hasInitialFetched: false,

    blueprints: [],

    getBlueprint: (blueprintId: string): Blueprint | undefined => {
        return get().blueprints.find((blueprint: Blueprint) => blueprint.id === blueprintId);
    },

    storeBlueprint: async (blueprint: Blueprint) => {
        const { activeProjectId } = useEditorStore.getState();
        try {
            const response = await storeBlueprintAPI(activeProjectId, blueprint);
            blueprint.id = response.id;
            set((state) => ({blueprints: [...state.blueprints, blueprint]}));
        } catch (error) {
            console.error('Failed to store blueprint:', error);
        }
    },

    updateBlueprint: async (blueprint: Blueprint): Promise<Blueprint | undefined> => {
        const { activeProjectId } = useEditorStore.getState();
        try {
            const response = await updateBlueprintAPI(activeProjectId, blueprint.id as string, blueprint);
            set((state) => ({
                blueprints: state.blueprints.map((b) => (b.id === blueprint.id ? blueprint : b)),
            }));
            return response;
        } catch (error) {
            console.error('Failed to update blueprint:', error);
        }
    },

    deleteBlueprint: async (blueprintId: string) => {
        const { activeProjectId } = useEditorStore.getState();
        try {
            await deleteBlueprintAPI(activeProjectId, blueprintId);
            set((state) => ({
                blueprints: state.blueprints.filter((b) => b.id !== blueprintId),
            }));
        } catch (error) {
            console.error('Failed to delete blueprint:', error);
        }
    },

    fetchBlueprints: async () => {
        const { activeProjectId } = useEditorStore.getState();
        if (!activeProjectId) return;

        set({isFetching: true});

        try {
            const data: Blueprint[] = await fetchBlueprintsAPI(activeProjectId);
            set({ blueprints: data, hasInitialFetched: true });
        } catch (error) {
            console.error('Failed to fetch blueprints:', error);
        } finally {
            set({isFetching: false});
        }
    }
}));

export default useBlueprintsStore;