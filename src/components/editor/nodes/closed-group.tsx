import React from "react";
import {GroupProps} from "@/types/types";
import {useGroupCommonLogic} from "@/hooks/editor/nodes/useGroupCommonLogic";
import {useGroupStyling} from "@/hooks/editor/nodes/useGroupStyling";
import {useGroupInteractions} from "@/hooks/editor/nodes/useGroupInteractions";
import {useSourceNodeWarpGateHighlight} from "@/hooks/editor/nodes/useSourceNodeWarpGateHighlight";
import useGrouping from "@/hooks/editor/nodes/useGrouping";
import GroupContainer from "@/components/editor/nodes/group-container";
import ExpandedGroup from "@/components/editor/nodes/expanded-group";
import CollapsedGroup from "@/components/editor/nodes/collapsed-group";

const ClosedGroup: React.FC<GroupProps> = ({
    node,
    isMirror = false,
    preview = false
}) => {
    // Extract all shared logic into custom hooks
    const commonLogic = useGroupCommonLogic(node, isMirror, preview);
    const styles = useGroupStyling(node, commonLogic);
    const interactions = useGroupInteractions(
        node,
        commonLogic.groupId,
        commonLogic.selectedNodes,
        commonLogic.nodeToMoveToGroupId,
        preview
    );

    const {dissolveGroup} = useGrouping();

    // Highlight warp gates when this group is selected
    const isSelected = commonLogic.selectedNodes.includes(node.id);
    useSourceNodeWarpGateHighlight(node.id, isSelected);

    // Handle dissolve confirmation
    const handleConfirmDissolve = () => {
        dissolveGroup(node.id);
        commonLogic.setIsDissolveDialogOpen(false);
    };

    return (
        <GroupContainer
            node={node}
            isMirror={isMirror}
            preview={preview}
            className={styles.container}
            onContextMenu={interactions.onContextMenu}
            onMouseDown={interactions.onMouseDown}
            onDoubleClick={interactions.onDoubleClick}
            shouldSuspendRendering={commonLogic.shouldSuspendRendering}
            isCollapsed={node.view.collapsed}
            isPanning={commonLogic.isPanning}
            isZooming={commonLogic.isZooming}
        >
            {node.view.collapsed ? (
                <CollapsedGroup
                    node={node}
                    styles={styles}
                    onCollapse={interactions.onCollapse}
                    isDissolveDialogOpen={commonLogic.isDissolveDialogOpen}
                    setIsDissolveDialogOpen={commonLogic.setIsDissolveDialogOpen}
                    onConfirmDissolve={handleConfirmDissolve}
                />
            ) : (
                <ExpandedGroup
                    node={node}
                    preview={preview}
                    isMirror={isMirror}
                    styles={styles}
                    variablesForGroup={commonLogic.variablesForGroup}
                    onCollapse={interactions.onCollapse}
                    isDissolveDialogOpen={commonLogic.isDissolveDialogOpen}
                    setIsDissolveDialogOpen={commonLogic.setIsDissolveDialogOpen}
                    onConfirmDissolve={handleConfirmDissolve}
                />
            )}
        </GroupContainer>
    );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(ClosedGroup, (prevProps, nextProps) => {
    return prevProps.node === nextProps.node && prevProps.preview === nextProps.preview;
});