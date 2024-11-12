import { useState, useEffect } from "react";
import { useEditorStore } from "@/stores/editorStore";

export const useDeselectOnClickOutside = () => {
    const { setSelectedNodes, isDragging, setIsDragging, boxSelect } = useEditorStore();
    const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);

    const handleMouseUp = () => {
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            setClickTimeout(null);

            if (!isDragging && !boxSelect) {
                setSelectedNodes([]);
            }
        }
        setIsDragging(false);
    };

    const handleEditorMouseDown = () => {
        if (!isDragging) {
            const timeout = setTimeout(() => {
                setClickTimeout(null);
            }, 200);
            setClickTimeout(timeout);
        }
    };

    useEffect(() => {
        window.addEventListener("mouseup", handleMouseUp);
        return () => window.removeEventListener("mouseup", handleMouseUp);
    }, [clickTimeout, isDragging, boxSelect, setSelectedNodes, setIsDragging, handleMouseUp]);

    return { handleEditorMouseDown };
};
