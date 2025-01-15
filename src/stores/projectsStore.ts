import { create } from 'zustand';
import { fetchProjects as fetchProjectsAPI } from "@/api/projectsApi";
import { Project } from "@/types/types";

type ProjectsStore = {
    projects: Project[];
    addProject: (project: Project) => void;
    removeProject: (projectId: string) => void;
    getProject: (projectId: string) => Project | undefined;
    getProjects: () => Project[];
    fetchProjects: (trashed: boolean) => Promise<void>;
};

const useProjectsStore = create<ProjectsStore>((set) => ({
    projects: [],

    addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),

    removeProject: (projectId) =>
        set((state) => ({
            projects: state.projects.filter((project) => project.id !== projectId),
        })
    ),

    getProject: (projectId):Project|undefined => {
        return useProjectsStore.getState().projects.find((project:Project) => project.id === projectId);
    },

    getProjects: ():Project[] => {
        return useProjectsStore.getState().projects;
    },

    fetchProjects: async (trashed = false) => {
        try {
            const data: Project[] = await fetchProjectsAPI({ trashed });
            set({ projects: data });
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        }
    }
}));

export default useProjectsStore;
