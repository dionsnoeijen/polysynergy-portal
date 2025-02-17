import useEditorStore from "@/stores/editorStore";

export const useZoom = () => {
    const { zoomFactor, setZoomFactor, panPosition, setPanPosition } = useEditorStore();
    const zoomIntensity = 0.0025;

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

        setZoomFactor(newZoomFactor);
        setPanPosition({ x: newTranslateX, y: newTranslateY });
    };

    return { handleZoom };
};
