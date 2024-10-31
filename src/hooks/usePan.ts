import { useState, useRef } from 'react';

export const usePan = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const startPanPosition = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsPanning(true);
        startPanPosition.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setPosition({
                x: e.clientX - startPanPosition.current.x,
                y: e.clientY - startPanPosition.current.y,
            });
        }
    };

    const handleMouseUp = () => setIsPanning(false);

    return { position, handleMouseDown, handleMouseMove, handleMouseUp, setPosition };
};
