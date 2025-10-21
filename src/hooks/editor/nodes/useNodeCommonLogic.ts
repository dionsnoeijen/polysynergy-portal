import {useMemo, useState, useEffect} from 'react';
import {Node, NodeType} from '@/types/types';
import useNodesStore from '@/stores/nodesStore';
import useEditorStore from '@/stores/editorStore';
import useMockStore from '@/stores/mockStore';
import {useRunsStore} from '@/stores/runsStore';

const PERFORMANCE_THRESHOLD = 30;

export const useNodeCommonLogic = (node: Node, preview: boolean = false) => {
    // PERFORMANCE: Use manual subscriptions for values that should trigger re-renders
    // Subscribe only to mockNode changes for THIS specific node
    const [mockNodeState, setMockNodeState] = useState(() => useMockStore.getState().getMockNode(node.id));
    const [activeRunId, setActiveRunId] = useState(() => useRunsStore.getState().activeRunId);
    const [backgroundedRunIds, setBackgroundedRunIds] = useState(() => useRunsStore.getState().backgroundedRunIds);

    // PERFORMANCE: Subscribe to isPanning/isZooming for suspend rendering feature
    // These MUST be subscriptions to hide text during pan/zoom performance optimization
    const isPanning = useEditorStore((state) => state.isPanning);
    const isZooming = useEditorStore((state) => state.isZooming);
    const visibleNodeCount = useEditorStore((state) => state.visibleNodeCount);

    useEffect(() => {
        // Subscribe to mock store changes for this specific node
        const unsubMock = useMockStore.subscribe((state) => {
            const newMockNode = state.getMockNode(node.id);
            setMockNodeState(prev => {
                // Only update if the mock node actually changed
                if (prev?.runId !== newMockNode?.runId ||
                    prev?.order !== newMockNode?.order ||
                    prev?.status !== newMockNode?.status) {
                    return newMockNode;
                }
                return prev;
            });
        });

        // Subscribe to runs store for active run changes
        const unsubRuns = useRunsStore.subscribe((state) => {
            setActiveRunId(state.activeRunId);
            setBackgroundedRunIds(state.backgroundedRunIds);
        });

        return () => {
            unsubMock();
            unsubRuns();
        };
    }, [node.id]);

    // PERFORMANCE: Read these values on-demand instead of subscribing
    const isNodeInService = useMemo(() =>
        useNodesStore.getState().isNodeInService([node.id]),
        [node.id]
    );

    const allMockNode = mockNodeState;
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

    return useMemo(() => {
        return {
            isService: !!node.service?.id || isNodeInService,
            isCollapsable: node.category !== NodeType.Note,
            shouldSuspendRendering: (isZooming || isPanning) && visibleNodeCount >= PERFORMANCE_THRESHOLD,
            mockNode,
            hasMockData,
            isNodeInService,
            preview
        };
    }, [
        node.service?.id,
        node.category,
        isNodeInService,
        isPanning,
        isZooming,
        visibleNodeCount,
        mockNode,
        hasMockData,
        preview
    ]);
};