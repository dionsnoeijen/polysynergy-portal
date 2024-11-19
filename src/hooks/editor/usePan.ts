import { useRef, useState } from 'react';
import { useEditorStore } from "@/stores/editorStore";

export const usePan = () => {
    const { panPosition, setPanPosition, boxSelect } = useEditorStore();
    const [ isPanning, setIsPanning ] = useState(false);
    const startPanPosition = useRef({ x: 0, y: 0 });

    const handlePanMouseDown = (e: React.MouseEvent) => {
        if (boxSelect) return;
        setIsPanning(true);
        startPanPosition.current = {
            x: e.clientX - panPosition.x,
            y: e.clientY - panPosition.y,
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPanning || boxSelect) return;
        setPanPosition({
            x: e.clientX - startPanPosition.current.x,
            y: e.clientY - startPanPosition.current.y,
        });
    };

    const handleMouseUp = () => setIsPanning(false);

    return { panPosition, handlePanMouseDown, handleMouseMove, handleMouseUp, setPanPosition };
};
