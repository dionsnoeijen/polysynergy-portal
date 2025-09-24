// stores/interactionStore.ts
import { create } from 'zustand';

export type InteractionEventData = {
    service_name?: string;
    auth_url?: string;
    redirect_uri?: string;
    message?: string;
    state?: string;
    [key: string]: unknown;
};

export type InteractionEvent = {
    type: 'interaction_event';
    flow_id: string;
    run_id: string;
    node_id: string;
    interaction_type: string;
    data: InteractionEventData;
    tenant_id?: string;
    user_id?: string;
};

type InteractionState = {
    activeInteraction: InteractionEvent | null;
    isPopupOpen: boolean;
    popupWindow: Window | null;

    // Actions
    setActiveInteraction: (interaction: InteractionEvent | null) => void;
    openOAuthPopup: (interaction: InteractionEvent) => void;
    closePopup: () => void;
    setPopupWindow: (window: Window | null) => void;
    clearInteraction: () => void;
};

export const useInteractionStore = create<InteractionState>((set, get) => ({
    activeInteraction: null,
    isPopupOpen: false,
    popupWindow: null,

    setActiveInteraction: (interaction) => set({ activeInteraction: interaction }),

    openOAuthPopup: (interaction) => {
        console.log('🔑 [Interaction] Opening OAuth popup for:', interaction.interaction_type);
        set({
            activeInteraction: interaction,
            isPopupOpen: true
        });
    },

    closePopup: () => {
        console.log('🔑 [Interaction] Closing OAuth popup');
        const { popupWindow } = get();

        // Close popup window if it exists
        if (popupWindow && !popupWindow.closed) {
            popupWindow.close();
        }

        set({
            isPopupOpen: false,
            popupWindow: null,
            // Keep activeInteraction for potential retry
        });
    },

    setPopupWindow: (window) => set({ popupWindow: window }),

    clearInteraction: () => {
        console.log('🔑 [Interaction] Clearing interaction');
        const { popupWindow } = get();

        // Close popup window if it exists
        if (popupWindow && !popupWindow.closed) {
            popupWindow.close();
        }

        set({
            activeInteraction: null,
            isPopupOpen: false,
            popupWindow: null
        });
    }
}));

export default useInteractionStore;