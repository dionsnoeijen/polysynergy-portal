import { getIdToken } from "@/api/auth/authToken";
import { Blueprint } from "@/types/types";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();

export const storeBlueprint = async (
    blueprint: Blueprint
): Promise<Blueprint> => {
    try {
        const idToken = getIdToken();
        const response = await fetch(`${publicRuntimeConfig.NEXT_PUBLIC_POLYSYNERGY_API}/blueprints/`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(blueprint),
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to store service: ${response.status} ${errorMessage}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error storing service:", error);
        throw error;
    }
};

export const fetchBlueprint = async (blueprintId: string): Promise<Blueprint> => {
    const idToken = getIdToken();
    const response = await fetch(`${publicRuntimeConfig.NEXT_PUBLIC_POLYSYNERGY_API}/blueprints/${blueprintId}/`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        }
    });
    return response.json();
};

export const fetchBlueprints = async (): Promise<Blueprint[]> => {
    try {
        const idToken = getIdToken();
        const response = await fetch(`${publicRuntimeConfig.NEXT_PUBLIC_POLYSYNERGY_API}/blueprints/`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        });

        return response.json();
    } catch (error) {
        console.error("Error fetching blueprints:", error);
        throw error;
    }
};