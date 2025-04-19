import useEditorStore from "@/stores/editorStore";
import React, { useRef } from "react";

export const useZoom = () => {
    const { zoomFactor, setZoomFactor, panPosition, setPanPosition, setIsZooming } = useEditorStore();
    const zoomIntensity = 0.0025;
    const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null); // useRef to hold the timeout ID

    const handleZoom = (
        e: React.WheelEvent,
        contentRect: DOMRect
    ) => {
        e.preventDefault();

        const { left, top, width, height } = contentRect;
        const { clientX: mouseX, clientY: mouseY } = e;

        const newZoomFactor = Math.min(Math.max(0.1, zoomFactor - e.deltaY * zoomIntensity * Math.log2(zoomFactor + 1)), 3);
        const scaleRatio = newZoomFactor / zoomFactor;

        const relativeMouseX = mouseX - left;
        const relativeMouseY = mouseY - top;
        const contentMousePosX = (relativeMouseX - panPosition.x) / width;
        const contentMousePosY = (relativeMouseY - panPosition.y) / height;

        const newTranslateX = relativeMouseX - contentMousePosX * (width * scaleRatio);
        const newTranslateY = relativeMouseY - contentMousePosY * (height * scaleRatio);

        setIsZooming(true);
        setZoomFactor(newZoomFactor);
        setPanPosition({ x: newTranslateX, y: newTranslateY });

        // Clear the previous timeout
        if (zoomTimeoutRef.current) {
            clearTimeout(zoomTimeoutRef.current);
        }

        // Set a new timeout to disable isZooming after 150ms
        zoomTimeoutRef.current = setTimeout(() => {
            setIsZooming(false);
        }, 150);
    };

    return { handleZoom };
};