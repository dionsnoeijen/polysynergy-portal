import { useEffect } from 'react';

/**
 * Hook to manage visual feedback when a warp gate is selected
 * Highlights the source node and connector that the gate points to
 */
export const useWarpGateHighlight = (
    isSelected: boolean,
    sourceNodeId: string | undefined,
    sourceHandle: string | undefined
) => {
    useEffect(() => {
        if (!isSelected || !sourceNodeId || !sourceHandle) {
            return;
        }

        // Find the source node element
        const sourceNodeElement = document.querySelector(`[data-node-id="${sourceNodeId}"]`);

        // Find the source connector element
        const sourceConnectorElement = document.querySelector(
            `[data-type="out"][data-node-id="${sourceNodeId}"][data-handle="${sourceHandle}"]`
        );

        // Add highlight classes
        if (sourceNodeElement) {
            (sourceNodeElement as HTMLElement).style.boxShadow = '0 0 20px 4px rgba(59, 130, 246, 0.6)';
            (sourceNodeElement as HTMLElement).style.outline = '2px solid rgba(59, 130, 246, 0.8)';
        }

        if (sourceConnectorElement) {
            (sourceConnectorElement as HTMLElement).style.outline = '4px solid rgba(59, 130, 246, 0.9)';
            (sourceConnectorElement as HTMLElement).style.boxShadow = '0 0 12px rgba(59, 130, 246, 0.8)';
        }

        // Cleanup function to remove highlights
        return () => {
            if (sourceNodeElement) {
                (sourceNodeElement as HTMLElement).style.boxShadow = '';
                (sourceNodeElement as HTMLElement).style.outline = '';
            }

            if (sourceConnectorElement) {
                (sourceConnectorElement as HTMLElement).style.outline = '';
                (sourceConnectorElement as HTMLElement).style.boxShadow = '';
            }
        };
    }, [isSelected, sourceNodeId, sourceHandle]);
};
