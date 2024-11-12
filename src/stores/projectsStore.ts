import { create } from 'zustand';
import { fetchProjects as fetchProjectsAPI } from "@/api/projectsApi";

export type Project = {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
};

type ProjectsStore = {
    projects: Project[];
    addProject: (project: Project) => void;
    removeProject: (projectId: string) => void;
    getProject: (projectId: string) => Project | undefined;
    getProjects: () => Project[];
    fetchProjects: () => Promise<void>;
};

const useProjectsStore = create<ProjectsStore>((set) => ({
    projects: [],

    addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),

    removeProject: (projectId) =>
        set((state) => ({
            projects: state.projects.filter((project) => project.id !== projectId),
        })),

    getProject: (projectId):Project|undefined => {
        return useProjectsStore.getState().projects.find((project:Project) => project.id === projectId);
    },

    getProjects: ():Project[] => {
        return useProjectsStore.getState().projects;
    },

    fetchProjects: async () => {
        try {
            const data: Project[] = await fetchProjectsAPI();
            set({ projects: data });
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        }
    }
}));

export default useProjectsStore;
