import {getIdToken} from "@/api/auth/authToken";
import config from "@/config";

export const fetchAvailableNodesAPI = async () => {
    const idToken = getIdToken();
    const response = await fetch(`${config.API_URL}/nodes/`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });

    return response.json();
};