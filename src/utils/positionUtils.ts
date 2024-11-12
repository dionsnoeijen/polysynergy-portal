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
