import {create} from 'zustand';
import {activateFlowListenerAPI, deactivateFlowListenerAPI, fetchFlowListenerStatusAPI} from '@/api/listenerApi';

type ListenerStore = {
    activeListeners: Record<string, boolean>;
    setListenerState: (versionId: string, isActive: boolean) => void;
    toggleListener: (versionId: string) => Promise<void>;
    isListenerActive: (versionId: string) => boolean;
    initListenerStatus: (versionId: string) => Promise<void>;
};

const useListenerStore = create<ListenerStore>((set, get) => ({
    activeListeners: {},

    setListenerState: (versionId, isActive) =>
        set((state) => ({
            activeListeners: {
                ...state.activeListeners,
                [versionId]: isActive,
            },
        })),

    isListenerActive: (versionId) => {
        return !!get().activeListeners[versionId];
    },

    toggleListener: async (versionId) => {
        const isActive = get().isListenerActive(versionId);

        if (isActive) {
            await deactivateFlowListenerAPI(versionId);
            get().setListenerState(versionId, false);
        } else {
            await activateFlowListenerAPI(versionId);
            get().setListenerState(versionId, true);
        }
    },

    initListenerStatus: async (versionId: string) => {
        try {
            const res = await fetchFlowListenerStatusAPI(versionId);
            get().setListenerState(versionId, res.is_active);
        } catch (e) {
            console.error("Failed to init listener state", e);
        }
    }
}));

export default useListenerStore;