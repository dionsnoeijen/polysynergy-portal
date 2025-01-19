import { Node as NodeType, NodeComparisonType, NodeVariableType } from "@/types/types";
import React from "react";
import useEditorStore from "@/stores/editorStore";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Connector from "@/components/editor/nodes/connector";
import { Strong } from "@/components/text";
import useNodeMouseDown from "@/hooks/editor/nodes/useNodeMouseDown";
import useNodeContextMenu from "@/hooks/editor/nodes/useNodeContextMenu";
import useNodePlacement from "@/hooks/editor/nodes/useNodePlacement";

type NodeProps = {
    node: NodeType;
};

const NodeComparison: React.FC<NodeProps> = ({ node }) => {
    const { selectedNodes } = useEditorStore();
    const { handleNodeMouseDown } = useNodeMouseDown(node);
    const { handleContextMenu } = useNodeContextMenu(node);
    const position = useNodePlacement(node);

    return (
        <div
            className={`absolute select-none flex items-center justify-center ring-2 bg-orange-400/60 backdrop-blur-lg backdrop-opacity-60 rounded-[50%] ${
                selectedNodes.includes(node.id) ? "ring-white shadow-2xl" : "ring-orange-200/90 shadow-sm"
            } ${node.view.disabled ? 'z-1 select-none opacity-30' : 'z-20 cursor-move'}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `50px`,
                height: `50px`,
            }}
            onContextMenu={handleContextMenu}
            onMouseDown={handleNodeMouseDown}
            data-type="node"
            data-node-id={node.id}
        >
            <Connector
                in
                nodeId={node.id}
                handle="a"
                iconClassName="text-white dark:text-white"
                className={`-translate-y-5 ring-orange-200/50 bg-orange-400 dark:bg-orange-400 ${node.view.disabled && 'select-none opacity-0'}`}
                disabled={node.view.disabled}
            />
            <Connector
                in
                nodeId={node.id}
                handle="b"
                iconClassName="text-white dark:text-white"
                className={`translate-y-2 ring-orange-200/50 bg-orange-400 dark:bg-orange-400 ${node.view.disabled && 'select-none opacity-0'}`}
                disabled={node.view.disabled}
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
                handle="true"
                className={`-translate-y-5 ${node.view.disabled && 'select-none opacity-0'}`}
                disabled={node.view.disabled}
                nodeVariableType={NodeVariableType.TruePath}
            />
            <Connector
                out
                nodeId={node.id}
                handle="false"
                className={`translate-y-2 ${node.view.disabled && 'select-none opacity-0'}`}
                disabled={node.view.disabled}
                nodeVariableType={NodeVariableType.FalsePath}
            />
        </div>
    );
};

export default NodeComparison;
