import { getIdToken } from "@/api/auth/authToken";

export const fetchNodeSerialization = async (code: string) => {
    const idToken = getIdToken();
    return await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/node-serialization/interpret/`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ code }),
    });
}