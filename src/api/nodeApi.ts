import { getIdToken } from "@/api/auth/authToken";
import config from "@/config";

export const fetchNodeSerialization = async (code: string) => {
    const idToken = getIdToken();
    return await fetch(`${config.API_URL}/node-serialization/interpret/`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ code }),
    });
}