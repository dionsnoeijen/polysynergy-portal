import React, { useState, useCallback, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import useEditorStore from '@/stores/editorStore';
import useNodesStore from '@/stores/nodesStore';
import useConnectionsStore from '@/stores/connectionsStore';
import { Node } from '@/types/types';
import {snapToGrid} from "@/utils/snapToGrid";
import {updateConnectionsDirectly} from "@/utils/updateConnectionsDirectly";

type Size = {
    width: number;
    height: number;
};

const useResizable = (node: Node) => {
    const [ size, setSize ] = useState<Size>({ width: node.view.width || 100, height: node.view.height || 100 });
    const [ isResizing, setIsResizing ] = useState(false);

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

        // PERFORMANCE: Read zoom factor and connections on-demand instead of subscribing
        const zoomFactor = useEditorStore.getState().zoomFactor;
        const connections = useConnectionsStore.getState().connections;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.movementX / zoomFactor;
            const newWidth = Math.max(100, sizeRef.current.width + deltaX);
            
            // Direct DOM manipulation for immediate visual feedback
            const nodeEl = document.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement;
            if (nodeEl) {
                nodeEl.style.width = `${newWidth}px`;
            }
            
            // Update React state for consistency
            flushSync(() => {
                setSize((prevSize) => ({ ...prevSize, width: newWidth }));
            });
            
            // Update connections to follow the resizing node
            requestAnimationFrame(() => {
                updateConnectionsDirectly(connections);
            });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            const finalWidth = snapToGrid(sizeRef.current.width);

            // PERFORMANCE: Read updateNodeWidth on-demand
            useNodesStore.getState().updateNodeWidth(node.id, finalWidth);

            const nodeEl = document.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement;
            if (nodeEl) {
                nodeEl.style.width = `${finalWidth}px`;
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    }, [node.id]);

    return {
        size,
        isResizing,
        handleResizeMouseDown,
    };
};

export default useResizable;
