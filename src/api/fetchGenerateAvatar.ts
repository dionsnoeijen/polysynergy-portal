import { getIdToken } from './auth/authToken';
import config from "@/config";

export const fetchGenerateAvatar = async (
    nodeId: string,
    name: string,
    instructions: string
): Promise<string | null> => {
    const idToken = getIdToken();
    
    // Add timeout for long-running avatar generation to prevent indefinite hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    try {
        const res = await fetch(`${config.LOCAL_API_URL}/avatars/${nodeId}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
            body: JSON.stringify({ name, instructions }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        
        if (!res.ok) return null;
        const data = await res.json();
        return data.url || null;
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error && error.name === 'AbortError') {
            console.warn(`[Avatar] Generation timeout for node: ${nodeId}`);
        } else {
            console.error(`[Avatar] Generation error for node: ${nodeId}:`, error);
        }
        return null;
    }
};