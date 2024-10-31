import { useState } from 'react';

export const useZoom = () => {
    const [zoomFactor, setZoomFactor] = useState(1);
    const zoomIntensity = 0.0025;

    const handleZoom = (
        e: React.WheelEvent,
        position: { x: number; y: number },
        contentRect: DOMRect
    ) => {
        e.preventDefault();

        const { left, top, width, height } = contentRect;
        const { clientX: mouseX, clientY: mouseY } = e;

        // Bereken nieuwe zoomFactor en schaalverhouding
        const newZoomFactor = Math.min(Math.max(0.4, zoomFactor - e.deltaY * zoomIntensity * Math.log2(zoomFactor + 1)), 3);
        const scaleRatio = newZoomFactor / zoomFactor;

        // Bereken de positieverschillen voor muisgecentreerd zoomen
        const relativeMouseX = mouseX - left;
        const relativeMouseY = mouseY - top;
        const contentMousePosX = (relativeMouseX - position.x) / width;
        const contentMousePosY = (relativeMouseY - position.y) / height;

        const newTranslateX = relativeMouseX - contentMousePosX * (width * scaleRatio);
        const newTranslateY = relativeMouseY - contentMousePosY * (height * scaleRatio);

        // Stel de nieuwe zoomFactor in
        setZoomFactor(newZoomFactor);

        // Return alleen de nieuwe positie voor gebruik in de component
        return { newPosition: { x: newTranslateX, y: newTranslateY } };
    };

    return { zoomFactor, handleZoom };
};
