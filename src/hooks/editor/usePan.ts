import React, { useRef } from 'react';
import useEditorStore from "@/stores/editorStore";
import {EditorMode} from "@/types/types";

export const usePan = () => {
    const panPositionForVersion = useEditorStore((state) => state.getPanPositionForVersion());
    const setPanPositionForVersion = useEditorStore((state) => state.setPanPositionForVersion);
    const editorMode = useEditorStore((state) => state.editorMode);
    const isPanning = useEditorStore((state) => state.isPanning);
    const setIsPanning = useEditorStore((state) => state.setIsPanning);

    const startPanPosition = useRef({ x: 0, y: 0 });

    const handlePanMouseDown = (e: React.MouseEvent) => {
        if (editorMode === EditorMode.BoxSelect) return;
        setIsPanning(true);
        startPanPosition.current = {
            x: e.clientX - panPositionForVersion.x,
            y: e.clientY - panPositionForVersion.y,
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPanning || editorMode === EditorMode.BoxSelect) return;
        requestAnimationFrame(() => {
            setPanPositionForVersion({
                x: e.clientX - startPanPosition.current.x,
                y: e.clientY - startPanPosition.current.y,
            });
        });
    };

    const handleMouseUp = () => setIsPanning(false);

    return { panPositionForVersion, handlePanMouseDown, handleMouseMove, handleMouseUp };
};
