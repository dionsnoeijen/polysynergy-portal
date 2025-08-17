import { useEffect, useRef } from 'react';
import useMockStore from "@/stores/mockStore";

/**
 * Hook that automatically switches to the Output tab when execution starts.
 * This hook monitors mockNodes changes and switches tabs when the first node appears.
 */
export const useExecutionTabSwitcher = () => {
    const mockNodes = useMockStore((state) => state.mockNodes);
    const previousMockNodesLength = useRef(mockNodes.length);

    useEffect(() => {
        // Detect execution start: mockNodes start populating (first node appears)
        if (previousMockNodesLength.current === 0 && mockNodes.length > 0) {
            console.log("🎯 Execution detected, switching to Output tab");
            // Dispatch event for DockTabs to switch to Output tab (index 1)
            window.dispatchEvent(new CustomEvent('switch-to-output-tab'));
        }
        
        previousMockNodesLength.current = mockNodes.length;
    }, [mockNodes.length]);
};