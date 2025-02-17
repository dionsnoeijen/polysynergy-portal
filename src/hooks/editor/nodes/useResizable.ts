import React, { useState, useCallback, useRef, useEffect } from 'react';
import useEditorStore from '@/stores/editorStore';
import useNodesStore from '@/stores/nodesStore';
import useConnectionsStore from '@/stores/connectionsStore';
import { Node } from '@/types/types';
import {snapToGrid} from "@/utils/snapToGrid";

type Size = {
    width: number;
    height: number;
};

const useResizable = (node: Node) => {
    const [ size, setSize ] = useState<Size>({ width: node.view.width || 100, height: node.view.height || 100 });
    const [ isResizing, setIsResizing ] = useState(false);
    const { zoomFactor } = useEditorStore();
    const { updateNodeWidth } = useNodesStore();
    const { findOutConnectionsByNodeId, updateConnection } = useConnectionsStore();

    const sizeRef = useRef(size);
    sizeRef.current = size;

    const initialMouseX = useRef(0);

    useEffect(() => {
        sizeRef.current = size;
    }, [size]);

    const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        initialMouseX.current = e.clientX;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.movementX / zoomFactor;
            const newWidth = Math.max(100, sizeRef.current.width + deltaX);

            setSize((prevSize) => ({ ...prevSize, width: newWidth }));

            const outConnections = findOutConnectionsByNodeId(node.id);
            outConnections.forEach((connection) => {
                updateConnection({
                    ...connection,
                    startX: connection.startX + deltaX,
                });
            });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            const finalWidth = snapToGrid(sizeRef.current.width);
            updateNodeWidth(node.id, finalWidth);
            const nodeEl = document.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement;
            if (nodeEl) {
                nodeEl.style.width = `${finalWidth}px`;
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    }, [
        zoomFactor,
        node.id,
        updateNodeWidth,
        findOutConnectionsByNodeId,
        updateConnection
    ]);

    return {
        size,
        isResizing,
        handleResizeMouseDown,
    };
};

export default useResizable;
