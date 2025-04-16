import { getIdToken } from "@/api/auth/authToken";
import { Secret } from "@/types/types";
import config from "@/config";

export const fetchProjectSecretsAPI = async (projectId: string) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.API_URL}/projects/${projectId}/secrets/`,
        {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${idToken}`,
            },
        }
    );

    return response.json();
};

export const createProjectSecretAPI = async (
    projectId: string,
    key: string,
    secret_value: string
): Promise<Secret> => {
    const idToken = getIdToken();

    const response = await fetch(
        `${config.API_URL}/projects/${projectId}/secrets/`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ key, secret_value }),
        }
    );
    return response.json();
};

export const updateProjectSecretAPI = async (
    projectId: string,
    secretId: string,
    secret_value: string
): Promise<Secret> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.API_URL}/projects/${projectId}/secrets/${secretId}/`,
        {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ secret_value }),
        }
    );
    return response.json();
};

export const deleteProjectSecretAPI = async (
    projectId: string,
    secretId: string
): Promise<{ message: string }> => {
    const idToken = getIdToken();

    console.log(projectId, secretId);

    const response = await fetch(
        `${config.API_URL}/projects/${projectId}/secrets/${secretId}/`,
        {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${idToken}`,
            },
        }
    );
    if (response.status === 204) {
        return { message: "Secret deleted successfully" };
    }
    return response.json();
};

export const fetchProjectSecretDetailAPI = async (
    projectId: string,
    secretId: string
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.API_URL}/projects/${projectId}/secrets/${secretId}/`,
        {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${idToken}`,
            },
        }
    );
    return response.json();
};