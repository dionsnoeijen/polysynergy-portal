import { v4 as uuidv4 } from "uuid";
import { Node } from "@/types/types";

export const addIdsToAvailableNodes = (nodes: Node[]): Node[] => {
    return nodes.map((node: Node) => ({
        ...node,
        id: node.id || uuidv4()
    }));
};