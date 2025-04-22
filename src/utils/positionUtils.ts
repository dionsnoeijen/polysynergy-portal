import {InOut, NodeCollapsedConnector} from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";

export const calculateConnectorPosition = (
    target: HTMLElement,
) => {
    const {editorPosition, panPosition, zoomFactor} = useEditorStore.getState();
    const rect = target.getBoundingClientRect();
    const x = (rect.left + rect.width / 2 - editorPosition.x - panPosition.x) / zoomFactor;
    const y = (rect.top + rect.height / 2 - editorPosition.y - panPosition.y) / zoomFactor;
    return {x, y};
};

export const localToGlobal = (logicalX: number, logicalY: number) => {
    const {editorPosition, panPosition, zoomFactor} = useEditorStore.getState();
    return {
        x: (logicalX + editorPosition.x + panPosition.x) * zoomFactor,
        y: (logicalY + editorPosition.y + panPosition.y) * zoomFactor,
    };
};

export const globalToLocal = (globalX: number, globalY: number) => {
    const {editorPosition, panPosition, zoomFactor} = useEditorStore.getState();
    return {
        x: (globalX - editorPosition.x - panPosition.x) / zoomFactor,
        y: (globalY - editorPosition.y - panPosition.y) / zoomFactor,
    };
};

const buildSelector = (
    type: InOut,
    handle: string,
    nodeId: string,
) => {
    return `[data-type="${type}"][data-handle="${handle}"][data-node-id="${nodeId}"],
            [data-type="${type}"][data-handle="${handle}"][data-group-id="${nodeId}"]`;
}

export const calculateConnectorPositionByAttributes = (
    nodeId: string,
    handle: string,
    type: InOut,
    groupId?: string
) => {
    let selector = buildSelector(type, handle, nodeId);
    let target = document.querySelector(selector) as HTMLElement;

    if (!target) {
        const handleParts = handle.split('.');
        if (handleParts.length > 1) {
            const newHandle = handleParts[0];
            selector = buildSelector(type, newHandle, nodeId);
            target = document.querySelector(selector) as HTMLElement;
        }
    }

    if (!target && groupId) {
        selector = buildSelector(type, NodeCollapsedConnector.Collapsed, groupId);
        target = document.querySelector(selector) as HTMLElement;
    }

    if (!target) {
        selector = buildSelector(type, NodeCollapsedConnector.Collapsed, nodeId);
        target = document.querySelector(selector) as HTMLElement;
    }

    const editor = document.querySelector(`[data-type="editor"]`) as HTMLElement;

    if (!editor) {
        return {x: 0, y: 0};
    }

    if (!target) {
        return {x: 0, y: 0};
    }

    return calculateConnectorPosition(target);
};

export const getNodeBoundsFromState = (nodeIds: string[]) => {
    const {getNodesByIds} = useNodesStore.getState();
    const nodes = getNodesByIds(nodeIds);
    return nodes.reduce(
        (acc, node) => {
            const nodeRight = node.view.x + node.view.width;
            const nodeBottom = node.view.y + node.view.height;

            return {
                minX: Math.min(acc.minX, node.view.x),
                minY: Math.min(acc.minY, node.view.y),
                maxX: Math.max(acc.maxX, nodeRight),
                maxY: Math.max(acc.maxY, nodeBottom),
            };
        },
        {minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity}
    );
};

export const getNodeBoundsFromDOM = (nodeIds: string[]) => {
    const {editorPosition, panPosition, zoomFactor} = useEditorStore.getState();

    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
    let foundAny = false;

    nodeIds.forEach((nodeId) => {
        const el = document.querySelector(`[data-node-id="${nodeId}"]`)
        if (!el) return;
        foundAny = true;

        const rect = el.getBoundingClientRect();
        const x = (rect.left - editorPosition.x - panPosition.x) / zoomFactor;
        const y = (rect.top - editorPosition.y - panPosition.y) / zoomFactor;
        const right = x + (rect.width / zoomFactor);
        const bottom = y + (rect.height / zoomFactor);

        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (right > maxX) maxX = right;
        if (bottom > maxY) maxY = bottom;
    });

    return {foundAny, minX, minY, maxX, maxY};
};
