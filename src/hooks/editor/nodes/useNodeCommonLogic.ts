import {useMemo} from 'react';
import {Node, NodeType} from '@/types/types';
import useNodesStore from '@/stores/nodesStore';
import useEditorStore from '@/stores/editorStore';
import useMockStore from '@/stores/mockStore';

const PERFORMANCE_THRESHOLD = 30;

export const useNodeCommonLogic = (node: Node, preview: boolean = false) => {
    const isNodeInService = useNodesStore((state) => state.isNodeInService([node.id]));
    const mockNode = useMockStore((state) => state.getMockNode(node.id));
    const hasMockData = useMockStore((state) => state.hasMockData);
    const isPanning = useEditorStore((state) => state.isPanning);
    const isZooming = useEditorStore((state) => state.isZooming);
    const visibleNodeCount = useEditorStore((state) => state.visibleNodeCount);

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
        preview
    ]);
};