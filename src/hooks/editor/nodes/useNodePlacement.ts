import { useState, useEffect } from "react";
import { Node as NodeType } from "@/types/types";
import { globalToLocal } from "@/utils/positionUtils";
import useNodesStore from "@/stores/nodesStore";
import {snapToGrid} from "@/utils/snapToGrid";

const useNodePlacement = (node: NodeType) => {
    const { updateNodePosition, setAddingStatus } = useNodesStore();
    const [position, setPosition] = useState({ x: node.view.x, y: node.view.y });

    useEffect(() => {
        if (!node.view.adding) return;

        const handleMouseMove = (e: MouseEvent) => {
            setPosition(globalToLocal(e.clientX, e.clientY));
        };

        const handleMouseUp = () => {
            updateNodePosition(
                node.id,
                snapToGrid(position.x),
                snapToGrid(position.y)
            );
            setAddingStatus(node.id, false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    // eslint-disable-next-line
    }, [node.view.adding, position, updateNodePosition, setAddingStatus]);

    return position;
};

export default useNodePlacement;