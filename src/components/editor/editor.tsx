import React, {useRef, useEffect, useCallback} from 'react';
import { useZoom } from "@/hooks/editor/useZoom";
import { usePan } from "@/hooks/editor/usePan";
import { Grid } from "@/components/editor/grid";
import Node from "@/components/editor/nodes/node";
import { useEditorStore } from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import Connection from "@/components/editor/nodes/connection";
import { Connection as ConnectionProps } from "@/stores/connectionsStore";
import { useConnectionsStore } from "@/stores/connectionsStore";
import { useDeselectOnClickOutside } from "@/hooks/editor/nodes/useDeselectOnClickOutside";
import BoxSelect from "@/components/editor/box-select";
import {useKeyBindings} from "@/hooks/editor/useKeyBindings";

export default function Editor() {
    const contentRef = useRef<HTMLDivElement>(null);

    const {
        zoomFactor,
        setEditorPosition,
        isDragging,
        panPosition,
        isDrawingConnection,
        mousePosition,
    } = useEditorStore();
    const { getNodes } = useNodesStore();
    const { connections } = useConnectionsStore();

    const { handleZoom } = useZoom();
    const { handlePanMouseDown, handleMouseMove, handleMouseUp } = usePan();
    const { handleEditorMouseDown } = useDeselectOnClickOutside();

    const updateEditorPosition = useCallback(() => {
        if (contentRef.current) {
            const rect = contentRef.current.getBoundingClientRect();
            setEditorPosition({ x: rect.left, y: rect.top });
        }
    }, [setEditorPosition]);

    useEffect(() => {
        updateEditorPosition();
        window.addEventListener('resize', updateEditorPosition);
        return () => window.removeEventListener('resize', updateEditorPosition);
    }, [setEditorPosition, updateEditorPosition]);

    const handleWheel = (e: React.WheelEvent) => {
        if (!contentRef.current) return;
        handleZoom(e, contentRef.current.getBoundingClientRect());
    };

    const getAdjustedConnection = (connection: ConnectionProps): ConnectionProps => {
        if (isDrawingConnection === connection.id) {
            return {
                ...connection,
                endX: mousePosition.x,
                endY: mousePosition.y,
            };
        }
        return connection;
    };

    useKeyBindings({
        'delete': () => {
            // Voeg hier logica toe om geselecteerde nodes te verwijderen
            console.log('Delete key pressed');
        },
        'ctrl+c': (event) => {
            console.log('Copy selected nodes');
        },
        'ctrl+v': (event) => {
            console.log('Paste nodes');
        },
        'ctrl+z': (event) => {
            console.log('Undo last action');
        },
    });

    return (
        <div
            className="relative w-full h-full overflow-hidden ring-1 ring-white/10 rounded-md"
            onWheel={handleWheel}
            onMouseDown={(e) => {
                handleEditorMouseDown();
                handlePanMouseDown(e);
            }}
            onMouseMove={isDragging ? undefined : handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            ref={contentRef}
        >
            <Grid zoomFactor={zoomFactor} position={panPosition} />
            <BoxSelect />

            <div
                style={{ transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomFactor})` }}
                className="absolute top-0 left-0 w-0 h-0 overflow-visible"
            >
                {getNodes().map((node) => (
                    <Node
                        key={node.uuid}
                        node={node}
                    />
                ))}

                {connections.map((connection) => (
                    <Connection
                        key={connection.id}
                        connection={getAdjustedConnection(connection)}
                    />
                ))}
            </div>
        </div>
    );
}
