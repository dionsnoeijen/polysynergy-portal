import { useMemo, useCallback } from 'react';
import { Node } from '@/types/types';
import useEditorStore from '@/stores/editorStore';
import useConnectionsStore from '@/stores/connectionsStore';

export const useWarpGateLogic = (node: Node) => {
    // Subscribe to selection state for reactive updates
    const selectedNodes = useEditorStore((state) => state.selectedNodes);

    // Check if this gate is selected
    const isSelected = selectedNodes.includes(node.id);

    // Warp gate has 1 disabled input (visual only) and 1 output connector
    const inConnectorProps = useMemo(() => {
        return [{
            nodeId: node.id,
            handle: 'in_visual',
            disabled: true, // Visual only, not interactive
            nodeVariableType: node.warpGate?.variableType || 'unknown'
        }];
    }, [node.id, node.warpGate?.variableType]);

    const outConnectorProps = useMemo(() => {
        return [{
            nodeId: node.id,
            handle: 'out_0',
            disabled: false,
            nodeVariableType: node.warpGate?.variableType || 'unknown'
        }];
    }, [node.id, node.warpGate?.variableType]);

    return {
        isSelected,
        inConnectorProps,
        outConnectorProps,
        sourceNodeId: node.warpGate?.sourceNodeId,
        sourceHandle: node.warpGate?.sourceHandle,
        variableType: node.warpGate?.variableType
    };
};
