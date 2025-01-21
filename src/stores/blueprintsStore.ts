import {create} from 'zustand';
import {Blueprint} from "@/types/types";

type BlueprintsStore = {
    blueprints: Blueprint[];
    getBlueprint: (blueprintId: string) => Promise<void>;
}

const useBlueprintsStore = create<BlueprintsStore>((set) => ({
    blueprints: [],
    getBlueprint: async (blueprintId: string) => {
        try {
            const data = await fetch(`/api/blueprints/${blueprintId}`);
            set({ blueprints: data });
        } catch (error) {
            console.error('Failed to fetch blueprint:', error);
        }
    }
}));

export default useBlueprintsStore;