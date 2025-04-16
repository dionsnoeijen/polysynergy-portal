import { useState, useEffect } from "react";
import useEditorStore from "@/stores/editorStore";
import {EditorMode} from "@/types/types";

export const useDeselectOnClickOutside = () => {
    const { setSelectedNodes, isDragging, setIsDragging, editorMode } = useEditorStore();
    const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);

    const handleEditorMouseDown = () => {
        if (!isDragging) {
            const timeout = setTimeout(() => {
                setClickTimeout(null);
            }, 200);
            setClickTimeout(timeout);
        }
    };

    useEffect(() => {
        const handleMouseUp = (e: MouseEvent) => {
            if (clickTimeout) {
                clearTimeout(clickTimeout);
                setClickTimeout(null);

                const target = e.target as HTMLElement | null;
                if (!isDragging && editorMode !== EditorMode.BoxSelect && (
                    target?.getAttribute('data-type') === 'editor' ||
                    target?.getAttribute('data-type') === 'open-group'
                )) {
                    setSelectedNodes([]);
                }
            }
            setIsDragging(false);
        };

        window.addEventListener("mouseup", handleMouseUp);
        return () => window.removeEventListener("mouseup", handleMouseUp);
    }, [clickTimeout, isDragging, editorMode, setSelectedNodes, setIsDragging]);

    return { handleEditorMouseDown };
};
