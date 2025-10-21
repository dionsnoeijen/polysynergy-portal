import {useMemo, useState} from 'react';
import {Node} from '@/types/types';
import useEditorStore from '@/stores/editorStore';
import useNodesStore from '@/stores/nodesStore';
import useMockStore from '@/stores/mockStore';
import {useRunsStore} from '@/stores/runsStore';
import useVariablesForGroup from '@/hooks/editor/nodes/useVariablesForGroup';

const PERFORMANCE_THRESHOLD = 30;

export const useGroupCommonLogic = (node: Node, isMirror: boolean = false, preview: boolean = false) => {
    // PERFORMANCE: Only subscribe to state that should trigger re-renders
    // Groups need to react to selection changes for visual feedback
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const nodeToMoveToGroupId = useEditorStore((state) => state.nodeToMoveToGroupId);

    // PERFORMANCE: Subscribe to isPanning/isZooming for suspend rendering feature
    // These MUST be subscriptions to hide text during pan/zoom performance optimization
    const isPanning = useEditorStore((state) => state.isPanning);
    const isZooming = useEditorStore((state) => state.isZooming);
    const visibleNodeCount = useEditorStore((state) => state.visibleNodeCount);

    // PERFORMANCE: Read group/service state on-demand
    const isNodeInGroup = useMemo(
        () => (nodeId: string) => useNodesStore.getState().isNodeInGroup(nodeId),
        []
    );
    const isNodeInService = useMemo(() =>
        useNodesStore.getState().isNodeInService([node.id]),
        [node.id]
    );

    // PERFORMANCE: Subscribe to activeRunId and backgroundedRunIds (needed for reactive updates)
    // But compute group nodes on-demand instead of subscribing to entire mockNodes array
    const activeRunId = useRunsStore((state) => state.activeRunId);
    const backgroundedRunIds = useRunsStore((state) => state.backgroundedRunIds);

    const allGroupNodes = useMemo(() => {
        // Read mockNodes on-demand - recalculate when node changes
        const allMockNodes = useMockStore.getState().mockNodes;
        return allMockNodes.filter(mockNode => {
            const originalNodeId = mockNode.id.replace(/-\d+$/, '');
            return isNodeInGroup(originalNodeId) === node.id;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isNodeInGroup, node.id]);
    
    const hasMockData = useMemo(() => {
        if (allGroupNodes.length === 0) return false;
        
        if (!activeRunId && backgroundedRunIds.size === 0) {
            // No active run and no background runs = show completed run data
            return true;
        } else if (activeRunId) {
            // Active run exists = only show data for active run
            return allGroupNodes.some(mockNode => mockNode.runId === activeRunId);
        } else {
            // Only background runs exist = check if any run for this group is backgrounded
            // If ALL runs for this group are backgrounded, hide feedback
            const hasNonBackgroundRun = allGroupNodes.some(mockNode => 
                !backgroundedRunIds.has(mockNode.runId)
            );
            return hasNonBackgroundRun;
        }
    }, [allGroupNodes, activeRunId, backgroundedRunIds]);
    
    const {variablesForGroup} = useVariablesForGroup(node.id);
    const [isDissolveDialogOpen, setIsDissolveDialogOpen] = useState(false);

    return useMemo(() => ({
        selectedNodes,
        nodeToMoveToGroupId,
        isService: !!node.service?.id || isNodeInService,
        shouldSuspendRendering: isPanning && visibleNodeCount >= PERFORMANCE_THRESHOLD,
        groupId: isNodeInGroup(node.id),
        variablesForGroup,
        hasMockData,
        isNodeInService,
        isMirror,
        preview,
        isDissolveDialogOpen,
        setIsDissolveDialogOpen,
        isPanning,
        isZooming
    }), [
        selectedNodes,
        nodeToMoveToGroupId,
        node.service?.id,
        isNodeInService,
        isPanning,
        visibleNodeCount,
        isNodeInGroup,
        node.id,
        variablesForGroup,
        hasMockData,
        isMirror,
        preview,
        isDissolveDialogOpen,
        isZooming
    ]);
};