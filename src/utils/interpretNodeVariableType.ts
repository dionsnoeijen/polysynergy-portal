import {NodeVariable, NodeVariableType} from "@/types/types";

type ValidationType = {
    baseType: NodeVariableType;
    validationType: string;
    containsNone: boolean;
}

export default function interpretNodeVariableType(variable: NodeVariable): ValidationType {
    const types = variable.type.split('|').map((type) => type.trim());

    const containsNone = types.includes('None');
    if (types.indexOf('None') > -1) {
        types.splice(types.indexOf('None'), 1);
    }

    if ((variable.metadata as { custom?: string })?.custom === 'openai_avatar') {
        return { baseType: NodeVariableType.Avatar, validationType: NodeVariableType.Avatar, containsNone };
    }

    if (types.includes('true_path')) {
        return { baseType: NodeVariableType.TruePath, validationType: types.join(','), containsNone };
    } else if (types.includes('false_path')) {
        return { baseType: NodeVariableType.FalsePath, validationType: types.join(','), containsNone };
    } else if (types.includes('node')) {
        return { baseType: NodeVariableType.Node, validationType: [...types, NodeVariableType.TruePath].join(','), containsNone };
    } else if (types.includes('str') || types.includes('string')) {
        if (variable.dock) {
            if (variable?.dock.secret) {
                return { baseType: NodeVariableType.SecretString, validationType: NodeVariableType.SecretString, containsNone};
            }
            if (variable?.dock.text_area) {
                return { baseType: NodeVariableType.TextArea, validationType: [...types, NodeVariableType.TextArea].join(','), containsNone};
            }
            if (variable?.dock.rich_text_area) {
                return { baseType: NodeVariableType.RichTextArea, validationType: [...types, NodeVariableType.RichTextArea].join(','), containsNone};
            }
            if (variable?.dock.template_editor) {
                return { baseType: NodeVariableType.Template, validationType: [...types, NodeVariableType.String].join(','), containsNone};
            }
            if (variable?.dock.code_editor) {
                return { baseType: NodeVariableType.Code, validationType: NodeVariableType.Code, containsNone};
            }
            if (variable?.dock.json_editor) {
                return { baseType: NodeVariableType.Json, validationType: [...types, NodeVariableType.Json].join(','), containsNone};
            }
        }
        return { baseType: NodeVariableType.String, validationType: types.join(','), containsNone};
    } else if (types.includes('int') || types.includes('float') || types.includes('number')) {
        return { baseType: NodeVariableType.Number, validationType: types.join(','), containsNone };
    } else if (types.includes('bytes')) {
        return { baseType: NodeVariableType.Bytes, validationType: types.join(','), containsNone };
    } else if (types.includes('dict')) {
        return { baseType: NodeVariableType.Dict, validationType: types.join(','), containsNone };
    } else if (types.includes('list')) {
        if (variable?.dock && variable?.dock?.files_editor) {
            return { baseType: NodeVariableType.Files, validationType: [...types, NodeVariableType.Files].join(','), containsNone }
        }
        return { baseType: NodeVariableType.List, validationType: types.join(','), containsNone };
    } else if (types.includes('datetime')) {
        return { baseType: NodeVariableType.DateTime, validationType: types.join(','), containsNone };
    } else if (types.includes('bool')) {
        return { baseType: NodeVariableType.Boolean, validationType: types.join(','), containsNone };
    } else if (types.some((type) => type.startsWith('polysynergy_nodes'))) {
        return { baseType: NodeVariableType.Dependency, validationType: types.join(','), containsNone };
    }

    return { baseType: NodeVariableType.Unknown, validationType: types.join(','), containsNone };
}