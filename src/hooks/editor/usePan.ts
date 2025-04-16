import { useRef, useState } from 'react';
import useEditorStore from "@/stores/editorStore";
import {EditorMode} from "@/types/types";

export const usePan = () => {
    const { panPosition, setPanPosition, editorMode } = useEditorStore();
    const [ isPanning, setIsPanning ] = useState(false);
    const startPanPosition = useRef({ x: 0, y: 0 });

    const handlePanMouseDown = (e: React.MouseEvent) => {
        if (editorMode === EditorMode.BoxSelect) return;
        setIsPanning(true);
        startPanPosition.current = {
            x: e.clientX - panPosition.x,
            y: e.clientY - panPosition.y,
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPanning || editorMode === EditorMode.BoxSelect) return;
        setPanPosition({
            x: e.clientX - startPanPosition.current.x,
            y: e.clientY - startPanPosition.current.y,
        });
    };

    const handleMouseUp = () => setIsPanning(false);

    return { panPosition, handlePanMouseDown, handleMouseMove, handleMouseUp, setPanPosition };
};
