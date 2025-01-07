import { NodeVariableType } from "@/types/types";

export function interpretNodeVariableType(type: string): { baseType: NodeVariableType; containsNone: boolean } {
    const types = type.split('|');
    const containsNone = types.includes('None');

    if (types.includes('int') || types.includes('float')) {
        return { baseType: NodeVariableType.Number, containsNone };
    } else if (types.includes('str')) {
        return {baseType: NodeVariableType.String, containsNone};
    } else if (types.includes('bytes')) {
        return { baseType: NodeVariableType.Bytes, containsNone };
    } else if (types.includes('bool')) {
        return { baseType: NodeVariableType.Boolean, containsNone };
    } else if (types.includes('dict')) {
        return { baseType: NodeVariableType.Dict, containsNone };
    } else if (types.includes('list')) {
        return { baseType: NodeVariableType.List, containsNone };
    } else if (types.includes('datetime')) {
        return { baseType: NodeVariableType.DateTime, containsNone };
    } else if (types.includes('true_path')) {
        return { baseType: NodeVariableType.TruePath, containsNone };
    } else if (types.includes('false_path')) {
        return { baseType: NodeVariableType.FalsePath, containsNone };
    }

    return { baseType: NodeVariableType.Unknown, containsNone };
}