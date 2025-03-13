import {getIdToken} from "@/api/auth/authToken";
import {Project} from "@/types/types";
import config from "@/config";

export const fetchProjects = async ({ trashed = false }: { trashed?: boolean }) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.API_URL}/projects/?trashed=${trashed}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch projects');
    }

    return response.json();
};

export const createProject = async (name: string) => {
    const idToken = getIdToken();
    const response = await fetch(`${config.API_URL}/projects/`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
            name: name,
            routes: [],
        })
    });
    return response.json();
}

export const deleteProject = async (projectId: string) => {
    const idToken = getIdToken();
    const response = await fetch(`${config.API_URL}/projects/${projectId}/`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });
    return response;
}

export const updateProject = async (projectId: string, updatedData: Partial<Project>) => {
    const idToken = getIdToken();
    const response = await fetch(`${config.API_URL}/projects/${projectId}/`, {
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(updatedData),
    });
    return response;
}

export const restoreProject = async (projectId: string) => {
    const idToken = getIdToken();
    const response = await fetch(`${config.API_URL}/projects/${projectId}/restore/`, {
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        }
    });
    return response;
}
