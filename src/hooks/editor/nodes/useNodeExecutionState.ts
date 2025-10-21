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
 * Shows ONLY live execution classes for active run (glows), NOT completion borders
 */
export function useNodeExecutionClasses(nodeId: string) {
    const activeRunId = useRunsStore((state) => state.activeRunId);

    // PERFORMANCE: Use getActiveMockNode selector instead of subscribing to entire mockNodes array
    // This prevents ALL nodes from re-rendering on every execution state change
    const getActiveMockNode = useMockStore((state) => state.getActiveMockNode);

    const classes = useMemo(() => {
        const classNames = [];

        // Only for active run: show live execution states (glows)
        if (activeRunId) {
            const activeMockNode = getActiveMockNode(nodeId, activeRunId);

            if (activeMockNode) {
                if (activeMockNode.status === 'executing') {
                    classNames.push('executing');
                }
                // Note: completion states (executed-*) are handled elsewhere, NOT here
            }
        }

        return classNames.join(' ');
    }, [nodeId, activeRunId, getActiveMockNode]);

    return classes;
}