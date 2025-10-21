import React, {useCallback} from "react";
import useEditorStore from "@/stores/editorStore";
import {EditorMode, Node as NodeType} from "@/types/types";
import useDraggable from "@/hooks/editor/nodes/useDraggable";

const useNodeMouseDown = (
    node: NodeType,
    isInService?: boolean
) => {

    // Use stable refs instead of subscribing to state
    // This prevents the callback from being recreated on every selection change
    const getSelectedNodes = useCallback(() => useEditorStore.getState().selectedNodes, []);
    const setSelectedNodes = useCallback((nodes: string[]) => useEditorStore.getState().setSelectedNodes(nodes), []);

    const { onDragMouseDown } = useDraggable();

    const handleNodeMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (node.view.disabled) {
                return;
            }

            // Disable node selection during execution
            const isExecuting = useEditorStore.getState().isExecuting;
            if (isExecuting) {
                return;
            }

            const editorMode = useEditorStore.getState().editorMode;
            if (editorMode !== EditorMode.Select) {
                return;
            }

            const isToggleClick = (e.target as HTMLElement)
                .closest("button[data-toggle='true']");

            if (isToggleClick) {
                return;
            }

            e.preventDefault();

            // Get fresh selectedNodes value
            const selectedNodes = getSelectedNodes();

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

            if (!isInService) {
                onDragMouseDown(e);
            }
        },
        [isInService, node.id, node.view.disabled, getSelectedNodes, setSelectedNodes, onDragMouseDown]
    );

    return { handleNodeMouseDown };
};

export default useNodeMouseDown;
