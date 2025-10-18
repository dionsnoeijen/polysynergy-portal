import {getIdToken} from "@/api/auth/authToken";
import config from "@/config";

export interface FeedbackPayload {
    email: string;
    message: string;
    timestamp: string;
    user_agent?: string;
}

export const sendFeedback = async (email: string, message: string): Promise<void> => {
    const idToken = getIdToken();

    const payload: FeedbackPayload = {
        email,
        message,
        timestamp: new Date().toISOString(),
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
    };

    const response = await fetch(`${config.LOCAL_API_URL}/feedback`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error('Failed to send feedback');
    }

    // Check the success field in the response body
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.message || 'Failed to send feedback');
    }
};
