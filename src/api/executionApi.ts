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
    const response = await fetch(`${config.LOCAL_API_URL}/execution/connections/${activeVersionId}/${runId}/`, {
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