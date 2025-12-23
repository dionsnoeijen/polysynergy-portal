import React, {useMemo} from "react";
import {NodeProps} from "@/types/types";
import {useNodeCommonLogic} from "@/hooks/editor/nodes/useNodeCommonLogic";
import {useNodeStyling} from "@/hooks/editor/nodes/useNodeStyling";
import {useNodeInteractions} from "@/hooks/editor/nodes/useNodeInteractions";
import useResizable from "@/hooks/editor/nodes/useResizable";
import {useSourceNodeWarpGateHighlight} from "@/hooks/editor/nodes/useSourceNodeWarpGateHighlight";
import useEditorStore from "@/stores/editorStore";
import NodeContainer from "@/components/editor/nodes/node-container";
import ExpandedNode from "@/components/editor/nodes/expanded-node";
import CollapsedNode from "@/components/editor/nodes/collapsed-node";

const NodeRows: React.FC<NodeProps> = ({node, preview = false}) => {
    // Extract all shared logic into custom hooks
    const commonLogic = useNodeCommonLogic(node, preview);
    const styles = useNodeStyling(node, commonLogic);
    const interactions = useNodeInteractions(node, commonLogic.isNodeInService, preview);
    const {handleResizeMouseDown, handleCornerResizeMouseDown} = useResizable(node);

    // Check if this node has an iframe viewer (supports height resize)
    const hasIframeViewer = useMemo(() => {
        return node.variables.some(v => v.dock?.iframe_viewer === true);
    }, [node.variables]);

    // Use corner resize for iframe nodes, width-only resize for others
    const resizeHandler = hasIframeViewer ? handleCornerResizeMouseDown : handleResizeMouseDown;

    // Highlight warp gates when this node is selected
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const isSelected = selectedNodes.includes(node.id);
    useSourceNodeWarpGateHighlight(node.id, isSelected);

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
                    mockNode={commonLogic.mockNode || null}
                    styles={styles}
                    onCollapse={interactions.onCollapse}
                />
            ) : (
                <ExpandedNode
                    node={node}
                    preview={preview}
                    mockNode={commonLogic.mockNode || null}
                    styles={styles}
                    isCollapsable={commonLogic.isCollapsable}
                    onCollapse={interactions.onCollapse}
                    onResizeMouseDown={resizeHandler}
                />
            )}
        </NodeContainer>
    );
};

// Memoize to prevent unnecessary re-renders when other nodes change
export default React.memo(NodeRows, (prevProps, nextProps) => {
    return prevProps.node === nextProps.node && prevProps.preview === nextProps.preview;
});