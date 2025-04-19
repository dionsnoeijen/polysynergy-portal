import { NodeProps, NodeMathType } from "@/types/types";
import React from "react";
import useEditorStore from "@/stores/editorStore";
import Connector from "@/components/editor/nodes/connector";
import { Strong } from "@/components/text";
import useNodeMouseDown from "@/hooks/editor/nodes/useNodeMouseDown";
import useNodeContextMenu from "@/hooks/editor/nodes/useNodeContextMenu";
import useNodePlacement from "@/hooks/editor/nodes/useNodePlacement";
import useMockStore from "@/stores/mockStore";
import ExecutionOrder from "@/components/editor/nodes/execution-order";

const NodeMath: React.FC<NodeProps> = ({ node }) => {
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const { handleNodeMouseDown } = useNodeMouseDown(node);
    const { handleContextMenu } = useNodeContextMenu(node);
    const position = useNodePlacement(node);
    const mockNode = useMockStore((state) => state.getMockNode(node.id));

    return (
        <div
            className={`absolute select-none flex items-center justify-center ring-blue-300 bg-zinc-800 bg-opacity-50 backdrop-blur-lg backdrop-opacity-60 rounded-[50%] ${
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
                className={`-translate-y-5 ring-blue-200/50 bg-blue-400 dark:bg-blue-400 ${node.view.disabled && 'select-none opacity-0'}`}
                disabled={node.view.disabled}
            />
            <Connector
                in
                nodeId={node.id}
                handle="b"
                iconClassName="text-white dark:text-white"
                className={`translate-y-2 ring-blue-200/50 bg-blue-400 dark:bg-blue-400 ${node.view.disabled && 'select-none opacity-0'}`}
                disabled={node.view.disabled}
            />

            {node.type === NodeMathType.Add && (
                <Strong className={`text-white text-4xl dark:text-white -mt-1 ${node.view.disabled && 'select-none opacity-0'}`}>+</Strong>
            )}
            {node.type === NodeMathType.Subtract && (
                <Strong className={`text-white text-4xl dark:text-white -mt-1 ${node.view.disabled && 'select-none opacity-0'}`}>-</Strong>
            )}
            {node.type === NodeMathType.Multiply && (
                <Strong className={`text-white text-4xl dark:text-white -mt-1 ${node.view.disabled && 'select-none opacity-0'}`}>×</Strong>
            )}
            {node.type === NodeMathType.Divide && (
                <Strong className={`text-white text-4xl dark:text-white -mt-1 ${node.view.disabled && 'select-none opacity-0'}`}>÷</Strong>
            )}

            <Connector
                out
                nodeId={node.id}
                handle="result"
                iconClassName="text-white dark:text-white"
                className={`ring-blue-200/50 bg-green-400 dark:bg-green-400 ${node.view.disabled && 'select-none opacity-0'}`}
                disabled={node.view.disabled}
            />
        </div>
    );
};

export default NodeMath;
