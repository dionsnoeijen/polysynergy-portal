import React, { useRef, useEffect } from 'react';
import { useZoom } from "@/hooks/editor/useZoom";
import { usePan } from "@/hooks/editor/usePan";
import { Grid } from "@/components/editor/grid";
import Node from "@/components/editor/nodes/node";
import { useEditorStore } from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import Connection from "@/components/editor/nodes/connection";
import { useConnectionsStore } from "@/stores/connectionsStore";
import { useDeselectOnClickOutside } from "@/hooks/editor/nodes/useDeselectOnClickOutside";
import BoxSelect from "@/components/editor/box-select";

export default function Editor({
   projectUuid = null,
   routeUuid = null
}: {
    projectUuid?: null | string,
    routeUuid?: null | string
}) {
    const contentRef = useRef<HTMLDivElement>(null);

    const {
        zoomFactor,
        setEditorPosition,
        isDragging,
        panPosition,
        isDrawingConnection,
        mousePosition,
        boxSelectPosition
    } = useEditorStore();
    const { getNodes } = useNodesStore();
    const { getConnections } = useConnectionsStore();

    const { handleZoom } = useZoom();
    const { handlePanMouseDown, handleMouseMove, handleMouseUp } = usePan();
    const { handleEditorMouseDown } = useDeselectOnClickOutside();

    useEffect(() => {
        const updateEditorPosition = () => {
            if (contentRef.current) {
                const rect = contentRef.current.getBoundingClientRect();
                setEditorPosition({ x: rect.left, y: rect.top });
            }
        };

        updateEditorPosition();
        window.addEventListener('resize', updateEditorPosition);
        return () => window.removeEventListener('resize', updateEditorPosition);
    }, [ setEditorPosition ]);

    const handleWheel = (e: React.WheelEvent) => {
        if (!contentRef.current) return;
        handleZoom(e, contentRef.current.getBoundingClientRect());
    };

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
            <BoxSelect projectUuid={projectUuid as string} routeUuid={routeUuid as string} />

            <div
                style={{ transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomFactor})` }}
                className="absolute top-0 left-0 w-0 h-0 overflow-visible"
            >
                {boxSelectPosition.lx !== 0 && boxSelectPosition.ly !== 0 && boxSelectPosition.rx !== 0 && boxSelectPosition.ry !== 0 && (
                <div style={
                    {
                        left: boxSelectPosition.lx,
                        top: boxSelectPosition.ly,
                        width: boxSelectPosition.rx - boxSelectPosition.lx,
                        height: boxSelectPosition.ry - boxSelectPosition.ly
                    }
                } className="-z-10 absolute bg-slate-800/20 ring-1 ring-red-500 rounded-md select-none" />
                )}

                {getNodes(projectUuid as string, routeUuid as string).map((node) => (
                    <Node
                        key={node.uuid}
                        node={node}
                    />
                ))}

                {getConnections().map((connection) => (
                    <Connection
                        key={connection.id}
                        startX={connection.startX}
                        startY={connection.startY}
                        endX={isDrawingConnection === connection.id ? mousePosition.x : connection.endX}
                        endY={isDrawingConnection === connection.id ? mousePosition.y : connection.endY}
                    />
                ))}

            </div>
        </div>
    );
}
