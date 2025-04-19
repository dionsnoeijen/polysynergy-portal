import { useLayoutEffect, useRef } from "react";
import useNodesStore from "@/stores/nodesStore";
import { Node } from "@/types/types";
import { snapToGrid } from "@/utils/snapToGrid";

const useAutoResize = (node: Node) => {
    const updateNodeHeight = useNodesStore((state) => state.updateNodeHeight);

    const ref = useRef<HTMLDivElement>(null);
    const lastHeight = useRef<number>(node.view.height);  // Store the height without causing rerenders
    const getNodeVariableOpenState = useNodesStore((state) => state.getNodeVariableOpenState);

    useLayoutEffect(() => {
        if (!ref.current) return;
        const newHeight = snapToGrid(ref.current.getBoundingClientRect().height);

        if (newHeight !== lastHeight.current) {
            lastHeight.current = newHeight;
            updateNodeHeight(node.id, newHeight);
        }
    }, [node.view.height, getNodeVariableOpenState, updateNodeHeight, node.id]);

    return ref;
};

export default useAutoResize;