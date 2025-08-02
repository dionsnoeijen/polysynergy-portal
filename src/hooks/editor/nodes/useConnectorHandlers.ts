import React from "react";
import { useInConnectorHandler } from './useInConnectorHandler';
import { useOutConnectorHandler } from './useOutConnectorHandler';

export const useConnectorHandlers = (
    isIn: boolean = false,
    isOut: boolean = false,
    nodeId: string,
    isGroup: boolean = false,
    disabled: boolean = false
) => {
    const { handleMouseDownOnInConnector } = useInConnectorHandler(nodeId);
    const { handleMouseDownOnOutConnector } = useOutConnectorHandler(nodeId, isGroup, isIn);

    const handleMouseDown = (e: React.MouseEvent) => {
        const target = (e.target as HTMLElement).closest('[data-type="in"], [data-type="out"]') as HTMLElement;
        const enabled = target.getAttribute("data-enabled") === "true";

        if (disabled || !enabled) return;

        if ((isIn && !isGroup) || (isOut && isGroup)) {
            handleMouseDownOnInConnector(e);
        } else {
            handleMouseDownOnOutConnector(e);
        }
    };

    return { handleMouseDown };
};