import React, { useRef, useCallback, useLayoutEffect, useState } from "react";
import { Connection as ConnectionProps } from "@/stores/connectionsStore";
import { useTheme } from "next-themes";

type Props = {
    connection: ConnectionProps;
};

const Connection: React.FC<Props> = ({ connection }) => {
    const pathRef = useRef<SVGPathElement>(null);
    const startDotRef = useRef<HTMLDivElement>(null);
    const endDotRef = useRef<HTMLDivElement>(null);

    const [isReady, setIsReady] = useState(false);
    const [middle, setMiddle] = useState({ x: 0, y: 0 });

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

        const controlPointX = (connection.startX + connection.endX) / 2;
        const pathData = `M ${connection.startX},${connection.startY} 
                      C ${controlPointX},${connection.startY} 
                        ${controlPointX},${connection.endY} 
                        ${connection.endX},${connection.endY}`;
        pathRef.current.setAttribute("d", pathData);

        startDotRef.current.style.left = `${connection.startX - dotRadius}px`;
        startDotRef.current.style.top = `${connection.startY - dotRadius}px`;

        endDotRef.current.style.left = `${connection.endX - dotRadius}px`;
        endDotRef.current.style.top = `${connection.endY - dotRadius}px`;
    }, [connection]);

    useLayoutEffect(() => {
        updatePathAndDots();
        const length = pathRef.current?.getTotalLength();
        if (length) {
            const midpoint = length / 2;
            const midpointLocation = pathRef.current?.getPointAtLength(midpoint);
            if (midpointLocation) {
                setMiddle({ x: midpointLocation.x, y: midpointLocation.y });
            }
        }
        setIsReady(true);
    }, [connection, updatePathAndDots]);

    return (
        <>
            <svg
                style={{
                    position: "absolute",
                    pointerEvents: "none",
                    overflow: "visible",
                    zIndex: 1,
                    opacity: isReady ? 1 : 0,
                    transition: "opacity 0.2s ease-out 0.2s"
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
                {window.debugMode && (
                    <text
                        x={middle.x}
                        y={middle.y}
                        fill={color}
                        dominantBaseline="middle"
                        textAnchor="middle"
                        className={'relative z-[100]'}
                        style={{pointerEvents: "none"}}
                    >
                        {connection.id}
                    </text>
                )}
        </svg>
            <div
                ref={startDotRef}
                data-connection-start-id={connection.id}
                style={{
                    position: "absolute",
                    width: `${dotRadius * 2}px`,
                    height: `${dotRadius * 2}px`,
                    borderRadius: "50%",
                    backgroundColor: color,
                    zIndex: 100,
                    pointerEvents: "none",
                    opacity: isReady ? 1 : 0,
                    transition: "opacity 0.2s ease-out 0.2s"
                }}
            />
            <div
                ref={endDotRef}
                data-connection-end-id={connection.id}
                style={{
                    position: "absolute",
                    width: `${dotRadius * 2}px`,
                    height: `${dotRadius * 2}px`,
                    borderRadius: "50%",
                    backgroundColor: color,
                    zIndex: 100,
                    pointerEvents: "none",
                    cursor: "pointer",
                    opacity: isReady ? 1 : 0,
                    transition: "opacity 0.2s ease-out 0.2s"
                }}
            />
        </>
    );
};

export default Connection;
