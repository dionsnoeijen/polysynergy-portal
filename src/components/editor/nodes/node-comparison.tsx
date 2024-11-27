import { Node as NodeType, NodeComparisonType } from "@/stores/nodesStore";
import React from "react";
import { useEditorStore } from "@/stores/editorStore";
import { ChevronRightIcon } from "@heroicons/react/16/solid";
import Connector from "@/components/editor/nodes/connector";
import useDraggable from "@/hooks/editor/nodes/useDraggable";
import { Strong } from "@/components/text";

type NodeProps = {
    node: NodeType;
};

const NodeComparison: React.FC<NodeProps> = ({ node }) => {
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
            className={`absolute z-10 select-none flex items-center justify-center ring-2 bg-orange-400/60 backdrop-blur-lg backdrop-opacity-60 rounded-[50%] ${
                selectedNodes.includes(node.id) ? "ring-white shadow-2xl" : "ring-orange-200/90 shadow-sm"
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
            <Connector in nodeId={node.id} handle="a" iconClassName="text-white dark:text-white" className="-translate-y-5 ring-orange-200/50 bg-orange-400 dark:bg-orange-400" />
            <Connector in nodeId={node.id} handle="b" iconClassName="text-white dark:text-white" className="translate-y-2 ring-orange-200/50 bg-orange-400 dark:bg-orange-400" />

            {node.type === NodeComparisonType.LargerThan && (
                <ChevronRightIcon className={`w-10 h-10`} />
            )}

            {node.type === NodeComparisonType.SmallerThan && (
                <ChevronRightIcon className={`w-10 h-10 transform rotate-180`} />
            )}

            {node.type === NodeComparisonType.Equal && (
                <Strong className="text-white dark:text-white">==</Strong>
            )}

            {node.type === NodeComparisonType.NotEqual && (
                <Strong className="text-white dark:text-white">!==</Strong>
            )}

            <Connector out nodeId={node.id} handle="true" iconClassName="text-white dark:text-white" className="-translate-y-5 ring-orange-200/50 bg-green-400 dark:bg-green-400" />
            <Connector out nodeId={node.id} handle="false" iconClassName="text-white dark:text-white" className="translate-y-2 ring-orange-200/50 bg-red-400 dark:bg-red-400" />
        </div>
    );
};

export default NodeComparison;
