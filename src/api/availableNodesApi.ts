import {getIdToken} from "@/api/auth/authToken";

export const fetchAvailableNodesAPI = async () => {
    const idToken = getIdToken();
    const response = await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/nodes/`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });

    return response.json();
};