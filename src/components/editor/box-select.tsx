import React, {useEffect, useState} from "react";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import {EditorMode} from "@/types/types";

const BoxSelect: React.FC = (): React.ReactElement => {
    const setSelectedNodes = useEditorStore((state) => state.setSelectedNodes);
    const editorPosition = useEditorStore((state) => state.editorPosition);
    const panPosition = useEditorStore((state) => state.panPosition);
    const zoomFactor = useEditorStore((state) => state.zoomFactor);

    const editorMode = useEditorStore((state) => state.editorMode);
    const setEditorMode = useEditorStore((state) => state.setEditorMode);


    const { getNodesToRender } = useNodesStore();
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

            const selectedNodes = getNodesToRender().filter((node) => {
                const nodeLeft = node.view.x;
                const nodeTop = node.view.y;
                const nodeRight = nodeLeft + node.view.width;
                const nodeBottom = nodeTop + node.view.height;

                return (
                    nodeRight >= boxLeft &&
                    nodeLeft <= boxRight &&
                    nodeBottom >= boxTop &&
                    nodeTop <= boxBottom
                );
            });

            setSelectedNodes(selectedNodes.map((node) => node.id));
            setBoxStart(null);
            setBoxEnd(null);
            setEditorMode(EditorMode.Select);
        };

        if (isSelecting) {
            document.addEventListener("mousemove", handleBoxMouseMove);
            document.addEventListener("mouseup", handleBoxMouseUp);
        }

        return () => {
            document.removeEventListener("mousemove", handleBoxMouseMove);
            document.removeEventListener("mouseup", handleBoxMouseUp);
        };
    }, [isSelecting, boxStart, boxEnd, editorMode, setSelectedNodes, getNodesToRender, editorPosition, panPosition, zoomFactor, setEditorMode]);

    const handleBoxMouseDown = (e: React.MouseEvent) => {
        if (editorMode !== EditorMode.BoxSelect) return;

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
                pointerEvents: editorMode === EditorMode.BoxSelect ? "auto" : "none",
            }}
        >
            {isSelecting && <div
                className="absolute bg-sky-200/20 dark:bg-slate-600/20 ring-1 ring-sky-500 dark:ring-white rounded-md z-10 select-none"
                style={boxStyle}
            />}
        </div>
    );
};

export default BoxSelect;
