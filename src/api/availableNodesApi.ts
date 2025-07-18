import {getIdToken} from "@/api/auth/authToken";
import config from "@/config";

export const fetchAvailableNodesAPI = async (
    projectId: string
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/nodes/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    return response.json();
};