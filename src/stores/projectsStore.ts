import {create} from 'zustand';
import {
    fetchProjects as fetchProjectsAPI,
    fetchProject as fetchProjectAPI,
} from "@/api/projectsApi";
import {Project} from "@/types/types";

type ProjectsStore = {
    projects: Project[];
    addProject: (project: Project) => void;
    removeProject: (projectId: string) => void;
    getProject: (projectId: string) => Project | undefined;
    getProjects: () => Project[];
    fetchProject: (projectId: string) => Promise<Project | undefined>;
    fetchProjects: (trashed: boolean) => Promise<void>;
};

const useProjectsStore = create<ProjectsStore>((set) => ({
    projects: [],

    addProject: (project) => set((state) => ({projects: [...state.projects, project]})),

    removeProject: (projectId) =>
        set((state) => ({
                projects: state.projects.filter((project) => project.id !== projectId),
            })
        ),

    getProject: (projectId): Project | undefined => {
        return useProjectsStore.getState().projects.find((project: Project) => project.id === projectId);
    },

    getProjects: (): Project[] => {
        return useProjectsStore.getState().projects;
    },

    fetchProject: async (projectId: string) => {
        if (!projectId) return;
        try {
            const data: Project = await fetchProjectAPI(projectId);

            set((state) => ({
                projects: state.projects.some((p) => p.id === projectId)
                    ? state.projects.map((p) => p.id === projectId ? data : p)
                    : [...state.projects, data],
            }));

            return data;
        } catch (error) {
            console.error('Failed to fetch project:', error);
        }
    },

    fetchProjects: async (trashed = false) => {
        try {
            const data: Project[] = await fetchProjectsAPI({trashed});
            set({projects: data});
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        }
    }
}));

export default useProjectsStore;
