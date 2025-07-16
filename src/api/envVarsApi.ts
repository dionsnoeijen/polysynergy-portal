import { getIdToken } from '@/api/auth/authToken';
import config from '@/config';

export const fetchProjectEnvVarsAPI = async (
    projectId: string
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/env-vars/?project_id=${projectId}`,
        {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${idToken}`,
            },
        }
    );
    return response.json();
};

export const createProjectEnvVarAPI = async (
    projectId: string,
    key: string,
    value: string,
    stage: string
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/env-vars/?project_id=${projectId}`,
        {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ key, value, stage }),
        }
    );
    return response.json();
};

export const updateProjectEnvVarAPI = async (
    projectId: string,
    key: string,
    value: string,
    stage: string
) => {
    // Same endpoint as create, since it overwrites
    return createProjectEnvVarAPI(projectId, key, value, stage);
};

export const deleteProjectEnvVarAPI = async (
    projectId: string,
    key: string,
    stage: string
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/env-vars/${stage}/${key}/?project_id=${projectId}`,
        {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${idToken}`,
            },
        }
    );
    if (response.status === 204) {
        return { message: 'Deleted successfully' };
    }
    return response.json();
};