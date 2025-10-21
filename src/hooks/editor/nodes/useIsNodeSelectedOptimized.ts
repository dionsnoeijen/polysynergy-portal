import { useEffect, useState } from 'react';
import useEditorStore from '@/stores/editorStore';

/**
 * ULTRA-optimized selection hook using manual subscription
 * Only re-renders when THIS specific node's selection state actually changes
 */
export const useIsNodeSelectedOptimized = (nodeId: string): boolean => {
    const [isSelected, setIsSelected] = useState(() =>
        useEditorStore.getState().selectedNodes.includes(nodeId)
    );

    useEffect(() => {
        // Subscribe to store changes
        const unsubscribe = useEditorStore.subscribe((state) => {
            const nowSelected = state.selectedNodes.includes(nodeId);
            // Only update if selection state actually changed for THIS node
            setIsSelected(prev => {
                if (prev !== nowSelected) {
                    return nowSelected;
                }
                return prev;
            });
        });

        return unsubscribe;
    }, [nodeId]);

    return isSelected;
};
