import React, { useCallback } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { Node as NodeType } from "@/types/types";
import useDraggable from "@/hooks/editor/nodes/useDraggable";

const useNodeMouseDown = (node: NodeType) => {
    const { selectedNodes, setSelectedNodes } = useEditorStore();
    const { onDragMouseDown } = useDraggable();

    const handleNodeMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (node.view.disabled) return;

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

            onDragMouseDown(e);
        },
        [node, selectedNodes, setSelectedNodes, onDragMouseDown]
    );

    return { handleNodeMouseDown };
};

export default useNodeMouseDown;
