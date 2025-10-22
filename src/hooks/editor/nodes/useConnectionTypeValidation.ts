export const useConnectionTypeValidation = () => {
    const validateVariableTypeMatch = (targetVariableType: string | null, activeVariableType: string | null): boolean => {
        if (targetVariableType === null || activeVariableType === null) {
            return true; // Allow if either type is not specified
        }

        const targetTypes = targetVariableType.split(",").map(t => t.trim().toLowerCase());
        const activeTypes = activeVariableType.split(',').map(t => t.trim().toLowerCase());

        // Allow 'any' or 'typing.any' type to connect with all other types
        if (targetTypes.includes('any') || activeTypes.includes('any') ||
            targetTypes.includes('typing.any') || activeTypes.includes('typing.any')) {
            return true;
        }

        return targetTypes.some(targetType => activeTypes.includes(targetType));
    };

    return {
        validateVariableTypeMatch
    };
};