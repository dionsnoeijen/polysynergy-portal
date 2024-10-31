import React, { useRef } from 'react';
import { useZoom } from "@/hooks/useZoom";
import { usePan } from "@/hooks/usePan";
import { Grid } from "@/components/editor/grid";

export default function Editor() {
    const contentRef = useRef<HTMLDivElement>(null);
    const { zoomFactor, handleZoom } = useZoom();
    const { position, handleMouseDown, handleMouseMove, handleMouseUp, setPosition } = usePan();

    const handleWheel = (e: React.WheelEvent) => {
        if (!contentRef.current) return;

        const { newPosition } = handleZoom(e, position, contentRef.current.getBoundingClientRect());
        setPosition(newPosition);
    };

    return (
        <div
            className="relative w-full h-full overflow-hidden"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            ref={contentRef}
        >
            <Grid zoomFactor={zoomFactor} position={position} />

            <div
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoomFactor})`,
                    transition: "transform 0.2s ease-out",
                }}
                className="absolute top-0 left-0 w-0 h-0 overflow-visible"
            >
                <div className="absolute bg-amber-300 left-20 top-20 w-20 h-20"></div>
            </div>
        </div>
    );
}
