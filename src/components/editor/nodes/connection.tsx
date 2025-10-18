import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import { Connection as ConnectionProps } from "@/types/types";
import { useTheme } from "next-themes";
import { updateConnectionsDirectly } from "@/utils/updateConnectionsDirectly";

import useMockStore from "@/stores/mockStore";
import useEditorStore from "@/stores/editorStore";
import {useRunsStore} from "@/stores/runsStore";
import useNodesStore from "@/stores/nodesStore";

type Props = { connection: ConnectionProps; };

const Connection: React.FC<Props> = ({ connection }) => {
    const pathRef = useRef<SVGPathElement>(null);
    const startDotRef = useRef<HTMLDivElement>(null);
    const endDotRef = useRef<HTMLDivElement>(null);

    const [isReady, setIsReady] = useState(false);
    const [middle, setMiddle] = useState({ x: 0, y: 0 });

    const setDeleteConnectionDialogOpen = useEditorStore(s => s.setDeleteConnectionDialogOpen);
    const chatMode = useEditorStore(s => s.chatMode);
    const isPanning = useEditorStore(s => s.isPanning);

    // Check if connection is within a service
    const isNodeInService = useNodesStore(s => s.isNodeInService);

    // For group boundary connections, check if the actual node is in service
    // For normal connections, both nodes must be in service
    const isConnectionInService = React.useMemo(() => {
        // Group boundary to node
        if (connection.sourceGroupId && connection.targetNodeId) {
            return isNodeInService([connection.targetNodeId]);
        }
        // Node to group boundary
        if (connection.targetGroupId) {
            return isNodeInService([connection.sourceNodeId]);
        }
        // Normal connection: both nodes must be in service
        if (connection.targetNodeId) {
            return isNodeInService([connection.sourceNodeId]) && isNodeInService([connection.targetNodeId]);
        }
        return false;
    }, [connection.sourceNodeId, connection.targetNodeId, connection.sourceGroupId, connection.targetGroupId, isNodeInService]);

    const handleConnectionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Don't allow connection deletion in chat mode or when panning
        if (chatMode || isPanning) return;

        // Open delete confirmation dialog instead of immediate deletion
        setDeleteConnectionDialogOpen(true, connection.id);
    };

    const { theme, resolvedTheme } = useTheme();
    const rawMockConnection = useMockStore(
        (state) => state.getMockConnection(connection.id)
    );
    
    // Hide connection visual feedback for background runs
    const backgroundedRunIds = useRunsStore((state) => state.backgroundedRunIds);
    const mockConnection = React.useMemo(() => {
        if (!rawMockConnection) return undefined;
        
        // Check if this connection belongs to a backgrounded run
        // Since connections don't have runId directly, we need to check if the mockConnection
        // belongs to a run that has been backgrounded. For now, we'll use a simpler approach:
        // if ANY run is backgrounded, hide connection visual feedback to be safe.
        if (backgroundedRunIds.size > 0) {
            return undefined;
        }
        
        return rawMockConnection;
    }, [rawMockConnection, backgroundedRunIds]);

    useEffect(() => {
        updateConnectionsDirectly([connection]);
    }, [connection]);

    let color = connection.collapsed ? "#cccccc" : "#ffffff";

    // Use resolvedTheme to handle system theme correctly
    const currentTheme = theme === 'system' ? resolvedTheme : theme;

    // Purple color for connections in services
    if (isConnectionInService) {
        if (currentTheme === "light") {
            color = connection.collapsed
                ? "rgb(147, 51, 234)" // purple-600
                : "rgb(168, 85, 247)"; // purple-500
        } else {
            color = connection.collapsed
                ? "rgb(192, 132, 252)" // purple-400
                : "rgb(216, 180, 254)"; // purple-300
        }
    } else if (currentTheme === "light") {
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
    const dotRadius = 5.5;
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
                    pointerEvents: "auto",
                    overflow: "visible",
                    zIndex: 1,
                    opacity: isReady ? 1 : 0,
                    transition: "opacity 0.2s ease-out 0.2s"
                }}
            >
                {/* Invisible wider path for easier clicking */}
                <path
                    ref={pathRef}
                    data-connection-id={connection.id}
                    stroke={color}
                    strokeWidth={Math.max(width, 8)} // Make it easier to click
                    fill="none"
                    strokeDasharray={dashArray}
                    style={{ cursor: chatMode ? 'default' : 'pointer' }}
                    onClick={handleConnectionClick}
                >
                    <title>{chatMode ? `Connection ${connection.id} (read-only in chat mode)` : `Click to delete connection ${connection.id}`}</title>
                </path>
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
                    transition: "opacity 0.2s ease-out 0.2s",
                    transformOrigin: "center center"
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
                    transition: "opacity 0.2s ease-out 0.2s",
                    transformOrigin: "center center"
                }}
            />
        </>
    );
};

export default Connection;