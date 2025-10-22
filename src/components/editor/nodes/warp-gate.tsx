import React, { useState } from 'react';
import { NodeProps } from '@/types/types';
import { useWarpGateLogic } from '@/hooks/editor/nodes/useWarpGateLogic';
import { useWarpGateHighlight } from '@/hooks/editor/nodes/useWarpGateHighlight';
import { useWarpGateVisualConnection } from '@/hooks/editor/nodes/useWarpGateVisualConnection';
import useNodeMouseDown from '@/hooks/editor/nodes/useNodeMouseDown';
import useNodeContextMenu from '@/hooks/editor/nodes/useNodeContextMenu';
import useNodePlacement from '@/hooks/editor/nodes/useNodePlacement';
import useNodesStore from '@/stores/nodesStore';
import useEditorStore from '@/stores/editorStore';
import Connector from '@/components/editor/nodes/connector';
import clsx from 'clsx';

const WarpGate: React.FC<NodeProps> = ({ node, preview = false }) => {
    const logic = useWarpGateLogic(node);
    const { handleNodeMouseDown } = useNodeMouseDown(node, false);
    const { handleContextMenu } = useNodeContextMenu(node);
    const position = useNodePlacement(node);
    const [isHovered, setIsHovered] = useState(false);

    // Determine if we should show visual feedback (selected, hovered, OR source node is selected)
    const sourceNode = logic.sourceNodeId ? useNodesStore((state) =>
        state.nodes.find(n => n.id === logic.sourceNodeId)
    ) : undefined;
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const isSourceSelected = sourceNode ? selectedNodes.includes(sourceNode.id) : false;
    const shouldHighlight = logic.isSelected || isHovered || isSourceSelected;

    // Apply visual feedback when gate selected, hovered, OR source node selected
    useWarpGateHighlight(shouldHighlight, logic.sourceNodeId, logic.sourceHandle);

    // Show visual connection line when gate hovered OR source node selected
    useWarpGateVisualConnection(isHovered || isSourceSelected, node.id, logic.sourceNodeId, logic.sourceHandle);

    return (
        <div
            data-node-id={node.id}
            data-type="node"
            onMouseDown={handleNodeMouseDown}
            onContextMenu={handleContextMenu}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={clsx(
                "absolute",
                node.view.disabled ? "z-1 select-none opacity-30 cursor-default" : "z-20 cursor-move"
            )}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${node.view.width}px`,
                height: `${node.view.height}px`,
            }}
        >
            {/* Input connector (left side, disabled/visual only) */}
            <div
                className="absolute"
                style={{ left: '-8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
                <Connector
                    in
                    {...logic.inConnectorProps[0]}
                />
            </div>

            {/* Simple circle - easy to click and select */}
            <div
                className={clsx(
                    "w-full h-full rounded-full",
                    "bg-blue-100 dark:bg-blue-900",  // Light blue for warp gates
                    "shadow-lg",
                    shouldHighlight ? "ring-8 ring-blue-500 shadow-2xl shadow-blue-500/50" : "ring-2 ring-blue-400 dark:ring-blue-500",
                    "flex items-center justify-center"
                )}
            >
                {/* Small dot in center */}
                <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full" />
            </div>

            {/* Output connectors - positioned around the circle */}
            {logic.outConnectorProps.map((connectorProps, index) => {
                // Position first connector on the right side by default
                let positionStyle: React.CSSProperties = {};
                if (index === 0) {
                    positionStyle = { right: '-8px', top: '50%', transform: 'translateY(-50%)' };
                } else if (index === 1) {
                    positionStyle = { bottom: '-8px', left: '50%', transform: 'translateX(-50%)' };
                } else if (index === 2) {
                    positionStyle = { left: '-8px', top: '50%', transform: 'translateY(-50%)' };
                } else if (index === 3) {
                    positionStyle = { top: '-8px', left: '50%', transform: 'translateX(-50%)' };
                }

                return (
                    <div
                        key={`out_${index}`}
                        className="absolute pointer-events-auto"
                        style={positionStyle}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <Connector
                            out
                            {...connectorProps}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default React.memo(WarpGate);
