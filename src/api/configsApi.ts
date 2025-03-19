import {getIdToken} from "@/api/auth/authToken";
import {Config} from "@/types/types";
import apiConfig from "@/config";

export const storeConfig = async (
    config: Config
): Promise<Config> => {
    try {
        const idToken = getIdToken();
        const response = await fetch(
            `${apiConfig.API_URL}/configs/`,
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify(config),
            }
        );

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to store config: ${response.status} ${errorMessage}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error storing config:", error);
        throw error;
    }
}

export const fetchConfig = async (configId: string): Promise<Config> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${apiConfig.API_URL}/configs/${configId}/`,
        {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${idToken}`,
            }
        }
    );
    return response.json();
}

export const fetchConfigs = async (): Promise<Config[]> => {
    try {
        const idToken = getIdToken();
        const response = await fetch(
            `${apiConfig.API_URL}/configs/`,
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
            }
        );

        return response.json();
    } catch (error) {
        console.error("Error fetching configs:", error);
        throw error;
    }
}