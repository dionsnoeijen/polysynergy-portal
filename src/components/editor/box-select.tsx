import React, { useState, useEffect } from "react";
import { useEditorStore } from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";

const BoxSelect: React.FC = (): React.ReactElement => {
    const {
        setSelectedNodes,
        boxSelect,
        setBoxSelect,
        setClickSelect,
        editorPosition,
        panPosition,
        zoomFactor
    } = useEditorStore();
    const { getNodes } = useNodesStore();
    const [isSelecting, setIsSelecting] = useState(false);
    const [boxStart, setBoxStart] = useState<{ x: number; y: number } | null>(null);
    const [boxEnd, setBoxEnd] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const handleBoxMouseMove = (e: MouseEvent) => {
            if (!isSelecting || !boxStart) return;
            setBoxEnd({
                x: (e.clientX - editorPosition.x - panPosition.x) / zoomFactor,
                y: (e.clientY - editorPosition.y - panPosition.y) / zoomFactor,
            });
        };

        const handleBoxMouseUp = () => {
            if (!isSelecting || !boxStart || !boxEnd) return;

            setIsSelecting(false);
            const boxLeft = Math.min(boxStart.x, boxEnd.x);
            const boxTop = Math.min(boxStart.y, boxEnd.y);
            const boxRight = Math.max(boxStart.x, boxEnd.x);
            const boxBottom = Math.max(boxStart.y, boxEnd.y);

            const selectedNodes = getNodes().filter((node) => {
                const nodeLeft = node.x;
                const nodeTop = node.y;
                const nodeRight = nodeLeft + node.width;
                const nodeBottom = nodeTop + node.height;

                return (
                    nodeRight >= boxLeft &&
                    nodeLeft <= boxRight &&
                    nodeBottom >= boxTop &&
                    nodeTop <= boxBottom
                );
            });

            setSelectedNodes(selectedNodes.map((node) => node.uuid));
            setBoxStart(null);
            setBoxEnd(null);
            setBoxSelect(false);
            setClickSelect(true);
        };

        if (isSelecting) {
            document.addEventListener("mousemove", handleBoxMouseMove);
            document.addEventListener("mouseup", handleBoxMouseUp);
        }

        return () => {
            document.removeEventListener("mousemove", handleBoxMouseMove);
            document.removeEventListener("mouseup", handleBoxMouseUp);
        };
    }, [
        isSelecting,
        boxStart,
        boxEnd,
        setBoxSelect,
        setSelectedNodes,
        getNodes,
        setClickSelect,
        editorPosition,
        panPosition,
        zoomFactor
    ]);

    const handleBoxMouseDown = (e: React.MouseEvent) => {
        if (!boxSelect) return;

        setIsSelecting(true);
        setBoxStart({
            x: (e.clientX - editorPosition.x - panPosition.x) / zoomFactor,
            y: (e.clientY - editorPosition.y - panPosition.y) / zoomFactor,
        });
        setBoxEnd({
            x: (e.clientX - editorPosition.x - panPosition.x) / zoomFactor,
            y: (e.clientY - editorPosition.y - panPosition.y) / zoomFactor,
        });
    };

    const boxStyle = boxStart && boxEnd
        ? {
            left: `${(Math.min(boxStart.x, boxEnd.x) * zoomFactor) + panPosition.x}px`,
            top: `${(Math.min(boxStart.y, boxEnd.y) * zoomFactor) + panPosition.y}px`,
            width: `${Math.abs(boxEnd.x - boxStart.x) * zoomFactor}px`,
            height: `${Math.abs(boxEnd.y - boxStart.y) * zoomFactor}px`,
        }
        : { display: "none" };

    return (
        <div
            className="absolute w-full h-full"
            onMouseDown={handleBoxMouseDown}
            style={{
                pointerEvents: boxSelect ? "auto" : "none",
            }}
        >
            {isSelecting && <div
                className="absolute bg-slate-800/20 ring-1 ring-white rounded-md z-10 select-none"
                style={boxStyle}
            />}
        </div>
    );
};

export default BoxSelect;
