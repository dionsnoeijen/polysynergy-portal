import { useCallback, useRef } from 'react';
import useConnectionsStore from '@/stores/connectionsStore';
import { updateConnectionsDirectly } from '@/utils/updateConnectionsDirectly';

/**
 * Hook to trigger connection position updates when node dimensions change
 * Used when nodes change size dynamically (e.g., image variables auto-expanding)
 */
export const useConnectionPositionUpdater = () => {
    const connections = useConnectionsStore((state) => state.connections);
    const updateTimeoutRef = useRef<number | null>(null);

    const triggerConnectionUpdate = useCallback(() => {
        // Clear any existing timeout to debounce rapid updates
        if (updateTimeoutRef.current) {
            cancelAnimationFrame(updateTimeoutRef.current);
        }

        // Use requestAnimationFrame to ensure DOM updates are complete
        // before calculating new connection positions
        updateTimeoutRef.current = requestAnimationFrame(() => {
            updateConnectionsDirectly(connections);
            updateTimeoutRef.current = null;
        });
    }, [connections]);

    return {
        triggerConnectionUpdate
    };
};