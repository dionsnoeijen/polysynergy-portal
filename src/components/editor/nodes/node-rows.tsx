import React from "react";
import {NodeProps} from "@/types/types";
import {useNodeCommonLogic} from "@/hooks/editor/nodes/useNodeCommonLogic";
import {useNodeStyling} from "@/hooks/editor/nodes/useNodeStyling";
import {useNodeInteractions} from "@/hooks/editor/nodes/useNodeInteractions";
import useResizable from "@/hooks/editor/nodes/useResizable";
import NodeContainer from "@/components/editor/nodes/node-container";
import ExpandedNode from "@/components/editor/nodes/expanded-node";
import CollapsedNode from "@/components/editor/nodes/collapsed-node";

const NodeRows: React.FC<NodeProps> = ({node, preview = false}) => {
    // Extract all shared logic into custom hooks
    const commonLogic = useNodeCommonLogic(node, preview);
    const styles = useNodeStyling(node, commonLogic);
    const interactions = useNodeInteractions(node, commonLogic.isNodeInService, preview);
    const {handleResizeMouseDown} = useResizable(node);

    // Handle double-click for collapsible nodes
    const handleDoubleClick = commonLogic.isCollapsable ? interactions.onCollapse : undefined;

    return (
        <NodeContainer
            node={node}
            preview={preview}
            className={styles.container}
            onContextMenu={interactions.onContextMenu}
            onMouseDown={interactions.onMouseDown}
            onDoubleClick={handleDoubleClick}
            shouldSuspendRendering={commonLogic.shouldSuspendRendering}
            isCollapsed={node.view.collapsed}
        >
            {node.view.collapsed ? (
                <CollapsedNode
                    node={node}
                    mockNode={commonLogic.mockNode}
                    styles={styles}
                    onCollapse={interactions.onCollapse}
                />
            ) : (
                <ExpandedNode
                    node={node}
                    preview={preview}
                    mockNode={commonLogic.mockNode}
                    styles={styles}
                    isCollapsable={commonLogic.isCollapsable}
                    onCollapse={interactions.onCollapse}
                    onResizeMouseDown={handleResizeMouseDown}
                />
            )}
        </NodeContainer>
    );
};

export default NodeRows;