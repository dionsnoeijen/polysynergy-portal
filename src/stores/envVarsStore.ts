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
    isFetching: boolean;
    hasInitialFetched: boolean;
    envVars: EnvVar[];
    getEnvVarByKey: (key: string) => EnvVar | undefined;
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

    isFetching: false,
    hasInitialFetched: false,
    envVars: [],

    getEnvVarByKey: (key: string): EnvVar | undefined => {
        return get().envVars.find((env) => env.key === key);
    },

    fetchEnvVars: async () => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        set({isFetching: true});
        try {
            const data = await fetchProjectEnvVarsAPI(activeProjectId);
            set({
                envVars: data || [],
                hasInitialFetched: true
            });
            return data.envVars;
        } catch (error) {
            console.error("Failed to fetch environment variables:", error);
        } finally {
            set({isFetching: false});
        }
    },

    createEnvVar: async (key: string, value: string, stage: string): Promise<EnvVar | undefined> => {
        const {activeProjectId} = useEditorStore.getState();
        try {
            const response = await createProjectEnvVarAPI(activeProjectId, key, value, stage);
            const stageData = {
                id: response?.id || `${stage}#${key}`,
                value,
            };

            set((state) => {
                const existing = state.envVars.find((e) => e.key === key);
                if (existing) {
                    return {
                        envVars: state.envVars.map((e) =>
                            e.key === key
                                ? {
                                    ...e,
                                    values: {
                                        ...e.values,
                                        [stage]: stageData,
                                    },
                                }
                                : e
                        ),
                    };
                } else {
                    const newVar: EnvVar = {
                        key,
                        projectId: activeProjectId,
                        values: {
                            [stage]: stageData,
                        },
                    };
                    return {
                        envVars: [...state.envVars, newVar],
                    };
                }
            });

            return {
                key,
                projectId: activeProjectId,
                values: {
                    [stage]: stageData,
                },
            };
        } catch (error) {
            console.error("Failed to create env var:", error);
        }
    },

    updateEnvVar: async (envVar: EnvVar, stage: string) => {
        const {activeProjectId} = useEditorStore.getState();
        const stageData = envVar.values[stage];
        if (!stageData) return;

        try {
            await updateProjectEnvVarAPI(activeProjectId, envVar.key, stageData.value, stage);

            set((state) => ({
                envVars: state.envVars.map((e) =>
                    e.key === envVar.key
                        ? {
                            ...e,
                            values: {
                                ...e.values,
                                [stage]: {
                                    ...e.values[stage],
                                    value: stageData.value,
                                },
                            },
                        }
                        : e
                ),
            }));

            return {
                ...envVar,
                values: {
                    ...envVar.values,
                    [stage]: {
                        ...stageData,
                    },
                },
            };
        } catch (error) {
            console.error("Failed to update env var:", error);
        }
    },

    deleteEnvVar: async (id: string, stage: string) => {
        const {activeProjectId} = useEditorStore.getState();
        try {
            await deleteProjectEnvVarAPI(activeProjectId, id, stage);

            set((state) => ({
                envVars: state.envVars
                    .map((e) => {
                        if (e.values[stage]?.id === id) {
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const {[stage]: _, ...remainingStages} = e.values;
                            return {
                                ...e,
                                values: remainingStages,
                            };
                        }
                        return e;
                    })
                    .filter((e) => Object.keys(e.values).length > 0), // Filter lege entries
            }));
        } catch (error) {
            console.error("Failed to delete env var:", error);
        }
    },
}));

export default useEnvVarsStore;