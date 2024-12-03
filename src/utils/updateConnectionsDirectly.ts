import { calculateConnectorPositionByAttributes } from "@/utils/positionUtils";
import { InOut } from "@/types/types";

export const updateConnectionsDirectly = (
    inConnections: Array<{
        id: string;
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        isGroupConnection?: boolean;
        node?: string;
        handle?: string;
    }>,
    outConnections: Array<{
        id: string;
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        isGroupConnection?: boolean;
        node?: string;
        handle?: string;
    }>,
    deltaX: number,
    deltaY: number,
    localPositions: Map<string, { startX?: number; startY?: number; endX?: number; endY?: number }>,
    editorPosition: { x: number; y: number },
    panPosition: { x: number; y: number },
    zoomFactor: number
) => {
    const updatedConnections: Array<{ id: string; startX: number; startY: number; endX: number; endY: number }> = [];

    // InConnections: werk start- en eindpunten bij
    inConnections.forEach((connection) => {
        const pathElement = document.querySelector(
            `path[data-connection-id="${connection.id}"]`
        ) as SVGPathElement;

        if (pathElement) {
            const local = localPositions.get(connection.id) || {
                startX: connection.startX,
                startY: connection.startY,
                endX: connection.endX,
                endY: connection.endY,
            };

            let newStartX, newStartY, newEndX, newEndY;

            if (connection.isGroupConnection && connection.handle) {
                // Bereken nieuwe startpositie voor group connections
                const startPosition = calculateConnectorPositionByAttributes(
                    connection.node as string,
                    connection.handle,
                    InOut.In,
                    editorPosition,
                    panPosition,
                    zoomFactor
                );
                newStartX = startPosition.x;
                newStartY = startPosition.y;

                // Pas delta toe op eindpunt
                newEndX = local.endX! + deltaX;
                newEndY = local.endY! + deltaY;
            } else {
                // Standaard delta-berekening
                newStartX = local.startX!;
                newStartY = local.startY!;
                newEndX = local.endX! + deltaX;
                newEndY = local.endY! + deltaY;
            }

            const controlPointX = (newStartX + newEndX) / 2;

            localPositions.set(connection.id, {
                startX: newStartX,
                startY: newStartY,
                endX: newEndX,
                endY: newEndY,
            });

            pathElement.setAttribute(
                "d",
                `M ${newStartX},${newStartY}
                   C ${controlPointX},${newStartY}
                     ${controlPointX},${newEndY}
                     ${newEndX},${newEndY}`
            );

            updatedConnections.push({
                id: connection.id,
                startX: newStartX,
                startY: newStartY,
                endX: newEndX,
                endY: newEndY,
            });
        }
    });

    // OutConnections: werk start- en eindpunten bij
    outConnections.forEach((connection) => {
        const pathElement = document.querySelector(
            `path[data-connection-id="${connection.id}"]`
        ) as SVGPathElement;

        if (pathElement) {
            const local = localPositions.get(connection.id) || {
                startX: connection.startX,
                startY: connection.startY,
                endX: connection.endX,
                endY: connection.endY,
            };

            let newStartX, newStartY, newEndX, newEndY;

            if (connection.isGroupConnection && connection.handle) {
                // Bereken nieuwe eindpositie voor group connections
                const endPosition = calculateConnectorPositionByAttributes(
                    connection.node as string,
                    connection.handle,
                    InOut.Out,
                    editorPosition,
                    panPosition,
                    zoomFactor
                );
                newEndX = endPosition.x;
                newEndY = endPosition.y;

                // Pas delta toe op startpunt
                newStartX = local.startX! + deltaX;
                newStartY = local.startY! + deltaY;
            } else {
                // Standaard delta-berekening
                newStartX = local.startX! + deltaX;
                newStartY = local.startY! + deltaY;
                newEndX = local.endX!;
                newEndY = local.endY!;
            }

            const controlPointX = (newStartX + newEndX) / 2;

            localPositions.set(connection.id, {
                startX: newStartX,
                startY: newStartY,
                endX: newEndX,
                endY: newEndY,
            });

            pathElement.setAttribute(
                "d",
                `M ${newStartX},${newStartY}
                   C ${controlPointX},${newStartY}
                     ${controlPointX},${newEndY}
                     ${newEndX},${newEndY}`
            );

            updatedConnections.push({
                id: connection.id,
                startX: newStartX,
                startY: newStartY,
                endX: newEndX,
                endY: newEndY,
            });
        }
    });

    return updatedConnections; // Retourneer alle bijgewerkte verbindingen
};
