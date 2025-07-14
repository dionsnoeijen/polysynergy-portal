import { create } from "zustand";

type AvatarStore = {
    generating: Set<string>;
    startGenerating: (nodeId: string) => void;
    stopGenerating: (nodeId: string) => void;
    isGenerating: (nodeId: string) => boolean;
};

export const useAvatarStore = create<AvatarStore>((set, get) => ({
    generating: new Set(),

    startGenerating: (nodeId) => {
        const newSet = new Set(get().generating);
        newSet.add(nodeId);
        set({ generating: newSet });
    },

    stopGenerating: (nodeId) => {
        const newSet = new Set(get().generating);
        newSet.delete(nodeId);
        set({ generating: newSet });
    },

    isGenerating: (nodeId) => get().generating.has(nodeId),
}));