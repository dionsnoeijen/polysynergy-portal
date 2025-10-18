import { calculateConnectorPositionByAttributes } from "@/utils/positionUtils";
import { InOut, Position } from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import {Connection} from "@/types/types";

export const updateConnectionsDirectly = (
    connections: Array<Connection>,
    mousePosition?: Position
) => {
    const updatedConnections: Connection[] = [];
    const { isDrawingConnection } = useEditorStore.getState();

    connections.forEach((connection) => {

        const pathElement = document.querySelector(
            `path[data-connection-id="${connection.id}"]`
        ) as SVGPathElement;
        
        const clickablePathElement = document.querySelector(
            `path[data-connection-clickable-id="${connection.id}"]`
        ) as SVGPathElement;

        const startDotElement = document.querySelector(
            `div[data-connection-start-id="${connection.id}"]`
        ) as HTMLDivElement;

        const endDotElement = document.querySelector(
            `div[data-connection-end-id="${connection.id}"]`
        ) as HTMLDivElement;

        if (pathElement) {
            const startPosition = calculateConnectorPositionByAttributes(
                connection.sourceNodeId,
                connection.sourceHandle,
                InOut.Out,
                connection.sourceGroupId
            );

            let endPosition = { x: 0, y: 0 };

            if (connection.id === isDrawingConnection && mousePosition) {
                endPosition = mousePosition;
            } else if (connection.targetNodeId && connection.targetHandle) {
                // Use targetNodeId (specific connector) instead of targetGroupId (all connectors in group)
                // This ensures we find the exact connector, not just the first one with the same handle
                endPosition = calculateConnectorPositionByAttributes(
                    connection.targetNodeId ?? connection.targetGroupId,
                    connection.targetHandle,
                    InOut.In
                );
            }

            if (endPosition.x === 0 && endPosition.y === 0) return;

            // Smart curve routing with horizontal offsets from connectors
            // This creates an elegant S-curve that works in all directions
            const deltaX = endPosition.x - startPosition.x;
            const distance = Math.abs(deltaX);

            // Smooth blend between forward and backwards offset based on direction
            // When deltaX is negative (backwards), blend towards aggressive offset
            const backwardsFactor = deltaX < 0 ? Math.min(Math.abs(deltaX) / 200, 1) : 0;

            const forwardOffset = Math.min(Math.max(distance * 0.3, 50), 150);   // Subtle
            const backwardsOffset = Math.min(Math.max(distance * 0.5, 150), 400); // Aggressive

            // Smooth interpolation between the two
            const offset = forwardOffset + (backwardsOffset - forwardOffset) * backwardsFactor;

            const control1X = startPosition.x + offset;  // Extend right from source
            const control2X = endPosition.x - offset;     // Extend left from target

            const pathData = `M ${startPosition.x},${startPosition.y}
                   C ${control1X},${startPosition.y}
                     ${control2X},${endPosition.y}
                     ${endPosition.x},${endPosition.y}`;
            
            pathElement.setAttribute("d", pathData);
            
            // Also update the clickable path
            if (clickablePathElement) {
                clickablePathElement.setAttribute("d", pathData);
            }

            // Update start dot position
            if (startDotElement) {
                startDotElement.style.left = `${startPosition.x - 5.5}px`;
                startDotElement.style.top = `${startPosition.y - 5.5}px`;
            }

            // Update end dot position
            if (endDotElement) {
                endDotElement.style.left = `${endPosition.x - 5.5}px`;
                endDotElement.style.top = `${endPosition.y - 5.5}px`;
            }

            updatedConnections.push(connection);
        }
    });

    return updatedConnections;
};
