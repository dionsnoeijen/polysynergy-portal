import { Node, NodeVariable } from "@/types/types";

const findPublishedVariables = (nodes: Node[]): { [nodeId: string]: NodeVariable[] } => {
    const result: { [nodeId: string]: NodeVariable[] } = {};
    
    nodes.forEach(node => {
        result[node.id] = node.variables.filter(variable => variable.published);
    });
    
    return result;
};

export default findPublishedVariables;