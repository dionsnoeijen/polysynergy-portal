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
                endPosition = calculateConnectorPositionByAttributes(
                    connection.targetGroupId ?? connection.targetNodeId,
                    connection.targetHandle,
                    InOut.In
                );
            }

            if (endPosition.x === 0 && endPosition.y === 0) return;

            const controlPointX = (startPosition.x + endPosition.x) / 2;
            const pathData = `M ${startPosition.x},${startPosition.y}
                   C ${controlPointX},${startPosition.y}
                     ${controlPointX},${endPosition.y}
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
