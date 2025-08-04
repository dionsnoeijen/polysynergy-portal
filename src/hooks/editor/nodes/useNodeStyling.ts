import {useMemo} from 'react';
import {Node} from '@/types/types';
import {MockNode} from '@/stores/mockStore';
import useEditorStore from '@/stores/editorStore';
import useNodeColor, {
    getCategoryBorderColor,
    getCategoryGradientBackgroundColor,
    getCategoryTextColor,
    NodeSubType
} from '@/hooks/editor/nodes/useNodeColor';
import {useShallow} from 'zustand/shallow';

interface NodeStylingOptions {
    isService: boolean;
    mockNode: Partial<MockNode> | undefined;
    hasMockData: boolean;
    isNodeInService: boolean;
    preview: boolean;
}

export const useNodeStyling = (node: Node, options: NodeStylingOptions) => {
    // @ts-expect-error Zustand shallow compare accepted here
    const selectedNodes: string[] = useEditorStore((state) => state.selectedNodes, useShallow);
    
    const nodeColor = useNodeColor(
        node, 
        selectedNodes.includes(node.id), 
        options.mockNode, 
        options.hasMockData, 
        options.isNodeInService
    );

    return useMemo(() => {
        const baseClasses = [
            options.preview ? 'relative' : 'absolute',
            'overflow-visible',
            'select-none',
            'items-start',
            'justify-start',
            'rounded-md',
            'z-0'
        ];

        const stateClasses = node.view.disabled 
            ? ['z-1', 'select-none', 'opacity-30']
            : ['z-20', 'cursor-move'];

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
        options.isService,
        nodeColor
    ]);
};