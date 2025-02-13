import React from "react";
import { NodeProps, NodeType } from "@/types/types";
import NodeRows from "@/components/editor/nodes/node-rows";
import NodeComparison from "@/components/editor/nodes/node-comparison";
import NodeMath from "@/components/editor/nodes/node-math";
import ClosedGroup from "@/components/editor/nodes/closed-group";
import NodeJump from "@/components/editor/nodes/node-jump";

const Node: React.FC<NodeProps> = ({ node, preview = false }) => {
    switch (node.category) {
        case NodeType.Comparison:
            return <NodeComparison node={node} preview={preview} />;
        case NodeType.Math:
            return <NodeMath node={node} preview={preview} />;
        case NodeType.Group:
            return <ClosedGroup node={node} preview={preview} />;
        case NodeType.Jump:
            return <NodeJump node={node} preview={preview} />;
        default:
            return <NodeRows node={node} preview={preview} />;
    }
};

export default Node;
