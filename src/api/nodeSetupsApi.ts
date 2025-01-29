import { getIdToken } from "@/api/auth/authToken";
import {State, StoreName} from "@/types/types";

export const fetchNodeSetupVersionAPI = async (
    setupId: string,
    versionId: string,
    type: "route" | "schedule"
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/node-setup/${type}/${setupId}/version/${versionId}/`,
        {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${idToken}`,
            }
        }
    );
    return response.json();
};

export const updateNodeSetupVersionAPI = (
    setupId: string,
    versionId: string,
    content: Record<StoreName, State>, // Specifiek alleen voor content
    type: "route" | "schedule" | "blueprint"
): Promise<Response> => {
    const idToken = getIdToken();
    // console.log('CONTENT', content);
    return fetch(
        `${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/node-setup/${type}/${setupId}/version/${versionId}/`,
        {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ content }), // Alleen 'content' meegeven
        }
    );
};