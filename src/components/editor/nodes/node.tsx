import React from "react";
import { Node as NodeStore, NodeType } from "@/types/types";
import NodeRows from "@/components/editor/nodes/node-rows";
import NodeComparison from "@/components/editor/nodes/node-comparison";
import NodeMath from "@/components/editor/nodes/node-math";
import ClosedGroup from "@/components/editor/nodes/closed-group";

type NodeProps = {
    node: NodeStore;
};

const Node: React.FC<NodeProps> = ({ node }) => {
    switch (node.category) {
        case NodeType.Comparison:
            return <NodeComparison node={node} />;
        case NodeType.Math:
            return <NodeMath node={node} />;
        case NodeType.Group:
            return <ClosedGroup node={node} />;
        default:
            return <NodeRows node={node} />;
    }
};

export default Node;
