import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import { Connection as ConnectionProps } from "@/types/types";
import { useTheme } from "next-themes";
import { updateConnectionsDirectly } from "@/utils/updateConnectionsDirectly";

import useMockStore from "@/stores/mockStore";
import useEditorStore from "@/stores/editorStore";
import {useRunsStore} from "@/stores/runsStore";
import useNodesStore from "@/stores/nodesStore";

type Props = { connection: ConnectionProps; };

const ConnectionComponent: React.FC<Props> = ({ connection }) => {
    const pathRef = useRef<SVGPathElement>(null);
    const startDotRef = useRef<HTMLDivElement>(null);
    const endDotRef = useRef<HTMLDivElement>(null);

    // Visual connections (warp gate hover) should appear immediately
    const isVisualConnection = connection.id.startsWith('warp-visual-');
    const [isReady, setIsReady] = useState(isVisualConnection);
    const [middle, setMiddle] = useState({ x: 0, y: 0 });

    // PERFORMANCE: Only subscribe to necessary state
    const rawMockConnection = useMockStore(
        (state) => state.getMockConnection(connection.id)
    );
    const backgroundedRunIds = useRunsStore((state) => state.backgroundedRunIds);

    // Need chatMode for rendering - subscribe
    const chatMode = useEditorStore((state) => state.chatMode);
    const isDrawingConnection = useEditorStore((state) => state.isDrawingConnection);

    // Check if this is the connection being drawn
    const isBeingDrawn = connection.id === isDrawingConnection;

    // PERFORMANCE: Check service status on-demand instead of subscribing
    const isConnectionInService = React.useMemo(() => {
        const isNodeInService = useNodesStore.getState().isNodeInService;

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
    }, [connection.sourceNodeId, connection.targetNodeId, connection.sourceGroupId, connection.targetGroupId]);

    const handleConnectionClick = React.useCallback((e: React.MouseEvent) => {
        e.stopPropagation();

        // PERFORMANCE: Read chat mode and panning state on-demand
        const chatMode = useEditorStore.getState().chatMode;
        const isPanning = useEditorStore.getState().isPanning;

        // Don't allow connection deletion in chat mode or when panning
        if (chatMode || isPanning) return;

        // Open delete confirmation dialog instead of immediate deletion
        useEditorStore.getState().setDeleteConnectionDialogOpen(true, connection.id);
    }, [connection.id]);

    const { theme, resolvedTheme } = useTheme();

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

    // PERFORMANCE: Only update connection positions when actual position-related props change
    useEffect(() => {
        updateConnectionsDirectly([connection]);
    }, [
        connection.id,
        connection.sourceNodeId,
        connection.targetNodeId,
        connection.sourceHandle,
        connection.targetHandle,
        connection.sourceGroupId,
        connection.targetGroupId
    ]);

    let color = connection.collapsed ? "#cccccc" : "#ffffff";

    // Use resolvedTheme to handle system theme correctly
    const currentTheme = theme === 'system' ? resolvedTheme : theme;

    // Blue color for visual warp gate connections (always dashed)
    if (isVisualConnection) {
        color = currentTheme === "light"
            ? "rgb(59, 130, 246)" // blue-500
            : "rgb(96, 165, 250)"; // blue-400
    } else if (isConnectionInService) {
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
    const dashArray = isVisualConnection ? "5 5" : (connection.collapsed ? "4 4" : "0");

    // PERFORMANCE: Only recalculate midpoint when connection endpoints change
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
    }, [
        connection.id,
        connection.sourceNodeId,
        connection.targetNodeId,
        connection.sourceHandle,
        connection.targetHandle
    ]);

    return (
        <>
            <svg
                style={{
                    position: "absolute",
                    pointerEvents: isBeingDrawn ? "none" : "auto",
                    overflow: "visible",
                    zIndex: 10,
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

// PERFORMANCE: Memoize to prevent unnecessary re-renders during node selection
const Connection = React.memo(ConnectionComponent, (prevProps, nextProps) => {
    // Only re-render if the connection object reference changed
    // Connection objects are immutable, so reference equality is sufficient
    return prevProps.connection === nextProps.connection;
});

export default Connection;