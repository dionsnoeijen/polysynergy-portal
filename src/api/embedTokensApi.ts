import config from "@/config";
import { getIdToken } from "@/api/auth/authToken";

export interface EmbedToken {
    id: string;
    token: string;
    chat_window_id: string;
    project_id: string;
    sessions_enabled: boolean;
    sidebar_visible: boolean;
    is_active: boolean;
    created_at: string;
    last_used_at: string | null;
    usage_count: number;
}

export interface EmbedTokenCreateIn {
    chat_window_id: string;
    sessions_enabled?: boolean;
    sidebar_visible?: boolean;
}

export interface EmbedTokenUpdateIn {
    sessions_enabled?: boolean;
    sidebar_visible?: boolean;
    is_active?: boolean;
}

export async function listEmbedTokensAPI(
    projectId: string,
    chatWindowId?: string
): Promise<EmbedToken[]> {
    const params = new URLSearchParams({ project_id: projectId });
    if (chatWindowId) {
        params.append("chat_window_id", chatWindowId);
    }

    const response = await fetch(
        `${config.LOCAL_API_URL}/embed-tokens/?${params}`,
        {
            headers: {
                Authorization: `Bearer ${getIdToken()}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to list embed tokens: ${response.statusText}`);
    }

    return response.json();
}

export async function createEmbedTokenAPI(
    projectId: string,
    data: EmbedTokenCreateIn
): Promise<EmbedToken> {
    const response = await fetch(
        `${config.LOCAL_API_URL}/embed-tokens/?project_id=${projectId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getIdToken()}`,
            },
            body: JSON.stringify(data),
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to create embed token: ${response.statusText}`);
    }

    return response.json();
}

export async function updateEmbedTokenAPI(
    projectId: string,
    tokenId: string,
    data: EmbedTokenUpdateIn
): Promise<EmbedToken> {
    const response = await fetch(
        `${config.LOCAL_API_URL}/embed-tokens/${tokenId}/?project_id=${projectId}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getIdToken()}`,
            },
            body: JSON.stringify(data),
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to update embed token: ${response.statusText}`);
    }

    return response.json();
}

export async function deleteEmbedTokenAPI(
    projectId: string,
    tokenId: string
): Promise<void> {
    const response = await fetch(
        `${config.LOCAL_API_URL}/embed-tokens/${tokenId}/?project_id=${projectId}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${getIdToken()}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to delete embed token: ${response.statusText}`);
    }
}
