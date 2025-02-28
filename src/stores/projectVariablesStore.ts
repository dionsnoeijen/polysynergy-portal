import { create } from 'zustand';
import { NodeVariable } from "@/types/types";

type ProjectVariablesStore = {
    projectVariables: { [key: string]: NodeVariable };
    setProjectVariable: (key: string, value: NodeVariable) => void;
    removeProjectVariable: (key: string) => void;
    getProjectVariable: (key: string) => NodeVariable | undefined;
};

const useProjectVariablesStore = create<ProjectVariablesStore>((set, get) => ({
    projectVariables: {},
    setProjectVariable: (key, value) => set((state) => ({
        projectVariables: { ...state.projectVariables, [key]: value }
    })),
    removeProjectVariable: (key) => set((state) => {
        const newVariables = { ...state.projectVariables };
        delete newVariables[key];
        return { projectVariables: newVariables };
    }),
    getProjectVariable: (key) => {
        return get().projectVariables[key];
    },
}));

export default useProjectVariablesStore;