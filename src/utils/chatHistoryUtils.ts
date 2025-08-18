import useNodesStore from '@/stores/nodesStore';
import useConnectionsStore from '@/stores/connectionsStore';
import { Node } from '@/types/types';

export interface StorageConfig {
    type: 'LocalAgentStorage' | 'DynamoDBAgentStorage';
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

    // Look for connections where storage node output connects to agent node storage input
    for (const connection of connections) {
        if (connection.targetNodeId === agentNodeId && connection.targetHandle === 'storage') {
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
 * Check if a node is a storage node
 */
function isStorageNode(node: Node): boolean {
    return node.path === 'polysynergy_nodes_agno.agno_storage.local_agent_storage.LocalAgentStorage' ||
           node.path === 'polysynergy_nodes_agno.agno_storage.dynamodb_agent_storage.DynamoDBAgentStorage' ||
           node.category === 'agno_storage';
}

/**
 * Extract storage configuration from a storage node
 */
function extractStorageConfig(storageNode: Node): StorageConfig | null {
    const getVariableValue = (handle: string): string | undefined => {
        const variable = storageNode.variables.find(v => v.handle === handle);
        return variable?.value as string;
    };

    // Determine storage type from node path
    let type: 'LocalAgentStorage' | 'DynamoDBAgentStorage';
    
    if (storageNode.path?.includes('LocalAgentStorage') || storageNode.path?.includes('local_agent_storage')) {
        type = 'LocalAgentStorage';
    } else if (storageNode.path?.includes('DynamoDBAgentStorage') || storageNode.path?.includes('dynamodb_agent_storage')) {
        type = 'DynamoDBAgentStorage';
    } else {
        console.error('Unknown storage node type:', storageNode.path);
        return null;
    }

    const config: StorageConfig = { type };

    // Extract common configuration
    const tableName = getVariableValue('table_name');
    if (tableName) config.table_name = tableName;

    if (type === 'LocalAgentStorage') {
        // SQLite-specific configuration
        const dbFile = getVariableValue('db_file');
        if (dbFile) config.db_file = dbFile;
    } else if (type === 'DynamoDBAgentStorage') {
        // DynamoDB-specific configuration
        const regionName = getVariableValue('region_name');
        const accessKeyId = getVariableValue('aws_access_key_id');
        const secretAccessKey = getVariableValue('aws_secret_access_key');
        const endpointUrl = getVariableValue('endpoint_url');

        if (regionName) config.region_name = regionName;
        if (accessKeyId) config.aws_access_key_id = accessKeyId;
        if (secretAccessKey) config.aws_secret_access_key = secretAccessKey;
        if (endpointUrl) config.endpoint_url = endpointUrl;
    }

    console.log('Extracted storage config:', config);
    return config;
}

/**
 * Get session information from the agent node (not prompt node)
 */
export function getSessionInfo(promptNodeId: string): { sessionId?: string; userId?: string; sessionName?: string } {
    const result = traceAgentAndStorage(promptNodeId);
    if (!result) {
        console.log('No agent/storage configuration found for session info');
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