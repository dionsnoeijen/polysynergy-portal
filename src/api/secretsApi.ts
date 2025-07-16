import { getIdToken } from "@/api/auth/authToken";
import { Secret } from "@/types/types";
import config from "@/config";

export const fetchProjectSecretsAPI = async (projectId: string) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/secrets/?project_id=${projectId}`,
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
    secret_value: string,
    stage: string
): Promise<Secret> => {
    const idToken = getIdToken();

    const response = await fetch(
        `${config.LOCAL_API_URL}/secrets/?project_id=${projectId}`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ key, secret_value, stage }),
        }
    );
    return response.json();
};

export const updateProjectSecretAPI = async (
    projectId: string,
    key: string,
    secret_value: string,
    stage: string
): Promise<Secret> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/secrets/?project_id=${projectId}`,
        {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ key, secret_value, stage }),
        }
    );
    return response.json();
};

export const deleteProjectSecretAPI = async (
    projectId: string,
    key: string
): Promise<{ message: string }> => {
    const idToken = getIdToken();

    const response = await fetch(
        `${config.LOCAL_API_URL}/secrets/?project_id=${projectId}`,
        {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ key }),
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
        `${config.LOCAL_API_URL}/secrets/${secretId}/?project_id=${projectId}`,
        {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${idToken}`,
            },
        }
    );
    return response.json();
};