import {getIdToken} from "@/api/auth/authToken";

export const runMockApi = async (
    activeVersionId: string,
    mockNodeId: string
): Promise<Response> => {
    const idToken = getIdToken();
    return await fetch(
        `${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/mock/play/${activeVersionId}/${mockNodeId}`,
        {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            }
        }
    );
}