import React, {ReactNode, useLayoutEffect, useRef, useState} from 'react';
import {Node} from '@/types/types';
import useEditorStore from '@/stores/editorStore';
import useNodePlacement from '@/hooks/editor/nodes/useNodePlacement';
import useResizable from '@/hooks/editor/nodes/useResizable';
import { useNodeExecutionClasses } from '@/hooks/editor/nodes/useNodeExecutionState';

interface NodeContainerProps {
    node: Node;
    preview: boolean;
    className: string;
    onContextMenu: (e: React.MouseEvent) => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onDoubleClick?: (e: React.MouseEvent) => void;
    shouldSuspendRendering: boolean;
    isCollapsed: boolean;
    children: ReactNode;
}

const NodeContainer: React.FC<NodeContainerProps> = ({
    node,
    preview,
    className,
    onContextMenu,
    onMouseDown,
    onDoubleClick,
    shouldSuspendRendering,
    isCollapsed,
    children
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);
    
    const position = useNodePlacement(node);
    const {size} = useResizable(node);
    const zoomFactor = useEditorStore((state) => state.getZoomFactorForVersion());
    const isPanning = useEditorStore((state) => state.isPanning);
    const isZooming = useEditorStore((state) => state.isZooming);
    
    // Get execution classes from store-based hook
    const executionClasses = useNodeExecutionClasses(node.id);

    useLayoutEffect(() => {
        if (ref.current && !shouldSuspendRendering) {
            if (!isPanning && !isZooming) {
                setHeight(ref.current.getBoundingClientRect().height / zoomFactor);
            }
        }
    }, [node.view.height, isPanning, isZooming, node.id, zoomFactor, shouldSuspendRendering]);

    const baseStyle = {
        width: `${size.width}px`,
        left: preview ? '0px' : `${position.x}px`,
        top: preview ? '0px' : `${position.y}px`,
    };

    const expandedStyle = shouldSuspendRendering ? { ...baseStyle, height: `${height}px` } : baseStyle;
    const collapsedStyle = baseStyle;

    const finalClassName = isCollapsed
        ? `${className} p-[0.86rem] w-auto inline-block items-center justify-center cursor-pointer ${executionClasses}`
        : `${className} pb-5 ${executionClasses}`;

    return (
        <div
            ref={ref}
            onContextMenu={onContextMenu}
            onMouseDown={onMouseDown}
            onDoubleClick={onDoubleClick}
            className={finalClassName}
            title={`${node.category} > ${node.name}${!isCollapsed ? ` > ${node.handle}` : ''}`}
            style={isCollapsed ? collapsedStyle : expandedStyle}
            data-type="node"
            data-adding={node.view.adding}
            data-node-id={node.id}
        >
            {(!shouldSuspendRendering || isCollapsed) && children}
        </div>
    );
};

export default NodeContainer;