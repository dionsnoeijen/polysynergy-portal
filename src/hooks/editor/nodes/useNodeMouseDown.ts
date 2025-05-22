import React, {useCallback} from "react";
import useEditorStore from "@/stores/editorStore";
import {EditorMode, Node as NodeType} from "@/types/types";
import useDraggable from "@/hooks/editor/nodes/useDraggable";

const useNodeMouseDown = (
    node: NodeType,
    isInService?: boolean
) => {

    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const setSelectedNodes = useEditorStore((state) => state.setSelectedNodes);

    const { onDragMouseDown } = useDraggable();

    const handleNodeMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (node.view.disabled) return;
            const editorMode = useEditorStore.getState().editorMode;
            if (editorMode !== EditorMode.Select) return;

            const isToggleClick = (e.target as HTMLElement)
                .closest("button[data-toggle='true']");

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

            if (!isInService) {
                onDragMouseDown(e);
            }
        },
        [isInService, node, selectedNodes, setSelectedNodes, onDragMouseDown]
    );

    return { handleNodeMouseDown };
};

export default useNodeMouseDown;
