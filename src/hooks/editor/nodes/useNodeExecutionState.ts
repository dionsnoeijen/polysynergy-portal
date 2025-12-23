import { useMemo } from 'react';
import useMockStore from '@/stores/mockStore';
import { useRunsStore } from '@/stores/runsStore';

/**
 * Hook that provides execution state for a node, filtered by the active run.
 * Returns null if no active run or if the node is not executing in the active run.
 */
export function useNodeExecutionState(nodeId: string) {
    const activeRunId = useRunsStore((state) => state.activeRunId);
    const getActiveMockNode = useMockStore((state) => state.getActiveMockNode);
    
    const executionState = useMemo(() => {
        if (!activeRunId) {
            return null; // No active run
        }
        
        const mockNode = getActiveMockNode(nodeId, activeRunId);
        if (!mockNode) {
            return null; // Node not executing in active run
        }
        
        return {
            isExecuting: mockNode.status === 'executing',
            isCompleted: mockNode.status === 'success' || mockNode.status === 'error' || mockNode.status === 'killed',
            status: mockNode.status,
            runId: mockNode.runId,
            order: mockNode.order,
            started: mockNode.started,
            killed: mockNode.killed
        };
    }, [nodeId, activeRunId, getActiveMockNode]);
    
    return executionState;
}

/**
 * Hook that provides CSS classes for node execution visualization
 * FIX: Onafhankelijk van activeRunId om race conditions te voorkomen
 *
 * Het probleem was dat activeRunId pas wordt gezet NA de API response,
 * terwijl WebSocket events al eerder kunnen binnenkomen. Dit veroorzaakte
 * dat de glow niet verscheen in productie waar de timing anders is.
 */
export function useNodeExecutionClasses(nodeId: string) {
    // Subscribe directly to mockNodes array - onafhankelijk van activeRunId
    const mockNodes = useMockStore((state) => state.mockNodes);

    const classes = useMemo(() => {
        // Zoek naar ELKE run waar deze node executing is
        const isExecuting = mockNodes.some(
            m => m.id.replace(/-\d+$/, '') === nodeId && m.status === 'executing'
        );

        return isExecuting ? 'executing' : '';
    }, [nodeId, mockNodes]);

    return classes;
}