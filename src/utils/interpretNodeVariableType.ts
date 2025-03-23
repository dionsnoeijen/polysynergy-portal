import {NodeVariable, NodeVariableType} from "@/types/types";

export default function interpretNodeVariableType(variable: NodeVariable): {
    baseType: NodeVariableType;
    validationType: string;
    containsNone: boolean;
} {
    const types = variable.type.split('|').map((type) => type.trim());
    const containsNone = types.includes('None');
    if (types.indexOf('None') > -1) {
        types.splice(types.indexOf('None'), 1);
    }

    if (types.includes('true_path')) {
        return { baseType: NodeVariableType.TruePath, validationType: types.join(','), containsNone };
    } else if (types.includes('false_path')) {
        return { baseType: NodeVariableType.FalsePath, validationType: types.join(','), containsNone };
    } else if (types.includes('str') || types.includes('string')) {
        if (variable.dock) {
            if (variable?.dock.secret) {
                return { baseType: NodeVariableType.SecretString, validationType: NodeVariableType.SecretString, containsNone};
            }
            if (variable?.dock.text_area) {
                return { baseType: NodeVariableType.TextArea, validationType: [NodeVariableType.TextArea, NodeVariableType.String].join(','), containsNone};
            }
            if (variable?.dock.rich_text_area) {
                return { baseType: NodeVariableType.RichTextArea, validationType: [NodeVariableType.RichTextArea, NodeVariableType.String].join(','), containsNone};
            }
            if (variable?.dock.code_editor) {
                return { baseType: NodeVariableType.Code, validationType: NodeVariableType.Code, containsNone};
            }
            if (variable?.dock.json_editor) {
                return { baseType: NodeVariableType.Json, validationType: [NodeVariableType.Json, NodeVariableType.String].join(','), containsNone};
            }
        }
        return { baseType: NodeVariableType.String, validationType: types.join(','), containsNone};
    } else if (types.includes('int') || types.includes('float') || types.includes('number')) {
        return { baseType: NodeVariableType.Number, validationType: NodeVariableType.Number, containsNone };
    } else if (types.includes('bytes')) {
        return { baseType: NodeVariableType.Bytes, validationType: [NodeVariableType.Bytes, NodeVariableType.String].join(','), containsNone };
    } else if (types.includes('dict')) {
        return { baseType: NodeVariableType.Dict, validationType: NodeVariableType.Dict, containsNone };
    } else if (types.includes('list')) {
        if (variable?.dock && variable?.dock?.files_editor) {
            return { baseType: NodeVariableType.Files, validationType: [NodeVariableType.Files, NodeVariableType.List].join(','), containsNone }
        }
        return { baseType: NodeVariableType.List, validationType: [NodeVariableType.List, NodeVariableType.Json], containsNone };
    } else if (types.includes('datetime')) {
        return { baseType: NodeVariableType.DateTime, validationType: NodeVariableType.DateTime, containsNone };
    } else if (types.includes('bool')) {
        return { baseType: NodeVariableType.Boolean, validationType: NodeVariableType.Boolean, containsNone };
    } else if (types.some((type) => type.startsWith('nodes.nodes'))) {
        return { baseType: NodeVariableType.Dependency, validationType: NodeVariableType.Dependency, containsNone };
    }

    return { baseType: NodeVariableType.Unknown, validationType: NodeVariableType.Unknown, containsNone };
}