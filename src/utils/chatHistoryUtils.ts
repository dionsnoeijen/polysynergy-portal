import useNodesStore from '@/stores/nodesStore';
import useConnectionsStore from '@/stores/connectionsStore';
import { Node } from '@/types/types';

export interface StorageConfig {
    type: 'LocalAgentStorage' | 'DynamoDBAgentStorage' | 'LocalDb' | 'DynamoDb';
    table_name?: string;
    db_file?: string;
    region_name?: string;
    aws_access_key_id?: string;
    aws_secret_access_key?: string;
    endpoint_url?: string;
}

/**
 * Traces connections from a prompt node to find the connected AgnoAgent and its storage configuration
 */
export function traceStorageConfiguration(promptNodeId: string): StorageConfig | null {
    const result = traceAgentAndStorage(promptNodeId);
    return result?.storageConfig || null;
}

export function getAgentMetaFromNode(node?: Node | null) {
  if (!node) {
    return {
      agentName: "Agent",
      agentAvatar: null as string | null,
    };
  }

  const vars = node.variables ?? [];

  const find = (h: string) =>
    vars.find(v => (v.handle ?? "").toLowerCase() === h.toLowerCase());

  const avatarVar = find("avatar");
  const nameVar   = find("agent_name");

  const agentAvatar =
    (typeof avatarVar?.value === "string" && avatarVar.value.trim().length > 0)
      ? avatarVar.value
      : null;

  const agentName =
    (typeof nameVar?.value === "string" && nameVar.value.trim().length > 0)
      ? nameVar.value
      : (node.name || node.handle || "Agent");

  return { agentName, agentAvatar };
}

/**
 * Traces connections from a prompt node to find both the AgnoAgent and its storage configuration
 */
export function traceAgentAndStorage(promptNodeId: string): { agentNode: Node; storageConfig: StorageConfig; agentAvatar?: string; agentName?: string } | null {
    // Step 1: Find AgnoAgent connected to this prompt node
    const agentNode = findConnectedAgentNode(promptNodeId);
    if (!agentNode) {
        return null;
    }

    // Step 2: Find storage node connected to the agent
    const storageNode = findConnectedStorageNode(agentNode.id);
    if (!storageNode) {
        return null;
    }

    // Step 3: Extract storage configuration from the storage node
    const storageConfig = extractStorageConfig(storageNode);
    if (!storageConfig) {
        return null;
    }
    
    // Extract agent avatar and name
    const getAgentVariableValue = (handle: string): string | undefined => {
        const variable = agentNode.variables.find(v => v.handle === handle);
        return variable?.value as string;
    };
    
    const agentAvatar = getAgentVariableValue('avatar');
    const agentName = getAgentVariableValue('name') || agentNode.name;
    
    return { agentNode, storageConfig, agentAvatar, agentName };
}

/**
 * Find the AgnoAgent node connected to a prompt node
 */
function findConnectedAgentNode(promptNodeId: string): Node | null {
    const { getNode } = useNodesStore.getState();
    const { connections } = useConnectionsStore.getState();

    // Look for connections where prompt node output connects to agent node input
    for (const connection of connections) {
        if (connection.sourceNodeId === promptNodeId) {
            const targetNode = getNode(connection.targetNodeId as string);
            if (targetNode && isAgnoAgentNode(targetNode)) {
                return targetNode;
            }
        }
    }

    return null;
}

/**
 * Find the storage node connected to an AgnoAgent node
 */
function findConnectedStorageNode(agentNodeId: string): Node | null {
    const { getNode } = useNodesStore.getState();
    const { connections } = useConnectionsStore.getState();

    // Look for connections where storage node output connects to agent node storage/db input
    for (const connection of connections) {
        if (connection.targetNodeId === agentNodeId && (connection.targetHandle === 'storage' || connection.targetHandle === 'db')) {
            const sourceNode = getNode(connection.sourceNodeId);
            if (sourceNode && isStorageNode(sourceNode)) {
                return sourceNode;
            }
        }
    }

    return null;
}

/**
 * Check if a node is an AgnoAgent or AgnoTeam node
 */
function isAgnoAgentNode(node: Node): boolean {
    return node.path === 'polysynergy_nodes_agno.agno_agent.agno_agent.AgnoAgent' ||
           node.path === 'polysynergy_nodes_agno.agno_team.agno_team.AgnoTeam' ||
           node.category === 'agno_agent' ||
           node.category === 'agno_team';
}

/**
 * Check if a node is a storage node (supports both v1 and v2)
 */
function isStorageNode(node: Node): boolean {
    // Agno v1 storage nodes
    const isV1Storage = node.path?.startsWith('polysynergy_nodes_agno.agno_storage.') ||
                       node.category === 'agno_storage';
    
    // Agno v2 db nodes - flexible pattern to match any DB type
    const isV2Db = node.path?.startsWith('polysynergy_nodes_agno.agno_db.') ||
                  node.category === 'agno_db';
    
    return isV1Storage || isV2Db;
}

/**
 * Extract storage configuration from a storage node
 */
function extractStorageConfig(storageNode: Node): StorageConfig | null {
    const getVariableValue = (handle: string): string | undefined => {
        const variable = storageNode.variables.find(v => v.handle === handle);
        return variable?.value as string;
    };

    // Determine storage type from node path (supports both v1 and v2 and any new DB types)
    let type: 'LocalAgentStorage' | 'DynamoDBAgentStorage' | 'LocalDb' | 'DynamoDb';
    
    // For chat functionality, we just need to know there's a storage - type doesn't really matter
    // But we keep the type for backwards compatibility
    if (storageNode.path?.startsWith('polysynergy_nodes_agno.agno_db.')) {
        // V2 DB nodes - use generic types
        if (storageNode.path.includes('local_db')) {
            type = 'LocalDb';
        } else if (storageNode.path.includes('dynamodb_db')) {
            type = 'DynamoDb';
        } else {
            // For any other DB type (PostgreSQL, etc.), just treat as LocalDb
            type = 'LocalDb';
            console.log(`Detected DB type: ${storageNode.path}, treating as LocalDb for chat`);
        }
    }
    // Agno v1 detection (legacy)
    else if (storageNode.path?.includes('LocalAgentStorage') || storageNode.path?.includes('local_agent_storage')) {
        type = 'LocalAgentStorage';
    } else if (storageNode.path?.includes('DynamoDBAgentStorage') || storageNode.path?.includes('dynamodb_agent_storage')) {
        type = 'DynamoDBAgentStorage';
    } else {
        // Fallback - shouldn't happen but handle gracefully
        type = 'LocalDb';
        console.log(`Unknown storage type: ${storageNode.path}, treating as LocalDb`);
    }

    const config: StorageConfig = { type };

    // Extract common configuration
    const tableName = getVariableValue('table_name');
    if (tableName) config.table_name = tableName;

    if (type === 'LocalAgentStorage' || type === 'LocalDb') {
        // SQLite-specific configuration (both v1 and v2)
        const dbFile = getVariableValue('db_file');
        if (dbFile) config.db_file = dbFile;
    } else if (type === 'DynamoDBAgentStorage' || type === 'DynamoDb') {
        // DynamoDB-specific configuration (both v1 and v2)
        const regionName = getVariableValue('region_name');
        const accessKeyId = getVariableValue('aws_access_key_id');
        const secretAccessKey = getVariableValue('aws_secret_access_key');
        const endpointUrl = getVariableValue('endpoint_url');

        if (regionName) config.region_name = regionName;
        if (accessKeyId) config.aws_access_key_id = accessKeyId;
        if (secretAccessKey) config.aws_secret_access_key = secretAccessKey;
        if (endpointUrl) config.endpoint_url = endpointUrl;
    }
    return config;
}

/**
 * Get session information from the prompt node (priority) or agent node (fallback)
 */
export function getSessionInfo(promptNodeId: string): { sessionId?: string; userId?: string; sessionName?: string } {
    // First, try to get session info from the prompt node itself
    const nodesStore = useNodesStore.getState();
    const promptNode = nodesStore.nodes.find(n => n.id === promptNodeId);
    
    if (promptNode) {
        // Get values from prompt node variables
        const activeSessionVar = promptNode.variables?.find(v => v.handle === 'active_session');
        const activeUserVar = promptNode.variables?.find(v => v.handle === 'active_user');
        const sessionVar = promptNode.variables?.find(v => v.handle === 'session');
        
        const sessionId = activeSessionVar?.value as string;
        const userId = activeUserVar?.value as string;
        
        // Get session name from session dict if available
        let sessionName: string | undefined;
        if (sessionId && sessionVar?.value) {
            if (Array.isArray(sessionVar.value)) {
                // Session is a NodeVariable array
                const sessionItem = sessionVar.value.find((v: unknown) => (v as {handle: string}).handle === sessionId);
                sessionName = (sessionItem as {value?: string} | undefined)?.value;
            } else if (typeof sessionVar.value === 'object') {
                // Session is a dict
                sessionName = (sessionVar.value as Record<string, unknown>)[sessionId] as string;
            }
        }
        
        if (sessionId || userId) {
            return { sessionId, userId, sessionName };
        }
    }
    
    // Fallback: try to get from agent node (old method for backward compatibility)
    const result = traceAgentAndStorage(promptNodeId);
    if (!result) {
        // console.log('No agent/storage configuration found for session info');
        return {};
    }

    const { agentNode } = result;
    
    const getVariableValue = (handle: string): string | undefined => {
        const variable = agentNode.variables.find(v => v.handle === handle);
        return variable?.value as string;
    };

    return {
        sessionId: getVariableValue('session_id'),
        userId: getVariableValue('user_id'),
        sessionName: getVariableValue('session_name')
    };
}