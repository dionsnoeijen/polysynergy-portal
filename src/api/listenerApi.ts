import { getIdToken } from '@/api/auth/authToken';
import config from '@/config';

export const activateFlowListenerAPI = async (
    versionId: string
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/listeners/${versionId}/activate/`,
        {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${idToken}`,
            },
        }
    );
    return response.json();
};

export const deactivateFlowListenerAPI = async (
    versionId: string
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/listeners/${versionId}/deactivate/`,
        {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${idToken}`,
            },
        }
    );
    return response.json();
};

export const fetchFlowListenerStatusAPI = async (
    versionId: string
): Promise<{ is_active: boolean }> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/listeners/${versionId}/`,
        {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${idToken}`,
            },
        }
    );
    return response.json();
};