import { NodeVariable, NodeVariableType } from "@/types/types";

/**
 * Sanitizes execution result values to ensure they can be safely stored in React state
 * and rendered without causing `throwOnInvalidObjectType` errors.
 */
export const sanitizeExecutionValue = (
    value: unknown
): null | string | number | boolean | string[] | NodeVariable[] | Record<string, unknown> => {
    // Handle null/undefined
    if (value === null || value === undefined) {
        return null;
    }

    // Handle primitive types
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }

    // Handle arrays
    if (Array.isArray(value)) {
        // For string arrays
        if (value.every(item => typeof item === 'string')) {
            return value as string[];
        }

        // For NodeVariable arrays (dict/list structures)
        if (value.every(item => item && typeof item === 'object' && 'handle' in item)) {
            return value.map(item => sanitizeNodeVariable(item)) as NodeVariable[];
        }

        // For other arrays, convert to string array
        return value.map(item => sanitizeToString(item));
    }

    // Handle objects
    if (typeof value === 'object' && value !== null) {
        // Handle Image objects - keep as object, don't convert to string
        if (isImageObject(value)) {
            return sanitizeImageObjectAsObject(value);
        }

        // Handle NodeVariable objects
        if ('handle' in value && typeof value.handle === 'string') {
            return [sanitizeNodeVariable(value)];
        }

        // Handle plain objects - keep as object for dict types
        try {
            return sanitizeObjectForJson(value);
        } catch (error) {
            console.warn('Failed to sanitize object value, converting to string:', error);
            return { error: String(value) };
        }
    }

    // Fallback: convert to string
    return String(value);
};

/**
 * Sanitizes a NodeVariable object to ensure all nested values are React-safe
 */
const sanitizeNodeVariable = (variable: unknown): NodeVariable => {
    const obj = variable as Record<string, unknown>;
    
    return {
        handle: String(obj.handle || ''),
        name: obj.name ? String(obj.name) : undefined,
        value: sanitizeExecutionValue(obj.value),
        published: Boolean(obj.published),
        type: String(obj.type || NodeVariableType.String),
        published_title: obj.published_title ? String(obj.published_title) : undefined,
        published_description: obj.published_description ? String(obj.published_description) : undefined,
        group_name_override: obj.group_name_override ? String(obj.group_name_override) : undefined,
        group_connector_color_override: obj.group_connector_color_override ? String(obj.group_connector_color_override) : undefined,
        has_dock: Boolean(obj.has_dock),
        has_in: Boolean(obj.has_in),
        has_out: Boolean(obj.has_out),
        out_type_override: obj.out_type_override ? String(obj.out_type_override) : undefined,
        in_type_override: obj.in_type_override ? String(obj.in_type_override) : undefined,
        dock: obj.dock && typeof obj.dock === 'object' ? sanitizeObjectForJson(obj.dock) : undefined,
        node: Boolean(obj.node),
        metadata: obj.metadata && typeof obj.metadata === 'object' ? sanitizeObjectForJson(obj.metadata) : undefined,
    };
};

/**
 * Checks if an object is an Image-type object that might contain DOM nodes or other non-serializable data
 */
const isImageObject = (obj: unknown): boolean => {
    if (!obj || typeof obj !== 'object') return false;
    
    const record = obj as Record<string, unknown>;
    
    // Check for common Image object patterns
    return (
        'url' in record ||
        'src' in record ||
        'data' in record ||
        'base64' in record ||
        'path' in record ||
        'filename' in record ||
        'mimetype' in record ||
        'size' in record
    ) && (
        'width' in record ||
        'height' in record ||
        typeof record.url === 'string' ||
        typeof record.src === 'string'
    );
};

/**
 * Sanitizes Image objects by extracting only the serializable properties
 * Returns the object as-is (not as a string) for proper object handling
 */
const sanitizeImageObjectAsObject = (obj: unknown): Record<string, unknown> => {
    const record = obj as Record<string, unknown>;

    const sanitizedImage: Record<string, unknown> = {};

    // Extract only serializable image properties
    const safeProperties = [
        'url', 'src', 'data', 'base64', 'path', 'filename', 'mimetype', 'size',
        'width', 'height', 'alt', 'title', 'format', 'bytes', 'content', 'mime_type'
    ];

    for (const prop of safeProperties) {
        if (prop in record && isPrimitive(record[prop])) {
            sanitizedImage[prop] = record[prop];
        }
    }

    // Ensure we have at least some image data
    if (Object.keys(sanitizedImage).length === 0) {
        return { error: 'Invalid Image Object' };
    }

    return sanitizedImage;
};

/**
 * Sanitizes Image objects by extracting only the serializable properties
 * For Image type variables, we preserve the object structure as a JSON string
 * so the ImageVariable component can properly parse and display it
 * @deprecated Use sanitizeImageObjectAsObject instead for proper object handling
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sanitizeImageObject = (obj: unknown): string => {
    const sanitized = sanitizeImageObjectAsObject(obj);

    if ('error' in sanitized) {
        return '[Invalid Image Object]';
    }

    try {
        return JSON.stringify(sanitized);
    } catch {
        // Fallback if JSON.stringify fails
        const record = obj as Record<string, unknown>;
        return record.url ? String(record.url) : record.src ? String(record.src) : '[Image Object]';
    }
};

/**
 * Recursively sanitizes objects for JSON serialization by removing non-serializable values
 */
const sanitizeObjectForJson = (obj: unknown): Record<string, unknown> => {
    if (!obj || typeof obj !== 'object') return {};
    
    const record = obj as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(record)) {
        if (isPrimitive(value)) {
            sanitized[key] = value;
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => 
                isPrimitive(item) ? item : sanitizeObjectForJson(item)
            );
        } else if (value && typeof value === 'object') {
            // Avoid circular references and DOM nodes
            if (!isDomNode(value) && !isCircular(value)) {
                sanitized[key] = sanitizeObjectForJson(value);
            }
        }
    }
    
    return sanitized;
};

/**
 * Checks if a value is a primitive type that can be safely serialized
 */
const isPrimitive = (value: unknown): boolean => {
    return value === null || 
           value === undefined || 
           typeof value === 'string' || 
           typeof value === 'number' || 
           typeof value === 'boolean';
};

/**
 * Checks if an object is a DOM node (which cannot be serialized)
 */
const isDomNode = (obj: unknown): boolean => {
    if (typeof window === 'undefined') return false;
    return obj instanceof Node || obj instanceof Element || obj instanceof HTMLElement;
};

/**
 * Simple check for potential circular references (basic heuristic)
 */
const isCircular = (obj: unknown): boolean => {
    if (!obj || typeof obj !== 'object') return false;
    
    try {
        JSON.stringify(obj);
        return false;
    } catch (error) {
        return error instanceof TypeError && error.message.includes('circular');
    }
};

/**
 * Converts any value to a string representation safely
 */
const sanitizeToString = (value: unknown): string => {
    if (value === null || value === undefined) {
        return '';
    }
    
    if (typeof value === 'string') {
        return value;
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    
    if (Array.isArray(value)) {
        return `[${value.map(sanitizeToString).join(', ')}]`;
    }
    
    if (typeof value === 'object') {
        try {
            return JSON.stringify(sanitizeObjectForJson(value));
        } catch {
            return '[Object]';
        }
    }
    
    return String(value);
};

/**
 * Safely converts a variable value to a display string for UI components
 * This function is specifically designed to handle values that might be objects,
 * including Image objects, and convert them to safe display strings
 */
export const sanitizeValueToDisplayString = (value: unknown): string => {
    if (value === null || value === undefined) {
        return '';
    }
    
    if (typeof value === 'string') {
        return value;
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    
    if (Array.isArray(value)) {
        return `[${value.map(sanitizeToString).join(', ')}]`;
    }
    
    if (typeof value === 'object') {
        // Handle Image objects specifically
        if (isImageObject(value)) {
            const record = value as Record<string, unknown>;
            // For display purposes, show a summary rather than the full JSON
            if (record.filename && typeof record.filename === 'string') {
                return record.filename;
            }
            if (record.url && typeof record.url === 'string') {
                return `Image: ${record.url.substring(0, 50)}${record.url.length > 50 ? '...' : ''}`;
            }
            return '[Image]';
        }
        
        // Handle other objects by converting to JSON
        try {
            const sanitized = sanitizeObjectForJson(value);
            return JSON.stringify(sanitized);
        } catch {
            return '[Object]';
        }
    }
    
    return String(value);
};