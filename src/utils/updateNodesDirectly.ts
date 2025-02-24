export function updateNodesDirectly(
    nodes: string[],
    deltaX: number,
    deltaY: number,
    initialPositions: Record<string, {x:number,y:number}>
) {
    const updateNodes: Array<{
        id: string,
        x: number,
        y: number
    }> = [];

    nodes.forEach((nodeId: string) => {
        const el = document.querySelector(
            `[data-node-id="${nodeId}"]:not([data-type="in"]):not([data-type="out"])`
        ) as HTMLElement;
        if (!el) return;

        const { x: startX, y: startY } = initialPositions[nodeId];
        const newX = startX + deltaX;
        const newY = startY + deltaY;

        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;

        initialPositions[nodeId] = { x: newX, y: newY };
        updateNodes.push({ id: nodeId, x: newX, y: newY });
    });

    return updateNodes;
}
