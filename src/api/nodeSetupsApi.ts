import { getIdToken } from "@/api/auth/authToken";
import {State, StoreName} from "@/types/types";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();

export const fetchNodeSetupVersionAPI = async (
    setupId: string,
    versionId: string,
    type: "route" | "schedule"
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${publicRuntimeConfig.NEXT_PUBLIC_POLYSYNERGY_API}/node-setup/${type}/${setupId}/version/${versionId}/`,
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
    content: Record<StoreName, State>,
    type: "route" | "schedule" | "blueprint"
): Promise<Response> => {
    const idToken = getIdToken();
    return fetch(
        `${publicRuntimeConfig.NEXT_PUBLIC_POLYSYNERGY_API}/node-setup/${type}/${setupId}/version/${versionId}/`,
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
    versionId: string,
): Promise<Response> => {
    const idToken = getIdToken();
    return fetch(
        `${publicRuntimeConfig.NEXT_PUBLIC_POLYSYNERGY_API}/node-setup/route/${versionId}/publish/`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
        }
    );
}

export const unpublishNodeSetupRouteVersionAPI = (
    versionId: string,
): Promise<Response> => {
    const idToken = getIdToken();
    return fetch(
        `${publicRuntimeConfig.NEXT_PUBLIC_POLYSYNERGY_API}/node-setup/route/${versionId}/unpublish/`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
        }
    );
}

export const publishNodeSetupScheduleVersionAPI = (
    versionId: string,
): Promise<Response> => {
    const idToken = getIdToken();
    return fetch(
        `${publicRuntimeConfig.NEXT_PUBLIC_POLYSYNERGY_API}/node-setup/schedule/${versionId}/publish/`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
        }
    );
}

export const unpublishNodeSetupScheduleVersionAPI = (
    versionId: string,
): Promise<Response> => {
    const idToken = getIdToken();
    return fetch(
        `${publicRuntimeConfig.NEXT_PUBLIC_POLYSYNERGY_API}/node-setup/schedule/${versionId}/unpublish/`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
        }
    );
}

export const createNodeSetupVersionDraftAPI = async (
    setupId: string,
    versionId: string,
    content: Record<StoreName, State>,
    type: "route" | "schedule" | "blueprint"
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${publicRuntimeConfig.NEXT_PUBLIC_POLYSYNERGY_API}/node-setup/${type}/${setupId}/version/${versionId}/`,
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