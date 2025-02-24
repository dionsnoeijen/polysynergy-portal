import { create } from 'zustand';
import { NodeVariable } from "@/types/types";

type GlobalVariablesStore = {
    globalVariables: { [key: string]: NodeVariable };
    setGlobalVariable: (key: string, value: NodeVariable) => void;
    removeGlobalVariable: (key: string) => void;
    getGlobalVariable: (key: string) => NodeVariable | undefined;
};

const useGlobalVariablesStore = create<GlobalVariablesStore>((set, get) => ({
    globalVariables: {},
    setGlobalVariable: (key, value) => set((state) => ({
        globalVariables: { ...state.globalVariables, [key]: value }
    })),
    removeGlobalVariable: (key) => set((state) => {
        const newVariables = { ...state.globalVariables };
        delete newVariables[key];
        return { globalVariables: newVariables };
    }),
    getGlobalVariable: (key) => {
        return get().globalVariables[key];
    },
}));

export default useGlobalVariablesStore;