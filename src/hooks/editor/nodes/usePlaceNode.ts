import { useEffect, useState } from "react";

type Position = { x: number; y: number };

type UsePlaceNodeOptions = {
    isActive: boolean;
    onRelease: (position: Position) => void;
    transformPosition?: (x: number, y: number) => Position; // Optional transformation function
};

const usePlaceNode = ({
    isActive,
    onRelease,
    transformPosition = (x, y) => ({ x, y }), // Default: no transformation
}: UsePlaceNodeOptions) => {
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

    useEffect(() => {
        if (!isActive) return;

        const handleMouseMove = (e: MouseEvent) => {
            const localPosition = transformPosition(e.clientX, e.clientY);
            setPosition(localPosition);
        };

        const handleMouseUp = () => {
            onRelease(position);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isActive, onRelease, transformPosition, position]);

    return position;
};

export default usePlaceNode;