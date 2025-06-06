import React from "react";
import useEditorStore from "@/stores/editorStore";
import {usePerformanceHUD} from "@/components/debug/usePerformanceHud";

export default function PerformanceHUD() {
    const visibleNodeCount = useEditorStore(s => s.visibleNodeCount);
    const { frameTime, fps, renderCount } = usePerformanceHUD();

    function getFpsColor(fps: number) {
        if (fps >= 55) return "#0f0";
        if (fps >= 40) return "#ff0";
        return "#f00";
    }

    return (
        <div
            style={{
                position: "fixed",
                bottom: 10,
                right: 10,
                background: getFpsColor(fps),
                color: "#000",
                fontFamily: "monospace",
                fontSize: 12,
                padding: 8,
                borderRadius: 8,
                zIndex: 9999,
                pointerEvents: "none",
                whiteSpace: "pre",
                transition: "color 0.3s ease",
            }}
        >
            🧠 Nodes: {visibleNodeCount}
            <br />
            🔁 Renders/frame: ~{renderCount.current}
            <br />

            <br />
            ⏱ Frame: {frameTime.toFixed(1)}ms
            <br />
            🚀 FPS: <span>{Math.round(fps)}</span>
        </div>
    );
}