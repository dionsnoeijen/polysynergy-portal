import {getIdToken} from "@/api/auth/authToken";
import config from "@/config";

export const getNodeExecutionDetails = async (
    activeVersionId: string,
    runId: string,
    nodeId: string,
    order: number,
    stage: string,
    subStage: string
) => {
    const idToken = getIdToken();
    const baseNodeId = nodeId.replace(/-\d+$/, '');
    const response = await fetch(`${config.LOCAL_API_URL}/execution/${activeVersionId}/${runId}/${baseNodeId}/${order}?stage=${stage}&sub_stage=${subStage}`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch node execution details: ${response.statusText}`);
    }

    return response.json();
}

export const getConnectionExecutionDetails = async (
    activeVersionId: string,
    runId: string,
) => {
    const idToken = getIdToken();
    const response = await fetch(`${config.LOCAL_API_URL}/execution/${activeVersionId}/${runId}/connections/`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch connection execution details: ${response.statusText}`);
    }

    return response.json();
}

export const getAvailableRuns = async (
    flowId: string,
    projectId: string,
) => {
    const idToken = getIdToken();
    const response = await fetch(`${config.LOCAL_API_URL}/execution/runs/${flowId}?project_id=${projectId}`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch available runs: ${response.statusText}`);
    }

    return response.json();
}

export const getAllNodesForRun = async (
    flowId: string,
    runId: string,
    projectId: string,
    stage: string = 'mock',
    subStage: string = 'mock'
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/execution/${flowId}/${runId}/nodes/?project_id=${projectId}&stage=${stage}&sub_stage=${subStage}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch nodes for run: ${response.statusText}`);
    }

    return response.json();
}

export const clearAllRuns = async (
    flowId: string,
    projectId: string,
) => {
    const idToken = getIdToken();
    const response = await fetch(`${config.LOCAL_API_URL}/execution/runs/${flowId}?project_id=${projectId}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to clear runs: ${response.statusText}`);
    }

    return response.json();
}

export const getMockNodesForRun = async (
    flowId: string,
    runId: string,
    projectId: string,
) => {
    const idToken = getIdToken();
    const response = await fetch(`${config.LOCAL_API_URL}/execution/${flowId}/${runId}/mock-nodes/?project_id=${projectId}`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch mock nodes for run: ${response.statusText}`);
    }

    return response.json();
}