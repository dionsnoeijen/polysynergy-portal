import { create } from "zustand";

const MIN_WIDTH = 320;
const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 480;
const COLLAPSED_WIDTH = 0;

type PossessionPanelState = {
    isOpen: boolean;
    width: number;
    toggle: () => void;
    setWidth: (w: number) => void;
    effectiveWidth: () => number;
};

const usePossessionPanelStore = create<PossessionPanelState>((set, get) => ({
    isOpen: true,
    width: DEFAULT_WIDTH,
    toggle: () => set((s) => ({ isOpen: !s.isOpen })),
    setWidth: (w) =>
        set({ width: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, w)) }),
    effectiveWidth: () => (get().isOpen ? get().width : COLLAPSED_WIDTH),
}));

export { MIN_WIDTH, MAX_WIDTH, DEFAULT_WIDTH, COLLAPSED_WIDTH };
export default usePossessionPanelStore;
