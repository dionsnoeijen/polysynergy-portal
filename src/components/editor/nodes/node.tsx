import React, { memo } from "react";
import {NodeJumpType, NodeProps, NodeType} from "@/types/types";
import NodeComparison from "@/components/editor/nodes/node-comparison";
import NodeMath from "@/components/editor/nodes/node-math";
import ClosedGroup from "@/components/editor/nodes/closed-group";
import NodeJump from "@/components/editor/nodes/node-jump";
import NodeRows from "@/components/editor/nodes/node-rows";

const Node: React.FC<NodeProps> = ({ node, preview = false }) => {

    if (node.category === NodeType.Jump && node.type === NodeJumpType.To) {
        return <NodeJump node={node} preview={preview} />;
    }

    switch (node.category) {
        case NodeType.Comparison:
            return <NodeComparison node={node} preview={preview} />;
        case NodeType.Math:
            return <NodeMath node={node} preview={preview} />;
        case NodeType.Group:
            return <ClosedGroup node={node} preview={preview} />;
        default:
            return <NodeRows node={node} preview={preview} />;
    }
};

// Memoize to prevent unnecessary re-renders when other nodes change
export default memo(Node, (prevProps, nextProps) => {
    // Only re-render if the node object reference changed or preview changed
    return prevProps.node === nextProps.node && prevProps.preview === nextProps.preview;
});
