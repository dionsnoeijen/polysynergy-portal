import {getIdToken} from "@/api/auth/authToken";
import config from "@/config";
import {ApiKey} from "@/types/types";

export const fetchApiKeysAPI = async (
    projectId: string
): Promise<ApiKey[]> => {
    const idToken = getIdToken();

    const response = await fetch(
        `${config.LOCAL_API_URL}/api-keys/?project_id=${projectId}`,
        {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch API keys");
    }

    return response.json();
};

export const createApiKeyAPI = async (
    projectId: string,
    label: string,
    key: string
): Promise<ApiKey> => {
    const idToken = getIdToken();

    const response = await fetch(`${config.LOCAL_API_URL}/api-keys/`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({project_id: projectId, label, key}),
    });

    if (!response.ok) {
        throw new Error("Failed to create API key");
    }

    return response.json();
};

export const updateApiKeyAPI = async (
    keyId: string,
    data: { label: string, key: string }
): Promise<ApiKey> => {
    const idToken = getIdToken();

    const response = await fetch(`${config.LOCAL_API_URL}/api-keys/${keyId}/`, {
        method: "PATCH",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error("Failed to update API key");
    }

    return response.json();
};

export const deleteApiKeyAPI = async (keyId: string): Promise<Response> => {
    const idToken = getIdToken();

    return fetch(`${config.LOCAL_API_URL}/api-keys/${keyId}/`, {
        method: "DELETE",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${idToken}`,
        },
    });
};

export const updateRouteApiKeysAPI = async (
    routeId: string,
    apiKeyRefs: string[]
): Promise<Response> => {
    const idToken = getIdToken();

    return fetch(`${config.API_URL}/api/route-api-keys/${routeId}/`, {
        method: "PATCH",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({api_key_refs: apiKeyRefs}),
    });
};