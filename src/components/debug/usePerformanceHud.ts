import { useEffect, useRef, useState } from "react";

export function usePerformanceHUD() {
    const [frameTime, setFrameTime] = useState(0);
    const [fps, setFps] = useState(0);
    const renderCount = useRef(0);
    const lastTimestamp = useRef(performance.now());
    const fpsBuffer = useRef<number[]>([]);

    useEffect(() => {
        let rafId: number;

        const loop = (timestamp: number) => {
            const diff = timestamp - lastTimestamp.current;
            lastTimestamp.current = timestamp;

            const currentFps = 1000 / diff;
            fpsBuffer.current.push(currentFps);

            if (fpsBuffer.current.length > 30) {
                fpsBuffer.current.shift(); // max 30 frames
            }

            const avgFps =
                fpsBuffer.current.reduce((a, b) => a + b, 0) /
                fpsBuffer.current.length;

            setFrameTime(diff);
            setFps(avgFps);

            rafId = requestAnimationFrame(loop);
        };

        rafId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId);
    }, []);

    return {
        frameTime,
        fps,
        renderCount,
    };
}