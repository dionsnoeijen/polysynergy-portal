import {NodeVariable, NodeVariableType} from "@/types/types";

export function interpretNodeVariableType(variable: NodeVariable): { baseType: NodeVariableType; containsNone: boolean } {
    const types = variable.type.split('|').map((type) => type.trim());
    const containsNone = types.includes('None');

    if (types.includes('int') || types.includes('float') || types.includes('number')) {
        return { baseType: NodeVariableType.Number, containsNone };
    } else if (types.includes('str')) {
        if (variable.dock) {
            if (variable?.dock.field_secret) {
                return {baseType: NodeVariableType.SecretString, containsNone};
            }
            if (variable?.dock.field_text_area) {
                return {baseType: NodeVariableType.TextArea, containsNone};
            }
            if (variable?.dock.field_rich_text_area) {
                return {baseType: NodeVariableType.RichTextArea, containsNone};
            }
            if (variable?.dock.field_code_editor) {
                return {baseType: NodeVariableType.Code, containsNone};
            }
        }
        return { baseType: NodeVariableType.String, containsNone };
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