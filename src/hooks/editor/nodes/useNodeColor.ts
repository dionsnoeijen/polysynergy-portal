import {useMemo} from "react";
import {Node, NodeType} from "@/types/types";
import {MockNode} from "@/stores/mockStore";

export enum NodeSubType {
    Service = 'service',
}

export const getCategoryTextColor = (
    type: 'main' | 'sub',
    nodeType: NodeType | string,
    nodeSubType?: NodeSubType
): string => {
    if (nodeSubType === NodeSubType.Service) {
        return type === 'main'
            ? 'text-purple-500 dark:text-purple-100'
            : 'text-purple-700 dark:text-purple-200';
    }
    switch (nodeType) {
        case NodeType.Mock:
            return type === 'main'
                ? 'text-orange-500 dark:text-orange-100'
                : 'text-orange-700 dark:text-orange-200';
        case NodeType.Note:
            return type === 'main'
                ? 'text-yellow-600 dark:text-yellow-100'
                : 'text-yellow-800 dark:text-yellow-200';
        case NodeType.Group:
            return type === 'main'
                ? 'text-green-800 dark:text-green-300'
                : 'text-green-950 dark:text-green-400';
        case NodeType.Flow:
        case NodeType.Jump:
            return type === 'main'
                ? 'text-pink-700 dark:text-pink-200'
                : 'text-pink-900 dark:text-pink-300';
        default:
            return type === 'main'
                ? 'text-sky-500 dark:text-sky-100'
                : 'text-sky-700 dark:text-sky-200';
    }
};

export const getCategoryPlaneBackgroundColor = (
    nodeType: NodeType | string,
    highOpacity: boolean = false,
    nodeSubType?: NodeSubType
): string => {
    if (nodeSubType === NodeSubType.Service) {
        return highOpacity
            ? "bg-purple-500/20 dark:bg-purple-700/70"
            : "bg-purple-500/10 dark:bg-purple-700/70";
    }
    switch (nodeType) {
        case NodeType.Mock:
            return highOpacity
                ? "bg-orange-500/20 dark:bg-orange-700/70"
                : "bg-orange-500/10 dark:bg-orange-700/70";
        case NodeType.Note:
            return highOpacity
                ? "bg-yellow-200/70 dark:bg-yellow-700/70"
                : "bg-yellow-200/60 dark:bg-yellow-700/70";
        case NodeType.Group:
            return highOpacity
                ? "bg-green-400/20 dark:bg-green-700/70"
                : "bg-green-400/10 dark:bg-green-700/70";
        case NodeType.Flow:
        case NodeType.Jump:
            return highOpacity
                ? "bg-pink-700/20 dark:bg-pink-700/60"
                : "bg-pink-700/10 dark:bg-pink-700/60";
        default:
            return highOpacity
                ? "bg-sky-200/80 dark:bg-sky-700/70"
                : "bg-sky-200/70 dark:bg-sky-700/70";
    }
};

export const getCategoryGradientBackgroundColor = (
    nodeType: NodeType | string,
    nodeSubType?: NodeSubType
): string => {
    if (nodeSubType === NodeSubType.Service) {
        return "bg-gradient-to-t to-transparent from-purple-500/20 dark:from-purple-700/70";
    }
    switch (nodeType) {
        case NodeType.Mock:
            return "bg-gradient-to-t to-transparent from-orange-500/30";
        case NodeType.Note:
            return "bg-gradient-to-t to-transparent from-yellow-500/20";
        case NodeType.Group:
            return "bg-gradient-to-t to-transparent from-green-400/20";
        case NodeType.Flow:
        case NodeType.Jump:
            return "bg-gradient-to-t to-transparent from-pink-700/20";
        default:
            return "bg-gradient-to-t to-transparent from-sky-500/20";
    }
};

export const getCategoryBorderColor = (
    nodeType: NodeType | string,
    nodeSubType?: NodeSubType
) => {
    if (nodeSubType === NodeSubType.Service) {
        return "border-purple-500/50";
    }
    switch (nodeType) {
        case NodeType.Mock:
            return "border-orange-500/50";
        case NodeType.Note:
            return "border-yellow-500/50";
        case NodeType.Group:
            return "border-green-400/50";
        case NodeType.Flow:
        case NodeType.Jump:
            return "border-pink-700/50";
        default:
            return "border-sky-500/50";
    }
}

export const getCategoryRingColor = (
    nodeType: NodeType | string,
    nodeSubType?: NodeSubType
) => {
    if (nodeSubType === NodeSubType.Service) {
        return "ring-purple-500 dark:ring-purple-500";
    }
    switch (nodeType) {
        case NodeType.Mock:
            return "ring-orange-500 dark:ring-orange-500";
        case NodeType.Note:
            return "ring-yellow-500 dark:ring-yellow-500";
        case NodeType.Group:
            return "ring-green-400 dark:ring-green-400";
        case NodeType.Flow:
        case NodeType.Jump:
            return "ring-pink-700 dark:ring-pink-700";
        default:
            return "ring-sky-500 dark:ring-sky-500";
    }
}

const useNodeColor = (
    node: Node,
    isSelected: boolean,
    mockNode?: Partial<MockNode>,
    hasMockData?: boolean,
    isNodeInService?: boolean
) => {
    return useMemo(() => {
        let classList = "";

        const isService = node.service?.id || isNodeInService ? NodeSubType.Service : undefined;

        const baseBg = getCategoryPlaneBackgroundColor(node.category, false, isService);
        
        // Handle execution states with enhanced selection styling
        if (mockNode?.status === 'success') {
            if (isSelected) {
                classList += ` ring-green-500 ring-8 shadow-2xl ${baseBg}`;
            } else {
                classList += ` ring-green-500 ring-4 ${baseBg}`;
            }
        } else if (mockNode?.status === 'error' || mockNode?.status === 'killed') {
            if (isSelected) {
                classList += ` ring-red-500 ring-8 shadow-2xl ${baseBg}`;
            } else {
                classList += ` ring-red-500 ring-4 ${baseBg}`;
            }
        } else if (hasMockData) {
            if (isSelected) {
                classList += ` ring-yellow-500 ring-8 shadow-2xl ${baseBg}`;
            } else {
                classList += ` ring-yellow-500 ring-2 ${baseBg}`;
            }
        } else {
            // Normal states (no execution)
            if (isSelected) {
                classList += ` ${baseBg} ring-8 shadow-2xl`;
            } else {
                classList += ` ${getCategoryPlaneBackgroundColor(node.category, true, isService)} ring ring-2`;
            }
            classList += ` ${getCategoryRingColor(node.category, isService)}`;
        }

        return classList;
    }, [mockNode?.status, hasMockData, isSelected, node.service?.id, node.category, isNodeInService]);
};

export default useNodeColor;