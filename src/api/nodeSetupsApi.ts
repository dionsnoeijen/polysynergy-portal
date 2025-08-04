import { getIdToken } from "@/api/auth/authToken";
import {Fundamental, State, StoreName} from "@/types/types";
import config from "@/config";

export const fetchNodeSetupVersionAPI = async (
    setupId: string,
    versionId: string,
    type: "route" | "schedule"
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/node-setup/${type}/${setupId}/version/${versionId}/`,
        {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${idToken}`,
            }
        }
    );
    return response.json();
};

export const updateNodeSetupVersionAPI = async (
    setupId: string,
    versionId: string,
    projectId: string,
    content: Record<StoreName, State>,
    type: Fundamental
): Promise<Response> => {
    const idToken = getIdToken();
    return fetch(
        //`${config.LOCAL_API_URL}/node-setup/${type}/${setupId}/version/${versionId}/${projectId}/`,
        `${config.LOCAL_API_URL}/node-setup/${type}/${setupId}/version/${versionId}/?project_id=${projectId}`,
        {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ content }),
        }
    );
};

export const publishNodeSetupRouteVersionAPI = (
    routeId: string,
    stage: string,
    projectId: string
): Promise<Response> => {
    const idToken = getIdToken();
    return fetch(
        `${config.LOCAL_API_URL}/routes/${routeId}/publish/?project_id=${projectId}`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ stage }),
        }
    );
};

export const unpublishNodeSetupRouteVersionAPI = (
    routeId: string,
    stage: string,
    projectId: string
): Promise<Response> => {
    const idToken = getIdToken();
    return fetch(
        `${config.LOCAL_API_URL}/routes/${routeId}/unpublish/?project_id=${projectId}`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ stage }),
        }
    );
}

export const updateNodeSetupRouteVersionAPI = (
    routeId: string,
    stage: string,
    projectId: string
): Promise<Response> => {
    const idToken = getIdToken();
    return fetch(
        `${config.LOCAL_API_URL}/routes/${routeId}/update-stage/?project_id=${projectId}`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ stage }),
        }
    );
};

export const publishNodeSetupScheduleVersionAPI = (
    versionId: string,
    stage: string,
    projectId: string
): Promise<Response> => {
    const idToken = getIdToken();
    return fetch(
        `${config.LOCAL_API_URL}/schedules/${versionId}/publish/?project_id=${projectId}`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ stage }),
        }
    );
}

export const unpublishNodeSetupScheduleVersionAPI = (
    versionId: string,
    stage: string,
    projectId: string
): Promise<Response> => {
    const idToken = getIdToken();
    return fetch(
        `${config.API_URL}/schedules/${versionId}/unpublish/?project_id=${projectId}`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ stage }),
        }
    );
}

export const updateNodeSetupScheduleVersionAPI = (
    scheduleId: string,
    stage: string,
    projectId: string
): Promise<Response> => {
    const idToken = getIdToken();
    return fetch(
        `${config.API_URL}/schedules/${scheduleId}/update-stage/?project_id=${projectId}`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ stage }),
        }
    );
};

export const createNodeSetupVersionDraftAPI = async (
    setupId: string,
    versionId: string,
    projectId: string,
    content: Record<StoreName, State>,
    type: "route" | "schedule" | "blueprint"
) => {
    const idToken = getIdToken();

    const response = await fetch(
        `${config.API_URL}/node-setup/${type}/${setupId}/version/${versionId}/${projectId}/`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ content }),
        }
    );
    return response.json();
}