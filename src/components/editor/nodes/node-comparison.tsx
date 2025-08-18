import {NodeComparisonType, NodeProps, NodeVariableType} from "@/types/types";
import React from "react";
import useEditorStore from "@/stores/editorStore";
import Connector from "@/components/editor/nodes/connector";
import useNodeMouseDown from "@/hooks/editor/nodes/useNodeMouseDown";
import useNodeContextMenu from "@/hooks/editor/nodes/useNodeContextMenu";
import useNodePlacement from "@/hooks/editor/nodes/useNodePlacement";
import {ChevronRightIcon} from "@heroicons/react/24/outline";
import {Strong} from "@/components/text";

import ExecutionOrder from "@/components/editor/nodes/execution-order";

const NodeComparison: React.FC<NodeProps> = ({ node }) => {
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const { handleNodeMouseDown } = useNodeMouseDown(node);
    const { handleContextMenu } = useNodeContextMenu(node);
    const position = useNodePlacement(node);
    

    return (
        <div
            className={`absolute select-none flex items-center justify-center ring-orange-300 bg-orange-300 dark:bg-zinc-800 bg-opacity-50 backdrop-blur-lg backdrop-opacity-60 rounded-[50%] ${
                selectedNodes.includes(node.id) ? "shadow-2xl ring-4" : "shadow-sm ring-2"
            } ${node.view.disabled ? 'z-1 select-none opacity-30' : 'z-20 cursor-move'} ${node.view.adding ? ' shadow-[0_0_15px_rgba(59,130,246,0.8)]' : ''}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `50px`,
                height: `50px`,
            }}
            onContextMenu={handleContextMenu}
            onMouseDown={handleNodeMouseDown}
            data-type="node"
            data-adding={node.view.adding}
            data-node-id={node.id}
        >
            {mockNode && <ExecutionOrder mockNode={mockNode} centered={true} />}
            <Connector
                in
                nodeId={node.id}
                handle="a"
                iconClassName="text-white dark:text-white"
                className={`-translate-y-5 ${node.view.disabled && 'select-none opacity-0'}`}
                disabled={node.view.disabled}
                nodeVariableType={[
                    NodeVariableType.Int,
                    NodeVariableType.Float,
                    NodeVariableType.Number,
                    NodeVariableType.String,
                    NodeVariableType.TruePath
                ].join(',')}
            />
            <Connector
                in
                nodeId={node.id}
                handle="b"
                iconClassName="text-white dark:text-white"
                className={`translate-y-2 ${node.view.disabled && 'select-none opacity-0'}`}
                disabled={node.view.disabled}
                nodeVariableType={[
                    NodeVariableType.Int,
                    NodeVariableType.Float,
                    NodeVariableType.Number,
                    NodeVariableType.String,
                    NodeVariableType.TruePath
                ].join(',')}
            />

            {node.type === NodeComparisonType.LargerThan && (
                <ChevronRightIcon className={`w-10 h-10 ${node.view.disabled && 'opacity-0'}`} />
            )}

            {node.type === NodeComparisonType.SmallerThan && (
                <ChevronRightIcon className={`w-10 h-10 transform rotate-180 ${node.view.disabled && 'select-none opacity-0'}`} />
            )}

            {node.type === NodeComparisonType.Equal && (
                <Strong className={`text-white dark:text-white ${node.view.disabled && 'select-none opacity-0'}`}>==</Strong>
            )}

            {node.type === NodeComparisonType.NotEqual && (
                <Strong className={`text-white dark:text-white ${node.view.disabled && 'select-none opacity-0'}`}>!==</Strong>
            )}

            <Connector
                out
                nodeId={node.id}
                handle={NodeVariableType.TruePath}
                className={`-translate-y-5 ${node.view.disabled && 'select-none opacity-0'}`}
                disabled={node.view.disabled}
                nodeVariableType={[NodeVariableType.TruePath, NodeVariableType.Number, NodeVariableType.String].join(',')}
            />
            <Connector
                out
                nodeId={node.id}
                handle={NodeVariableType.FalsePath}
                className={`translate-y-2 ${node.view.disabled && 'select-none opacity-0'}`}
                disabled={node.view.disabled}
                nodeVariableType={[NodeVariableType.FalsePath, NodeVariableType.Number, NodeVariableType.String].join(',')}
            />
        </div>
    );
};

export default NodeComparison;
