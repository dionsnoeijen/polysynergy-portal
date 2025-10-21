import useEditorStore from '@/stores/editorStore';
import { useCallback } from 'react';

// Debug counter
let renderCount = 0;
let selectorCallCount = 0;

/**
 * Optimized hook that only re-renders when THIS specific node's selection state changes.
 * Does NOT re-render when other nodes are selected/deselected.
 *
 * This prevents the performance issue where selecting one node caused ALL nodes to re-render.
 */
export const useIsNodeSelected = (nodeId: string): boolean => {
    renderCount++;
    if (renderCount % 10 === 0) {
        console.log(`🔍 useIsNodeSelected renders: ${renderCount}, selector calls: ${selectorCallCount}`);
    }

    // Use a stable selector with explicit equality check
    return useEditorStore(
        useCallback((state) => {
            selectorCallCount++;
            return state.selectedNodes.includes(nodeId);
        }, [nodeId])
    );
};
