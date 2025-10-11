import {useMemo, useState} from 'react';
import {Node} from '@/types/types';
import useEditorStore from '@/stores/editorStore';
import useNodesStore from '@/stores/nodesStore';
import useMockStore from '@/stores/mockStore';
import {useRunsStore} from '@/stores/runsStore';
import useVariablesForGroup from '@/hooks/editor/nodes/useVariablesForGroup';

const PERFORMANCE_THRESHOLD = 30;

export const useGroupCommonLogic = (node: Node, isMirror: boolean = false, preview: boolean = false) => {
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const nodeToMoveToGroupId = useEditorStore((state) => state.nodeToMoveToGroupId);
    const isPanning = useEditorStore((state) => state.isPanning);
    const isZooming = useEditorStore((state) => state.isZooming);
    const visibleNodeCount = useEditorStore((state) => state.visibleNodeCount);
    
    const isNodeInGroup = useNodesStore((state) => state.isNodeInGroup);
    const isNodeInService = useNodesStore((state) => state.isNodeInService([node.id]));
    
    // Smart hasMockData calculation for groups - same logic as nodes
    const activeRunId = useRunsStore((state) => state.activeRunId);
    const backgroundedRunIds = useRunsStore((state) => state.backgroundedRunIds);
    const allMockNodes = useMockStore((state) => state.mockNodes);
    
    const allGroupNodes = useMemo(() => {
        return allMockNodes.filter(mockNode => {
            const originalNodeId = mockNode.id.replace(/-\d+$/, '');
            return isNodeInGroup(originalNodeId) === node.id;
        });
    }, [allMockNodes, isNodeInGroup, node.id]);
    
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
    
    const {variablesForGroup} = useVariablesForGroup(node.id, false);
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