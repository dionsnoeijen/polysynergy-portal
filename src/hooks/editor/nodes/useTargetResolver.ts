export interface TargetMeta {
    targetNodeId: string;
    targetHandle: string;
    targetGroupId?: string;
}

export const useTargetResolver = () => {
    const resolveTargetMeta = (targetEl: HTMLElement): TargetMeta => {
        const targetHandle = targetEl.getAttribute("data-handle")!;
        const targetNodeId = targetEl.getAttribute("data-node-id") || targetEl.getAttribute("data-group-id")!;
        const nodeGroupTarget = targetEl.closest('[data-type="closed-group"]') as HTMLElement | null;
        const targetGroupId = nodeGroupTarget?.getAttribute("data-node-id") ?? targetEl.getAttribute("data-group-id") ?? undefined;

        return { targetNodeId, targetHandle, targetGroupId };
    };

    return {
        resolveTargetMeta
    };
};