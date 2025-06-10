import { create, StateCreator } from 'zustand';
import { ApiKey } from "@/types/types";
import {
    fetchApiKeysAPI,
    createApiKeyAPI,
    updateApiKeyAPI,
    deleteApiKeyAPI,
} from "@/api/apikeysApi";
import useEditorStore from "@/stores/editorStore";

type ApiKeysStore = {
    apiKeys: ApiKey[];
    hasInitialFetched: boolean;
    fetchApiKeys: () => Promise<void>;
    createApiKey: (label: string, keyData: string) => Promise<ApiKey | undefined>;
    updateApiKey: (keyId: string, label: string, key: string) => Promise<void>;
    deleteApiKey: (keyId: string) => Promise<void>;
};

const useApiKeysStore = create<ApiKeysStore>((set: Parameters<StateCreator<ApiKeysStore>>[0]) => ({
    apiKeys: [],
    hasInitialFetched: false,

    fetchApiKeys: async () => {
        const { activeProjectId } = useEditorStore.getState();
        if (!activeProjectId) return;
        try {
            const result = await fetchApiKeysAPI(activeProjectId);
            set({ apiKeys: result, hasInitialFetched: true });
        } catch (error) {
            console.error("Failed to fetch API keys:", error);
        }
    },

    createApiKey: async (label, key) => {
        const { activeProjectId } = useEditorStore.getState();
        if (!activeProjectId) return;
        try {
            const apikey = await createApiKeyAPI(activeProjectId, label, key);
            set((state) => ({
                apiKeys: [...state.apiKeys, apikey],
            }));
            return apikey;
        } catch (error) {
            console.error("Failed to create API key:", error);
        }
    },

    updateApiKey: async (keyId: string, label: string, key: string) => {
        try {
            const updated = await updateApiKeyAPI(keyId, { label, key });
            set((state) => ({
                apiKeys: state.apiKeys.map((k) => (k.key_id === keyId ? updated : k)),
            }));
        } catch (error) {
            console.error("Failed to update API key:", error);
        }
    },

    deleteApiKey: async (keyId) => {
        try {
            await deleteApiKeyAPI(keyId);
            set((state) => ({
                apiKeys: state.apiKeys.filter((k) => k.key_id !== keyId),
            }));
        } catch (error) {
            console.error("Failed to delete API key:", error);
        }
    },
}));

export default useApiKeysStore;