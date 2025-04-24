import {create} from 'zustand';
import {
    fetchProjectSecretsAPI,
    createProjectSecretAPI,
    updateProjectSecretAPI,
    deleteProjectSecretAPI,
} from '@/api/secretsApi';
import useEditorStore from '@/stores/editorStore';
import {Secret} from '@/types/types';

type ProjectSecretsStore = {
    hasInitialFetched: boolean;
    secrets: Secret[];
    getSecret: (secretId: string) => Secret | undefined;
    fetchSecrets: () => Promise<Secret[]>;
    createSecret: (key: string, secret_value: string) => Promise<Secret | undefined>;
    updateSecret: (secret: Secret) => Promise<Secret | undefined>;
    deleteSecret: (secretId: string) => Promise<void>;
};

const useProjectSecretsStore = create<ProjectSecretsStore>((set, get) => ({
    hasInitialFetched: false,

    secrets: [],

    getSecret: (secretId: string): Secret | undefined =>
        get().secrets.find((secret) => secret.id === secretId),

    fetchSecrets: async () => {
        const {activeProjectId} = useEditorStore.getState();
        try {
            if (!activeProjectId) return;
            const data = await fetchProjectSecretsAPI(activeProjectId);
            set({secrets: data.secrets, hasInitialFetched: true});
            return data;
        } catch (error) {
            console.error("Failed to fetch secrets:", error);
        }
    },

    createSecret: async (key: string, secret_value: string): Promise<Secret | undefined> => {
        const {activeProjectId} = useEditorStore.getState();
        try {
            const response = await createProjectSecretAPI(activeProjectId, key, secret_value);
            const secret: Secret = {
                id: response?.id || Date.now().toString(),
                key,
                value: secret_value,
                projectId: activeProjectId,
            };
            set((state) => ({secrets: [...state.secrets, secret]}));
            return secret;
        } catch (error) {
            console.error('Failed to create secret:', error);
        }
    },

    updateSecret: async (secret: Secret) => {
        const {activeProjectId} = useEditorStore.getState();
        try {
            await updateProjectSecretAPI(activeProjectId, secret.id, secret.value as string);
            set((state) => ({
                secrets: state.secrets.map((s) => (s.id === secret.id ? secret : s)),
            }));
            return secret;
        } catch (error) {
            console.error('Failed to update secret:', error);
        }
    },

    deleteSecret: async (secretId: string) => {
        const {activeProjectId} = useEditorStore.getState();
        try {
            await deleteProjectSecretAPI(activeProjectId, secretId);
            set((state) => ({
                secrets: state.secrets.filter((s) => s.id !== secretId),
            }));
        } catch (error) {
            console.error('Failed to delete secret:', error);
        }
    },
}));

export default useProjectSecretsStore;