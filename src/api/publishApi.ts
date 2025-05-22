import {getIdToken} from "@/api/auth/authToken";
import config from "@/config";
import {PublishMatrixResponse, Stage} from "@/types/types";

export const createStageAPI = async (
    projectId: string,
    name: string,
    isProduction: boolean
): Promise<Stage> => {
    const idToken = getIdToken();

    const response = await fetch(`${config.API_URL}/stages/`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
            project_id: projectId,
            name,
            is_production: isProduction,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to create stage");
    }

    const data = await response.json();
    return data.stage;
};

export const fetchStagesAPI = async (
    projectId: string
): Promise<Stage[]> => {
    const idToken = getIdToken();

    const response = await fetch(`${config.API_URL}/stages/?project_id=${projectId}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${idToken}`,
        },
    });

    return response.json();
};

export const deleteStageAPI = async (
    stageId: string
): Promise<Response> => {
    const idToken = getIdToken();

    return fetch(`${config.API_URL}/stages/${stageId}/`, {
        method: "DELETE",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${idToken}`,
        },
    });
};

export const updateStageAPI = async (
    stageId: string,
    updates: {
        name?: string;
        is_production?: boolean;
    }
): Promise<Stage> => {
    const idToken = getIdToken();

    const response = await fetch(`${config.API_URL}/stages/${stageId}/`, {
        method: "PUT",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(updates),
    });

    if (!response.ok) {
        throw new Error("Failed to update stage");
    }

    const data = await response.json();
    return data.stage;
};

export const reorderStagesAPI = async (
    projectId: string,
    orderedStageIds: string[]
): Promise<Response> => {
    const idToken = getIdToken();

    return fetch(`${config.API_URL}/stages/reorder/`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
            project_id: projectId,
            stage_ids: orderedStageIds,
        }),
    });
};

export const fetchPublishMatrixAPI = async (
    projectId: string
): Promise<PublishMatrixResponse> => {
    const idToken = getIdToken();

    const response = await fetch(
        `${config.API_URL}/dynamic-routes/publish-matrix/?project_id=${projectId}`,
        {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch publish matrix");
    }

    return response.json();
};