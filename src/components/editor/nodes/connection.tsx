import React, { useRef, useEffect, useCallback } from "react";
import { Connection as ConnectionProps } from "@/stores/connectionsStore";
import { useTheme } from "next-themes";

type Props = {
    connection: ConnectionProps;
    isLiveUpdate?: boolean;
};

const Connection: React.FC<Props> = ({ connection, isLiveUpdate = false }) => {
    const pathRef = useRef<SVGPathElement>(null);
    const startDotRef = useRef<HTMLDivElement>(null);
    const endDotRef = useRef<HTMLDivElement>(null);

    const { theme } = useTheme();

    let color = connection.collapsed ? "#cccccc" : "#ffffff";

    if (theme === "light") {
        color = connection.collapsed ? "rgb(7, 89, 133)" : "rgb(14, 165, 233)";
    }

    const width = 2;
    const dotRadius = 6.5;
    const dashArray = connection.collapsed ? "4 4" : "0";

    const updatePathAndDots = useCallback(() => {
        if (!pathRef.current || !startDotRef.current || !endDotRef.current) return;

        // Update path
        const controlPointX = (connection.startX + connection.endX) / 2;
        const pathData = `M ${connection.startX},${connection.startY} 
                      C ${controlPointX},${connection.startY} 
                        ${controlPointX},${connection.endY} 
                        ${connection.endX},${connection.endY}`;
        pathRef.current.setAttribute("d", pathData);

        // Update start dot position
        startDotRef.current.style.left = `${connection.startX - dotRadius}px`;
        startDotRef.current.style.top = `${connection.startY - dotRadius}px`;

        // Update end dot position
        endDotRef.current.style.left = `${connection.endX - dotRadius}px`;
        endDotRef.current.style.top = `${connection.endY - dotRadius}px`;
    }, [connection]);

    useEffect(() => {
        if (!isLiveUpdate) {
            updatePathAndDots();
        }
    }, [connection, isLiveUpdate, updatePathAndDots]);

    return (
        <>
            <svg
                style={{
                    position: "absolute",
                    pointerEvents: "none",
                    overflow: "visible",
                    zIndex: 1,
                }}
            >
                <path
                    ref={pathRef}
                    data-connection-id={connection.id}
                    stroke={color}
                    strokeWidth={width}
                    fill="none"
                    strokeDasharray={dashArray}
                />
            </svg>
            <div
                ref={startDotRef}
                style={{
                    position: "absolute",
                    width: `${dotRadius * 2}px`,
                    height: `${dotRadius * 2}px`,
                    borderRadius: "50%",
                    backgroundColor: color,
                    zIndex: 100,
                    pointerEvents: "none",
                }}
            />
            <div
                ref={endDotRef}
                style={{
                    position: "absolute",
                    width: `${dotRadius * 2}px`,
                    height: `${dotRadius * 2}px`,
                    borderRadius: "50%",
                    backgroundColor: color,
                    zIndex: 100,
                    pointerEvents: "none",
                    cursor: "pointer",
                }}
            />
        </>
    );
};

export default Connection;
