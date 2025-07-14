import { getIdToken } from './auth/authToken';
import config from "@/config";

export const fetchGenerateAvatar = async (nodeId: string, name: string, instructions: string): Promise<string | null> => {
    const idToken = getIdToken();
    const res = await fetch(`${config.API_URL}/avatar/${nodeId}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ name, instructions }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.url || null;
};