/**
 * Normalize type aliases to their canonical form for compatibility checking
 */
const normalizeType = (type: string): string => {
    const normalized = type.trim().toLowerCase();

    // String aliases: str, string -> string
    if (normalized === 'str' || normalized === 'string') {
        return 'string';
    }

    // Number aliases: int, float, number -> number
    if (normalized === 'int' || normalized === 'float' || normalized === 'number') {
        return 'number';
    }

    return normalized;
};

export const useConnectionTypeValidation = () => {
    const validateVariableTypeMatch = (targetVariableType: string | null, activeVariableType: string | null): boolean => {
        if (targetVariableType === null || activeVariableType === null) {
            return true; // Allow if either type is not specified
        }

        const targetTypes = targetVariableType.split(",").map(t => t.trim().toLowerCase());
        const activeTypes = activeVariableType.split(',').map(t => t.trim().toLowerCase());

        // Normalize types for compatibility checking
        const normalizedTargetTypes = targetTypes.map(normalizeType);
        const normalizedActiveTypes = activeTypes.map(normalizeType);

        // Allow 'any' or 'typing.any' type to connect with all other types
        if (targetTypes.includes('any') || activeTypes.includes('any') ||
            targetTypes.includes('typing.any') || activeTypes.includes('typing.any')) {
            return true;
        }

        return normalizedTargetTypes.some(targetType => normalizedActiveTypes.includes(targetType));
    };

    return {
        validateVariableTypeMatch
    };
};