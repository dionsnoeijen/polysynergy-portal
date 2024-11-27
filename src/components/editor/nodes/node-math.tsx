import { Node as NodeType, NodeMathType } from "@/stores/nodesStore";
import React from "react";
import { useEditorStore } from "@/stores/editorStore";
import Connector from "@/components/editor/nodes/connector";
import useDraggable from "@/hooks/editor/nodes/useDraggable";
import { Strong } from "@/components/text";

type NodeProps = {
    node: NodeType;
};

const NodeMath: React.FC<NodeProps> = ({ node }) => {
    const { selectedNodes, setSelectedNodes } = useEditorStore();
    const { onDragMouseDown } = useDraggable({ collisionThreshold: 50 });

    const handleNodeMouseDown = (e: React.MouseEvent) => {
        const isToggleClick = (e.target as HTMLElement).closest("button[data-toggle='true']");
        if (isToggleClick) return;

        e.preventDefault();

        if (e.ctrlKey) {
            if (selectedNodes.includes(node.id)) {
                setSelectedNodes(selectedNodes.filter((id) => id !== node.id));
            } else {
                setSelectedNodes([...selectedNodes, node.id]);
            }
            return;
        }

        if (e.shiftKey) {
            if (!selectedNodes.includes(node.id)) {
                setSelectedNodes([...selectedNodes, node.id]);
            }
            return;
        }

        if (!selectedNodes.includes(node.id)) {
            setSelectedNodes([node.id]);
        }

        onDragMouseDown();
    };

    return (
        <div
            className={`absolute z-10 select-none flex items-center justify-center ring-2 bg-blue-400/60 backdrop-blur-lg backdrop-opacity-60 rounded-[50%] ${
                selectedNodes.includes(node.id) ? "ring-white shadow-2xl" : "ring-blue-200/90 shadow-sm"
            }`}
            style={{
                left: `${node.view.x}px`,
                top: `${node.view.y}px`,
                width: `50px`,
                height: `50px`,
            }}
            onMouseDown={handleNodeMouseDown}
            data-type="node"
            data-node-id={node.id}
        >
            <Connector
                in
                nodeId={node.id}
                handle="a"
                iconClassName="text-white dark:text-white"
                className="-translate-y-5 ring-blue-200/50 bg-blue-400 dark:bg-blue-400"
            />
            <Connector
                in
                nodeId={node.id}
                handle="b"
                iconClassName="text-white dark:text-white"
                className="translate-y-2 ring-blue-200/50 bg-blue-400 dark:bg-blue-400"
            />

            {/* Node inhoud */}
            {node.type === NodeMathType.Add && (
                <Strong className="text-white dark:text-white">+</Strong>
            )}
            {node.type === NodeMathType.Subtract && (
                <Strong className="text-white dark:text-white">-</Strong>
            )}
            {node.type === NodeMathType.Multiply && (
                <Strong className="text-white dark:text-white">×</Strong>
            )}
            {node.type === NodeMathType.Divide && (
                <Strong className="text-white dark:text-white">÷</Strong>
            )}

            <Connector
                out
                nodeId={node.id}
                handle="result"
                iconClassName="text-white dark:text-white"
                className="ring-blue-200/50 bg-green-400 dark:bg-green-400"
            />
        </div>
    );
};

export default NodeMath;
