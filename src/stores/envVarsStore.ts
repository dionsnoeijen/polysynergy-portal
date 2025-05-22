import {create} from 'zustand';
import {
    fetchProjectEnvVarsAPI,
    createProjectEnvVarAPI,
    updateProjectEnvVarAPI,
    deleteProjectEnvVarAPI,
} from '@/api/envVarsApi';
import useEditorStore from '@/stores/editorStore';
import {EnvVar} from '@/types/types';

type EnvVarsStore = {
    reset: () => void;
    hasInitialFetched: boolean;
    envVars: EnvVar[];
    getEnvVarsByKey: (key: string) => EnvVar[];
    getEnvVar: (id: string) => EnvVar | undefined;
    fetchEnvVars: () => Promise<EnvVar[] | undefined>;
    createEnvVar: (key: string, value: string, stage: string) => Promise<EnvVar | undefined>;
    updateEnvVar: (envVar: EnvVar, stage: string) => Promise<EnvVar | undefined>;
    deleteEnvVar: (id: string, stage: string) => Promise<void>;
};

const useEnvVarsStore = create<EnvVarsStore>((set, get) => ({
    reset: () => {
        set({
            envVars: [],
            hasInitialFetched: false,
        });
    },

    hasInitialFetched: false,
    envVars: [],

    getEnvVarsByKey: (rawId: string): EnvVar[] => {
        const parts = rawId.split("#");
        const key = parts.length === 4 ? parts[3] : rawId;
        return get().envVars.filter((env) => env.key === key);
    },

    getEnvVar: (id: string): EnvVar | undefined =>
        get().envVars.find((env) => env.id === id),

    fetchEnvVars: async () => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;
        try {
            const data = await fetchProjectEnvVarsAPI(activeProjectId);
            set({envVars: data.envVars || [], hasInitialFetched: true});
            return data.envVars;
        } catch (error) {
            console.error("Failed to fetch environment variables:", error);
        }
    },

    createEnvVar: async (key: string, value: string, stage: string): Promise<EnvVar | undefined> => {
        const {activeProjectId} = useEditorStore.getState();
        try {
            const response = await createProjectEnvVarAPI(activeProjectId, key, value, stage);
            const newVar: EnvVar = {
                id: response?.id || `${stage}-${key}`,
                key,
                value,
                stage,
                projectId: activeProjectId,
            };
            set((state) => ({envVars: [...state.envVars, newVar]}));
            return newVar;
        } catch (error) {
            console.error("Failed to create env var:", error);
        }
    },

    updateEnvVar: async (envVar: EnvVar, stage: string) => {
        const {activeProjectId} = useEditorStore.getState();
        try {
            await updateProjectEnvVarAPI(activeProjectId, envVar.id, envVar.value || '', stage);
            set((state) => ({
                envVars: state.envVars.map((e) => (e.id === envVar.id ? envVar : e)),
            }));
            return envVar;
        } catch (error) {
            console.error("Failed to update env var:", error);
        }
    },

    deleteEnvVar: async (id: string, stage: string) => {
        const {activeProjectId} = useEditorStore.getState();
        try {
            await deleteProjectEnvVarAPI(activeProjectId, id, stage);
            set((state) => ({
                envVars: state.envVars.filter((e) => e.id !== id),
            }));
        } catch (error) {
            console.error("Failed to delete env var:", error);
        }
    },
}));

export default useEnvVarsStore;