import {useMemo} from 'react';
import {Node, NodeType} from '@/types/types';
import useNodesStore from '@/stores/nodesStore';
import useEditorStore from '@/stores/editorStore';
import useMockStore from '@/stores/mockStore';
import {useRunsStore} from '@/stores/runsStore';

const PERFORMANCE_THRESHOLD = 30;

export const useNodeCommonLogic = (node: Node, preview: boolean = false) => {
    const isNodeInService = useNodesStore((state) => state.isNodeInService([node.id]));
    const activeRunId = useRunsStore((state) => state.activeRunId);
    const allMockNode = useMockStore((state) => state.getMockNode(node.id));
    const isPanning = useEditorStore((state) => state.isPanning);
    const isZooming = useEditorStore((state) => state.isZooming);
    const visibleNodeCount = useEditorStore((state) => state.visibleNodeCount);
    
    // Only show visual feedback for active run and completed runs, not background runs
    const backgroundedRunIds = useRunsStore((state) => state.backgroundedRunIds);
    const isBackgroundRun = useMemo(() => {
        if (!allMockNode?.runId) return false;
        return backgroundedRunIds.has(allMockNode.runId);
    }, [backgroundedRunIds, allMockNode?.runId]);
    
    const mockNode = useMemo(() => {
        if (!allMockNode) return undefined;
        
        // Hide visual feedback for background runs (still running but not active)
        if (isBackgroundRun) {
            return undefined;
        }
        
        // Show visual feedback for active run and completed runs
        return allMockNode;
    }, [allMockNode, isBackgroundRun]);
    
    // Calculate hasMockData properly: only true if there's mock data for the active run or completed runs
    const hasMockData = useMemo(() => {
        if (!activeRunId && backgroundedRunIds.size === 0) {
            // No active run and no background runs = show completed run data
            return !!allMockNode;
        } else if (activeRunId) {
            // Active run exists = only show data for active run
            return allMockNode?.runId === activeRunId;
        } else {
            // Only background runs exist = don't show visual feedback
            return false;
        }
    }, [allMockNode, activeRunId, backgroundedRunIds]);

    return useMemo(() => ({
        isService: !!node.service?.id || isNodeInService,
        isCollapsable: node.category !== NodeType.Note,
        shouldSuspendRendering: (isZooming || isPanning) && visibleNodeCount >= PERFORMANCE_THRESHOLD,
        mockNode,
        hasMockData,
        isNodeInService,
        preview
    }), [
        node.service?.id, 
        node.category, 
        isNodeInService, 
        isPanning,
        isZooming,
        visibleNodeCount, 
        mockNode, 
        hasMockData, 
        backgroundedRunIds,
        activeRunId,
        preview
    ]);
};