import {getIdToken} from "@/api/auth/authToken";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();

export const fetchAvailableNodesAPI = async () => {
    const idToken = getIdToken();
    const response = await fetch(`${publicRuntimeConfig.NEXT_PUBLIC_POLYSYNERGY_API}/nodes/`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });

    return response.json();
};