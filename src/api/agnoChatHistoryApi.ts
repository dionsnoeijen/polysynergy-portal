import config from '@/config';
import { getIdToken } from '@/api/auth/authToken';

export interface StorageConfig {
    type: 'LocalAgentStorage' | 'DynamoDBAgentStorage' | 'LocalDb' | 'DynamoDb';
    table_name?: string;
    db_file?: string;
    region_name?: string;
    aws_access_key_id?: string;
    aws_secret_access_key?: string;
    endpoint_url?: string;
}

export interface ChatMessage {
    sender: 'user' | 'agent';
    text: string;
    timestamp: string;
    user_id?: string;
}

export interface SessionInfo {
    created_at: string | null;
    last_activity: string | null;
    participants: string[];
}

export interface ChatHistory {
    session_id: string;
    messages: ChatMessage[];
    total_messages: number;
    session_info: SessionInfo;
}

export interface ChatSession {
    session_id: string;
    user_id?: string;
    created_at: string;
    last_activity: string;
    message_count: number;
    session_name: string | null;
}

export function createAgnoChatHistoryApi(projectId: string) {
    const baseUrl = `${config.LOCAL_API_URL}/agno-chat`;
    
    return {
        /**
         * Get chat history using Agno Storage abstractions
         */
        async getSessionHistory(
            storageConfig: StorageConfig,
            sessionId: string, 
            userId?: string, 
            limit: number = 100
        ): Promise<ChatHistory> {
            const response = await fetch(`${baseUrl}/session-history?project_id=${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getIdToken()}`,
                },
                body: JSON.stringify({
                    storage_config: storageConfig,
                    session_id: sessionId,
                    user_id: userId,
                    limit
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch chat history: ${response.statusText}`);
            }
            
            return response.json();
        },

        /**
         * List available sessions using Agno Storage abstractions
         */
        async listSessions(
            storageConfig: StorageConfig,
            userId?: string,
            limit: number = 50
        ): Promise<ChatSession[]> {
            const response = await fetch(`${baseUrl}/sessions?project_id=${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getIdToken()}`,
                },
                body: JSON.stringify({
                    storage_config: storageConfig,
                    user_id: userId,
                    limit
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to list chat sessions: ${response.statusText}`);
            }
            
            return response.json();
        },

        /**
         * Delete a session using Agno Storage abstractions
         */
        async deleteSession(storageConfig: StorageConfig, sessionId: string): Promise<void> {
            const response = await fetch(`${baseUrl}/delete-session?project_id=${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getIdToken()}`,
                },
                body: JSON.stringify({
                    storage_config: storageConfig,
                    session_id: sessionId
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to delete session: ${response.statusText}`);
            }
        }
    };
}