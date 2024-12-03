import { InOut } from "@/types/types";
import { useEditorStore } from "@/stores/editorStore";

export const calculateConnectorPosition = (target: HTMLElement) => {
    const { editorPosition, panPosition, zoomFactor } = useEditorStore.getState();
    const rect = target.getBoundingClientRect();
    const x = (rect.left + rect.width / 2 - editorPosition.x - panPosition.x) / zoomFactor;
    const y = (rect.top + rect.height / 2 - editorPosition.y - panPosition.y) / zoomFactor;
    return { x, y };
};

export const localToGlobal = (logicalX: number, logicalY: number) => {
    const { editorPosition, panPosition, zoomFactor } = useEditorStore.getState();
    return {
        x: (logicalX + editorPosition.x + panPosition.x) * zoomFactor,
        y: (logicalY + editorPosition.y + panPosition.y) * zoomFactor,
    };
};

export const globalToLocal = (globalX: number, globalY: number) => {
    const { editorPosition, panPosition, zoomFactor } = useEditorStore.getState();
    return {
        x: (globalX - editorPosition.x - panPosition.x) / zoomFactor,
        y: (globalY - editorPosition.y - panPosition.y) / zoomFactor,
    };
};

export const calculateConnectorPositionByAttributes = (nodeId: string, handle: string, type: InOut) => {
    const selector = `[data-type="${type}"][data-handle="${handle}"][data-node-id="${nodeId}"], 
            [data-type="${type}"][data-handle="${handle}"][data-group-id="${nodeId}"]`;
    const target = document.querySelector(selector) as HTMLElement;

    if (!target) {
        return { x: 0, y: 0 };
    }

    return calculateConnectorPosition(target);
};

export const calculateNodeSize = (nodeId: string) => {
    const { zoomFactor } = useEditorStore.getState();
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
