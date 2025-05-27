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
        `${config.API_URL}/mock/play/${projectId}/${activeVersionId}/${mockNodeId}?stage=${stage}&sub_stage=${subStage}`,
        {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            }
        }
    );
}