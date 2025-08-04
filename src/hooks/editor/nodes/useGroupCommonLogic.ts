import {useMemo, useState} from 'react';
import {Node} from '@/types/types';
import useEditorStore from '@/stores/editorStore';
import useNodesStore from '@/stores/nodesStore';
import useMockStore from '@/stores/mockStore';
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
    const hasMockData = useMockStore((state) => state.hasMockData);
    
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