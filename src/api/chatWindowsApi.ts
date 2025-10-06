import { ChatWindow, ChatWindowAccess, MyChatWindow } from "@/types/types";
import { getIdToken } from "@/api/auth/authToken";
import config from "@/config";

export const fetchChatWindowsAPI = async (projectId: string) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/chat-windows/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );
    return response.json();
};

export const fetchChatWindow = async (
    chatWindowId: string,
    projectId: string
): Promise<ChatWindow> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/chat-windows/${chatWindowId}/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            }
        }
    );
    return response.json();
};

export const storeChatWindowAPI = async (
    projectId: string,
    chatWindow: ChatWindow
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/chat-windows/?project_id=${projectId}`,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                ...chatWindow
            }),
        }
    );
    return response.json();
};

export const updateChatWindowAPI = async (
    projectId: string,
    chatWindowId: string,
    updatedData: Partial<ChatWindow>
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/chat-windows/${chatWindowId}/?project_id=${projectId}`,
        {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(updatedData),
        }
    );
    return response.json();
};

export const deleteChatWindowAPI = async (
    projectId: string,
    chatWindowId: string
) => {
    const idToken = getIdToken();
    return await fetch(
        `${config.LOCAL_API_URL}/chat-windows/${chatWindowId}/?project_id=${projectId}`,
        {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );
};

// Chat Window Access APIs
export const fetchChatWindowUsersAPI = async (
    chatWindowId: string,
    projectId: string
): Promise<ChatWindowAccess[]> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/chat-windows/${chatWindowId}/users/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            }
        }
    );
    return response.json();
};

export const assignUserToChatWindowAPI = async (
    chatWindowId: string,
    projectId: string,
    data: {
        account_id: string;
        can_view_flow: boolean;
        can_edit_flow: boolean;
        can_view_output: boolean;
        show_response_transparency: boolean;
    }
): Promise<ChatWindowAccess> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/chat-windows/${chatWindowId}/users/?project_id=${projectId}`,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(data),
        }
    );
    return response.json();
};

export const updateChatWindowUserPermissionsAPI = async (
    chatWindowId: string,
    accountId: string,
    projectId: string,
    data: {
        can_view_flow?: boolean;
        can_edit_flow?: boolean;
        can_view_output?: boolean;
        show_response_transparency?: boolean;
    }
): Promise<ChatWindowAccess> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/chat-windows/${chatWindowId}/users/${accountId}/?project_id=${projectId}`,
        {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(data),
        }
    );
    return response.json();
};

export const removeUserFromChatWindowAPI = async (
    chatWindowId: string,
    accountId: string,
    projectId: string
): Promise<void> => {
    const idToken = getIdToken();
    await fetch(
        `${config.LOCAL_API_URL}/chat-windows/${chatWindowId}/users/${accountId}/?project_id=${projectId}`,
        {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );
};

// My Chat Windows API (cross-tenant, for end users)
export const fetchMyChatWindowsAPI = async (): Promise<MyChatWindow[]> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/my-chat-windows/`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch my chat windows: ${response.statusText}`);
    }

    return response.json();
};
