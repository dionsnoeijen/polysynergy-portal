import useEditorStore from "@/stores/editorStore";
import React, { useRef } from "react";

export const useZoom = () => {
    const zoomFactorForVersion = useEditorStore((state) => state.getZoomFactorForVersion());

    const setZoomFactorForVersion = useEditorStore((state) => state.setZoomFactorForVersion);

    const panPositionForVersion = useEditorStore((state) => state.getPanPositionForVersion());

    const setPanPositionForVersion = useEditorStore((state) => state.setPanPositionForVersion);

    const setIsZooming = useEditorStore((state) => state.setIsZooming);

    const zoomIntensity = 0.0025;
    const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null); // useRef to hold the timeout ID
    const pendingZoomDelta = useRef(0);
    const zoomAnimationFrame = useRef<number | null>(null);

    const applyZoom = (deltaY: number, contentRect: DOMRect, mouseX: number, mouseY: number) => {
        const { left, top, width, height } = contentRect;
        
        const newZoomFactor = Math.min(Math.max(0.1, zoomFactorForVersion - deltaY * zoomIntensity * Math.log2(zoomFactorForVersion + 1)), 3);
        const scaleRatio = newZoomFactor / zoomFactorForVersion;

        const relativeMouseX = mouseX - left;
        const relativeMouseY = mouseY - top;
        const contentMousePosX = (relativeMouseX - panPositionForVersion.x) / width;
        const contentMousePosY = (relativeMouseY - panPositionForVersion.y) / height;

        const newTranslateX = relativeMouseX - contentMousePosX * (width * scaleRatio);
        const newTranslateY = relativeMouseY - contentMousePosY * (height * scaleRatio);

        setIsZooming(true);
        setZoomFactorForVersion(newZoomFactor);
        setPanPositionForVersion({ x: newTranslateX, y: newTranslateY });

        // Clear the previous timeout
        if (zoomTimeoutRef.current) {
            clearTimeout(zoomTimeoutRef.current);
        }

        // Set a new timeout to disable isZooming after 150ms
        zoomTimeoutRef.current = setTimeout(() => {
            setIsZooming(false);
        }, 150);
    };

    const handleZoom = (
        e: React.WheelEvent,
        contentRect: DOMRect
    ) => {
        e.preventDefault();
        
        // Accumulate wheel deltas and use requestAnimationFrame for smooth application
        pendingZoomDelta.current += e.deltaY;
        
        if (zoomAnimationFrame.current) return; // Already scheduled
        
        zoomAnimationFrame.current = requestAnimationFrame(() => {
            const deltaY = pendingZoomDelta.current;
            pendingZoomDelta.current = 0;
            zoomAnimationFrame.current = null;
            
            applyZoom(deltaY, contentRect, e.clientX, e.clientY);
        });
    };

    return { handleZoom };
};