import { create } from 'zustand';
import { Connection } from "@/stores/connectionsStore";
import { Node } from "@/stores/nodesStore";
import { Group } from "@/stores/groupStore";

type HistoryEntry = {
    nodes: Node[];
    connections: Connection[];
    groups: Group[];
};

type HistoryStore = {
    history: HistoryEntry[];
    future: HistoryEntry[];
    saveState: (state: HistoryEntry) => void;
    undo: () => void;
    redo: () => void;
    reset: () => void;
};

export const useHistoryStore = create<HistoryStore>((set) => ({
    history: [],
    future: [],

    saveState: (state) => set((store) => ({
        history: [...store.history, state],
        future: [], // Clear redo history on new action
    })),

    undo: () => set((store) => {
        if (store.history.length === 0) return store; // No history to undo

        const previousState = store.history[store.history.length - 1];
        return {
            history: store.history.slice(0, -1),
            future: [previousState, ...store.future],
        };
    }),

    redo: () => set((store) => {
        if (store.future.length === 0) return store; // No future to redo

        const nextState = store.future[0];
        return {
            history: [...store.history, nextState],
            future: store.future.slice(1),
        };
    }),

    reset: () => set(() => ({
        history: [],
        future: [],
    })),
}));
