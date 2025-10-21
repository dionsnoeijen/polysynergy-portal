import React, {ReactNode, useLayoutEffect, useRef, useState} from 'react';
import {Node} from '@/types/types';
import useEditorStore from '@/stores/editorStore';
import useNodesStore from '@/stores/nodesStore';
import useNodePlacement from '@/hooks/editor/nodes/useNodePlacement';
import useAutoResize from '@/hooks/editor/nodes/useAutoResize';

interface GroupContainerProps {
    node: Node;
    isMirror: boolean;
    preview: boolean;
    className: string;
    onContextMenu: (e: React.MouseEvent) => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onDoubleClick: (e: React.MouseEvent) => void;
    shouldSuspendRendering: boolean;
    isCollapsed: boolean;
    isPanning: boolean;
    isZooming: boolean;
    children: ReactNode;
}

const GroupContainer: React.FC<GroupContainerProps> = ({
    node,
    isMirror,
    preview,
    className,
    onContextMenu,
    onMouseDown,
    onDoubleClick,
    shouldSuspendRendering,
    isCollapsed,
    isPanning,
    isZooming,
    children
}) => {
    const autoResizeRef = useAutoResize(node);
    const measureRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);
    const lastWidthRef = useRef<number>(node.view.width);
    const lastHeightRef = useRef<number>(0);

    const position = useNodePlacement(node);
    const updateNodeWidth = useNodesStore((state) => state.updateNodeWidth);
    const zoomFactor = useEditorStore((state) => state.getZoomFactorForVersion());

    // Handle auto-sizing for expanded groups
    useLayoutEffect(() => {
        if (measureRef.current && !isPanning && !isZooming) {
            const rect = measureRef.current.getBoundingClientRect();
            const newHeight = rect.height / zoomFactor;
            const newWidth = rect.width / zoomFactor;

            // Only update height if it changed significantly (> 1px difference)
            if (Math.abs(newHeight - lastHeightRef.current) > 1) {
                lastHeightRef.current = newHeight;
                setHeight(newHeight);
            }

            // Only update width if it changed significantly and differs from last update
            if (Math.abs(newWidth - lastWidthRef.current) > 1 && Math.abs(newWidth - node.view.width) > 1) {
                lastWidthRef.current = newWidth;
                updateNodeWidth(node.id, newWidth);
            }
        }
    }, [isPanning, isZooming, zoomFactor, node.id, node.view.width, updateNodeWidth]);

    // Additional width calculation for collapsed state
    useLayoutEffect(() => {
        if (!node.view.collapsed && measureRef.current && !isPanning && !isZooming) {
            const rect = measureRef.current.getBoundingClientRect();
            const newWidth = rect.width / zoomFactor;
            // Only update if it differs from both current width AND our last recorded width
            if (Math.abs(newWidth - lastWidthRef.current) > 1 && Math.abs(newWidth - node.view.width) > 1) {
                lastWidthRef.current = newWidth;
                updateNodeWidth(node.id, newWidth);
            }
        }
    }, [
        isPanning,
        isZooming,
        node.id,
        node.view.collapsed,
        node.view.width,
        updateNodeWidth,
        zoomFactor
    ]);

    const expandedStyle = {
        left: preview ? '0px' : `${position.x}px`,
        top: preview ? '0px' : `${position.y}px`,
        minWidth: isPanning || isZooming ? `${node.view.width}px` : 'auto',
        height: shouldSuspendRendering ? `${height}px` : undefined,
    };

    const collapsedStyle = {
        width: `${node.view.width}px`,
        left: preview ? '0px' : `${position.x}px`,
        top: preview ? '0px' : `${position.y}px`,
        minWidth: '200px'
    };

    const finalClassName = isCollapsed
        ? `${className} p-[0.86rem]`
        : `${className} pb-5`;

    const ref = isCollapsed ? autoResizeRef : measureRef;
    const style = isCollapsed ? collapsedStyle : expandedStyle;
    const dataNodeId = isMirror ? ('mirror-' + node.id) : node.id;
    const title = isCollapsed
        ? `${node.category} > ${node.id} > ${node.name}`
        : `${node.category} > ${node.name} > ${dataNodeId}`;

    return (
        <div
            ref={ref}
            className={finalClassName}
            data-type="closed-group"
            data-node-id={dataNodeId}
            onContextMenu={onContextMenu}
            onMouseDown={onMouseDown}
            onDoubleClick={onDoubleClick}
            title={title}
            style={style}
        >
            {(!shouldSuspendRendering || isCollapsed) && children}
        </div>
    );
};

export default GroupContainer;