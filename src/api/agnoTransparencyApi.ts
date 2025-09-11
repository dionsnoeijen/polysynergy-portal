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

export interface RawSessionData {
    session_id: string;
    raw_data: unknown;
    metadata: {
        retrieved_at: string;
        storage_type: string;
        data_size_bytes: number;
    };
    error?: string;
}

export function createAgnoTransparencyApi(projectId: string) {
    const baseUrl = `${config.LOCAL_API_URL}/agno-transparency`;
    
    return {
        /**
         * Get raw session data using Agno Storage abstractions
         * Returns the complete session.to_dict() with no processing.
         */
        async getSessionRawData(
            storageConfig: StorageConfig,
            sessionId: string, 
            userId?: string
        ): Promise<RawSessionData> {
            const response = await fetch(`${baseUrl}/session-raw?project_id=${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getIdToken()}`,
                },
                body: JSON.stringify({
                    storage_config: storageConfig,
                    session_id: sessionId,
                    user_id: userId
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch transparency data: ${response.statusText}`);
            }
            
            return response.json();
        }
    };
}