import { Node, NodeVariable, NodeVariableType } from "@/types/types";

const findPublishedVariables = (nodes: Node[]) => {
    const variablesByHandle: { [handle: string]: { variables: NodeVariable[], nodeIds: string[] } } = {};
    const initialVariables: { [handle: string]: { [variableHandle: string]: NodeVariable[] } } = {};
    const initialSimpleVariables: { [handle: string]: { [variableHandle: string]: string } } = {};

    nodes.forEach((node: Node) => {
        if (!variablesByHandle[node.handle]) {
            variablesByHandle[node.handle] = { variables: [], nodeIds: [] };
            initialVariables[node.handle] = {};
            initialSimpleVariables[node.handle] = {};
        }
        variablesByHandle[node.handle].nodeIds.push(node.id);

        node.variables.forEach((variable) => {
            if (variable.published) {
                if (!variablesByHandle[node.handle].variables.some(v => v.handle === variable.handle)) {
                    variablesByHandle[node.handle].variables.push(variable);
                    if (variable.type === NodeVariableType.Dict) {
                        initialVariables[node.handle][variable.handle] = (variable.value as NodeVariable[]) || [];
                    } else {
                        initialSimpleVariables[node.handle][variable.handle] = (variable.value as string) || "";
                    }
                }
            }
        });
    });

    return { initialVariables, initialSimpleVariables, variablesByHandle };
};

export default findPublishedVariables;