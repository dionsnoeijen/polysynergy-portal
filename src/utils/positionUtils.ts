import {InOut} from "@/types/types";

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

export const calculateConnectorPositionByAttributes = (
    nodeUuid: string,
    handle: string,
    type: InOut,
    editorPosition: { x: number; y: number },
    panPosition: { x: number; y: number },
    zoomFactor: number
) => {
    const selector = `[data-type="${type}"][data-node-uuid="${nodeUuid}"][data-handle="${handle}"]`;
    const target = document.querySelector(selector) as HTMLElement;

    if (!target) {
        console.warn(`Connector with node-uuid ${nodeUuid} and handle ${handle} not found.`);
        return { x: 0, y: 0 };
    }

    return calculateConnectorPosition(target, editorPosition, panPosition, zoomFactor);
};
