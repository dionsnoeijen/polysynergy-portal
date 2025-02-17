import {RefObject, useEffect, useRef} from "react";
import useNodesStore from "@/stores/nodesStore";
import { Node } from "@/types/types";
import { snapToGrid } from "@/utils/snapToGrid";

const useAutoResize = (node: Node): RefObject<HTMLDivElement> => {
    const { updateNodeHeight } = useNodesStore();
    const ref = useRef<HTMLDivElement>(null);
    const lastHeight = useRef<number>(node.view.height);
    const getNodeVariableOpenState = useNodesStore((state) => state.getNodeVariableOpenState);

    useEffect(() => {
        if (!ref.current) return;
        const newHeight = snapToGrid(ref.current.getBoundingClientRect().height);
        if (newHeight !== lastHeight.current) {
            lastHeight.current = newHeight;
            updateNodeHeight(node.id, newHeight);
            // @todo: This does not work properly, it will resize heights to 20px
            // const nodeEl = document.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement;
            // if (nodeEl) {
            //     nodeEl.style.height = `${newHeight}px`;
            // }
        }
    }, [node.view.height, getNodeVariableOpenState, updateNodeHeight, node.id]);

    return ref;
};

export default useAutoResize;