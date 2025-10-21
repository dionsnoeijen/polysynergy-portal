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

    // Check for Image objects in the variable value first (runtime detection)
    if (variable.value && typeof variable.value === 'object' && !Array.isArray(variable.value)) {
        const valueObj = variable.value as Record<string, unknown>;
        if (isImageLikeObject(valueObj)) {
            return { baseType: NodeVariableType.Image, validationType: [...types, NodeVariableType.Image].join(','), containsNone };
        }
    }

    if ((variable.metadata as { custom?: string })?.custom === 'openai_avatar') {
        return { baseType: NodeVariableType.Avatar, validationType: NodeVariableType.Avatar, containsNone };
    }

    // Check for OAuth authorization button metadata
    if ((variable.metadata as { button?: string })?.button === 'oauth_authorize') {
        return { baseType: NodeVariableType.OAuth, validationType: NodeVariableType.OAuth, containsNone };
    }

    if (types.includes('any')) {
        return { baseType: NodeVariableType.Any, validationType: types.join(','), containsNone };
    } else if (types.includes('true_path')) {
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
                return { baseType: NodeVariableType.Code, validationType: [...types, NodeVariableType.Code].join(','), containsNone};
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
    } else if (types.some(type => type.toLowerCase() === 'image')) {
        return { baseType: NodeVariableType.Image, validationType: types.join(','), containsNone };
    } else if (types.includes('dict')) {
        if (variable?.dock && variable?.dock?.image) {
            return { baseType: NodeVariableType.Image, validationType: [...types, NodeVariableType.Image].join(','), containsNone }
        }
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
    } else if (types.some((type) => type.includes('.') && /^[a-z_][\w.]+$/.test(type))) {
        return { baseType: NodeVariableType.Dependency, validationType: types.join(','), containsNone };
    }

    return { baseType: NodeVariableType.Unknown, validationType: types.join(','), containsNone };
}

/**
 * Checks if an object has the structure of an Image object commonly produced by execution results
 * This helps with runtime type detection when variables contain Image objects
 */
function isImageLikeObject(obj: Record<string, unknown>): boolean {
    // Check for the specific pattern mentioned in the error: {url, mime_type, width, height, size, metadata}
    const hasImageStructure = (
        'url' in obj ||
        'src' in obj ||
        'data' in obj ||
        'base64' in obj
    ) && (
        'mime_type' in obj ||
        'mimetype' in obj ||
        'width' in obj ||
        'height' in obj ||
        'size' in obj
    );
    
    // Also check for common image property combinations
    const hasImageProperties = (
        ('url' in obj || 'src' in obj) &&
        ('width' in obj || 'height' in obj)
    );
    
    return hasImageStructure || hasImageProperties;
}