import { Node, NodeVariable, NodeVariableType } from "@/types/types";
import interpretNodeVariableType from "./interpretNodeVariableType";

/**
 * List of node paths that are known to generate or process images
 */
const IMAGE_NODE_PATHS = [
    'polysynergy_nodes.image.generate_image.GenerateImage',
    'polysynergy_nodes.image.crop_image.CropImage', 
    'polysynergy_nodes.image.resize_image.ResizeImage',
    'polysynergy_nodes.image.image_effects.ImageEffects',
    'polysynergy_nodes.qr.generate_qr_code.GenerateQRCode',
    // Add any future image nodes here
] as const;

/**
 * List of node categories that are image-related
 */
const IMAGE_NODE_CATEGORIES = [
    'image',
    'media',  // QR codes and other media that produce image outputs
] as const;

/**
 * Check if a node is an image node based on its path or category
 */
export function isImageNode(node: Node): boolean {
    // Check by path first (most specific)
    if (node.path && IMAGE_NODE_PATHS.includes(node.path as unknown as (typeof IMAGE_NODE_PATHS)[number])) {
        return true;
    }
    
    // Check by category (broader check)
    if (node.category && IMAGE_NODE_CATEGORIES.includes(node.category as unknown as (typeof IMAGE_NODE_CATEGORIES)[number])) {
        return true;
    }
    
    return false;
}

/**
 * Check if a node variable is meant to hold Image data
 */
export function isImageVariable(variable: NodeVariable): boolean {
    const interpretedType = interpretNodeVariableType(variable);
    
    // Check if the base type is Image or Avatar
    if (interpretedType.baseType === NodeVariableType.Image || 
        interpretedType.baseType === NodeVariableType.Avatar) {
        return true;
    }
    
    // Check if the variable type string contains 'Image' 
    if (variable.type && variable.type.toLowerCase().includes('image')) {
        return true;
    }
    
    // Check dock configuration for image handling
    if (variable.dock?.image) {
        return true;
    }
    
    return false;
}

/**
 * Check if a value contains Image-like data structure
 */
export function isImageLikeValue(value: unknown): boolean {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    
    const obj = value as Record<string, unknown>;
    
    // Check for the typical Image object structure
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

/**
 * Check if a node variable should be updated from execution results
 * Only returns true for Image variables in Image nodes
 */
export function shouldUpdateVariableFromExecution(node: Node, variable: NodeVariable, executionValue: unknown): boolean {
    // Only update if this is an image node
    if (!isImageNode(node)) {
        return false;
    }
    
    // Only update if this is an image variable
    if (!isImageVariable(variable)) {
        return false;
    }
    
    // Only update if the execution value looks like image data
    if (!isImageLikeValue(executionValue)) {
        return false;
    }
    
    return true;
}

/**
 * Get a list of variable handles that should be updated for a given node from execution results
 */
export function getUpdatableVariableHandles(node: Node, executionResults: Record<string, unknown>): string[] {
    if (!isImageNode(node)) {
        return [];
    }
    
    const updatableHandles: string[] = [];
    
    Object.entries(executionResults).forEach(([variableHandle, value]) => {
        const variable = node.variables.find(v => v.handle === variableHandle);
        if (variable && shouldUpdateVariableFromExecution(node, variable, value)) {
            updatableHandles.push(variableHandle);
        }
    });
    
    return updatableHandles;
}