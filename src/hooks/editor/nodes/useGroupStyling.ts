import {useMemo} from 'react';
import {Node} from '@/types/types';
import useNodeColor, {
    getCategoryBorderColor,
    getCategoryGradientBackgroundColor,
    getCategoryTextColor,
    NodeSubType
} from '@/hooks/editor/nodes/useNodeColor';

interface GroupStylingOptions {
    isService: boolean;
    selectedNodes: string[];
    hasMockData: boolean;
    isMirror: boolean;
    preview: boolean;
    nodeToMoveToGroupId: string | null;
}

export const useGroupStyling = (node: Node, options: GroupStylingOptions) => {
    const nodeColor = useNodeColor(
        node, 
        options.selectedNodes.includes(node.id), 
        options.hasMockData ? {started: false, killed: false} : undefined, 
        options.hasMockData
    );

    return useMemo(() => {
        const baseClasses = [
            options.preview ? 'relative' : 'absolute',
            'overflow-visible',
            'select-none',
            'items-start',
            'justify-start',
            'rounded-md'
        ];

        const stateClasses = (!options.isMirror && node.view.disabled) 
            ? ['z-1', 'select-none', 'opacity-30']
            : ['z-20', ...(options.nodeToMoveToGroupId ? [] : ['cursor-move'])];

        const addingClasses = node.view.adding 
            ? ['shadow-[0_0_15px_rgba(59,130,246,0.8)]']
            : [];

        const containerClassName = [...baseClasses, ...stateClasses, ...addingClasses, nodeColor]
            .filter(Boolean)
            .join(' ');

        const subType = options.isService ? NodeSubType.Service : undefined;

        return {
            container: containerClassName,
            border: getCategoryBorderColor(node.category, subType),
            background: getCategoryGradientBackgroundColor(node.category, subType),
            mainText: getCategoryTextColor('main', node.category, subType),
            subText: getCategoryTextColor('sub', node.category, subType)
        };
    }, [
        node.view.disabled,
        node.view.adding,
        node.category,
        options.preview,
        options.isMirror,
        options.nodeToMoveToGroupId,
        options.isService,
        nodeColor
    ]);
};