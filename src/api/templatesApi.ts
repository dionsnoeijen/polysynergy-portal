import { getIdToken } from "@/api/auth/authToken";
import config from "@/config";

export interface ProjectTemplate {
    id: string;
    project_id: string;
    name: string;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface ProjectTemplateCreate {
    name: string;
    content: string;
}

export interface ProjectTemplateUpdate {
    name?: string;
    content?: string;
}

export const fetchTemplatesAPI = async (
    projectId: string
): Promise<ProjectTemplate[]> => {
    const idToken = getIdToken();

    const response = await fetch(
        `${config.LOCAL_API_URL}/templates/?project_id=${projectId}`,
        {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch templates");
    }

    return response.json();
};

export const createTemplateAPI = async (
    projectId: string,
    data: ProjectTemplateCreate
): Promise<ProjectTemplate> => {
    const idToken = getIdToken();

    const response = await fetch(
        `${config.LOCAL_API_URL}/templates/?project_id=${projectId}`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(data),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create template");
    }

    return response.json();
};

export const updateTemplateAPI = async (
    projectId: string,
    templateId: string,
    data: ProjectTemplateUpdate
): Promise<ProjectTemplate> => {
    const idToken = getIdToken();

    const response = await fetch(
        `${config.LOCAL_API_URL}/templates/${templateId}/?project_id=${projectId}`,
        {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(data),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update template");
    }

    return response.json();
};

export const deleteTemplateAPI = async (
    projectId: string,
    templateId: string
): Promise<void> => {
    const idToken = getIdToken();

    const response = await fetch(
        `${config.LOCAL_API_URL}/templates/${templateId}/?project_id=${projectId}`,
        {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to delete template");
    }
};
