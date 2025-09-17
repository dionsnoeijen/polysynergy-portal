import {getIdToken} from "@/api/auth/authToken";
import config from "@/config";

export const runMockApi = async (
    projectId: string,
    activeVersionId: string,
    mockNodeId: string,
    stage: string,
    subStage: string
): Promise<Response> => {
    const idToken = getIdToken();
    return await fetch(
        `${config.LOCAL_API_URL}/execution/${activeVersionId}/${mockNodeId}/?stage=${stage}&sub_stage=${subStage}&project_id=${projectId}`,
        {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            }
        }
    );
}

// New fire-and-forget execution API
export const startExecutionApi = async (
    projectId: string,
    activeVersionId: string,
    mockNodeId: string,
    stage: string,
    subStage: string
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/execution/${activeVersionId}/start/?project_id=${projectId}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                node_id: mockNodeId,
                stage,
                sub_stage: subStage
            })
        }
    );
    
    if (!response.ok) {
        throw new Error(`Failed to start execution: ${response.statusText}`);
    }
    
    return response.json(); // Returns { run_id, status, started_at }
}