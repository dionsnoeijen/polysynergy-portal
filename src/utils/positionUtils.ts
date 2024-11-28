import { InOut } from "@/types/types";

export const calculateConnectorPosition = (
    target: HTMLElement,
    editorPosition: { x: number; y: number },
    panPosition: { x: number; y: number },
    zoomFactor: number
) => {
    const rect = target.getBoundingClientRect();
    const x = (rect.left + rect.width / 2 - editorPosition.x - panPosition.x) / zoomFactor;
    const y = (rect.top + rect.height / 2 - editorPosition.y - panPosition.y) / zoomFactor;
    return { x, y };
};

export const toScreenCoordinates = (
    logicalX: number,
    logicalY: number,
    editorPosition: { x: number; y: number },
    panPosition: { x: number; y: number },
    zoomFactor: number
) => {
    return {
        x: (logicalX + editorPosition.x + panPosition.x) * zoomFactor,
        y: (logicalY + editorPosition.y + panPosition.y) * zoomFactor,
    };
};


export const calculateConnectorPositionByAttributes = (
    nodeId: string,
    handle: string,
    type: InOut,
    editorPosition: { x: number; y: number },
    panPosition: { x: number; y: number },
    zoomFactor: number
) => {
    const selector = `[data-type="${type}"][data-handle="${handle}"][data-node-id="${nodeId}"], 
            [data-type="${type}"][data-handle="${handle}"][data-group-id="${nodeId}"]`;
    const target = document.querySelector(selector) as HTMLElement;

    if (!target) {
        return { x: 0, y: 0 };
    }

    return calculateConnectorPosition(target, editorPosition, panPosition, zoomFactor);
};

export const calculateNodeSize = (nodeId: string, zoomFactor: number) => {
    const selector = `[data-type="node"][data-node-id="${nodeId}"]`;
    const target = document.querySelector(selector) as HTMLElement;

    if (!target) {
        return { width: 0, height: 0 };
    }

    const rect = target.getBoundingClientRect();

    return {
        width: rect.width / zoomFactor,
        height: rect.height / zoomFactor,
    };
};
