import { useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';

type Size = {
    width: number;
    height: number;
};

const useResizable = (initialWidth: number, initialHeight: number) => {
    const [size, setSize] = useState<Size>({ width: initialWidth, height: initialHeight });
    const [isResizing, setIsResizing] = useState(false);
    const zoomFactor = useEditorStore((state) => state.zoomFactor);

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            setSize((prevSize) => ({
                width: Math.max(100, prevSize.width + moveEvent.movementX / zoomFactor),
                height: Math.max(100, prevSize.height + moveEvent.movementY / zoomFactor),
            }));
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    return {
        size,
        isResizing,
        handleResizeMouseDown,
    };
};

export default useResizable;
