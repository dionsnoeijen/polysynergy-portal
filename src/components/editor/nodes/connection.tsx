import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import { Connection as ConnectionProps } from "@/types/types";
import { useTheme } from "next-themes";
import { updateConnectionsDirectly } from "@/utils/updateConnectionsDirectly";
import useMockStore from "@/stores/mockStore";

type Props = { connection: ConnectionProps; };

const Connection: React.FC<Props> = ({ connection }) => {
    const pathRef = useRef<SVGPathElement>(null);
    const startDotRef = useRef<HTMLDivElement>(null);
    const endDotRef = useRef<HTMLDivElement>(null);

    const [isReady, setIsReady] = useState(false);
    const [middle, setMiddle] = useState({ x: 0, y: 0 });

    const { theme } = useTheme();
    const mockConnection = useMockStore(
        (state) => state.getMockConnection(connection.id)
    );

    useEffect(() => {
        updateConnectionsDirectly([connection]);
    }, [connection]);

    let color = connection.collapsed ? "#cccccc" : "#ffffff";

    if (theme === "light") {
        color = connection.collapsed
            ? "rgb(7, 89, 133)"
            : "rgb(14, 165, 233)";
    }

    if (mockConnection) {
        if (mockConnection.killer) color = "rgb(255, 0, 0)";
        if (!mockConnection.touched && !mockConnection.killer) {
            color = "rgb(255, 0, 0)";
        }
        if (!mockConnection.killer && mockConnection.touched) {
            color = "rgb(0, 255, 0)";
        }
    }

    const width = 2;
    const dotRadius = 6.5;
    const dashArray = connection.collapsed ? "4 4" : "0";

    useLayoutEffect(() => {
        const frame = requestAnimationFrame(() => {
            if (pathRef.current) {
                const length = pathRef.current.getTotalLength();
                if (length) {
                    const midpoint = length / 2;
                    const midpointLocation = pathRef.current.getPointAtLength(midpoint);
                    if (midpointLocation) {
                        setMiddle({
                            x: midpointLocation.x,
                            y: midpointLocation.y
                        });
                    }
                }
            }
            setIsReady(true);
        });

        return () => cancelAnimationFrame(frame);
    }, [connection]);

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
                        className="relative z-[100]"
                        style={{ pointerEvents: "none" }}
                    >
                        {connection.id}
                    </text>
                )}
            </svg>
            <div
                title={connection.id}
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
                title={connection.id}
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