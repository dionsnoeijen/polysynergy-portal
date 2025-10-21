import React, { useCallback } from "react";
import { useInConnectorHandler } from './useInConnectorHandler';
import { useOutConnectorHandler } from './useOutConnectorHandler';

export const useConnectorHandlers = (
    isIn: boolean = false,
    isOut: boolean = false,
    nodeId: string,
    isGroup: boolean = false,
    disabled: boolean = false
) => {
    // PERFORMANCE: Always create both handlers (Rules of Hooks requirement)
    // But they now use getState() internally so they're lightweight
    const { handleMouseDownOnInConnector } = useInConnectorHandler(nodeId);
    const { handleMouseDownOnOutConnector } = useOutConnectorHandler(nodeId, isGroup, isIn);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (disabled) return;

        const target = (e.target as HTMLElement).closest('[data-type="in"], [data-type="out"]') as HTMLElement;
        const enabled = target.getAttribute("data-enabled") === "true";

        if (!enabled) return;

        if ((isIn && !isGroup) || (isOut && isGroup)) {
            handleMouseDownOnInConnector(e);
        } else {
            handleMouseDownOnOutConnector(e);
        }
    }, [disabled, isIn, isGroup, isOut, handleMouseDownOnInConnector, handleMouseDownOnOutConnector]);

    return { handleMouseDown };
};