import {getIdToken} from "@/api/auth/authToken";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();

export const runMockApi = async (
    activeVersionId: string,
    mockNodeId: string
): Promise<Response> => {
    const idToken = getIdToken();
    return await fetch(
        `${publicRuntimeConfig.NEXT_PUBLIC_POLYSYNERGY_API}/mock/play/${activeVersionId}/${mockNodeId}`,
        {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            }
        }
    );
}