import {create, StateCreator} from "zustand";
import {Config} from "@/types/types";
import {fetchConfigs as fetchConfigsAPI, storeConfig as storeConfigAPI} from "@/api/configsApi";
import useEditorStore from "@/stores/editorStore";

type ConfigsStore = {
    configs: Config[];
    storeConfig: (config: Config) => Promise<void>;
    getConfig: (configId: string) => Config | undefined;
    fetchConfigs: () => Promise<void>;
};

const useConfigsStore = create<ConfigsStore>((
    set: Parameters<StateCreator<ConfigsStore>>[0],
    get: () => ConfigsStore
) => ({
    configs: [],

    getConfig: (configId: string): Config | undefined => {
        return get().configs.find((config: Config) => config.id === configId);
    },

    storeConfig: async (config: Config) => {
        const { activeProjectId } = useEditorStore.getState();
        try {
            config.project_ids = [activeProjectId];
            const response = await storeConfigAPI(config);
            config.id = response.id;
            set((state) => ({configs: [...state.configs, response]}));
        } catch (error) {
            console.error('Failed to store config:', error);
        }
    },

    fetchConfigs: async () => {
        const { activeProjectId } = useEditorStore.getState();
        if (!activeProjectId) return;
        try {
            const data: Config[] = await fetchConfigsAPI(activeProjectId);
            set({configs: data});
        } catch (error) {
            console.error('Failed to fetch configs:', error);
        }
    }
}));

export default useConfigsStore;