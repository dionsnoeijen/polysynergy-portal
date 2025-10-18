export const useConnectionTypeValidation = () => {
    const validateVariableTypeMatch = (targetVariableType: string | null, activeVariableType: string | null): boolean => {
        if (targetVariableType === null || activeVariableType === null) {
            return true; // Allow if either type is not specified
        }

        const targetTypes = targetVariableType.split(",");
        const activeTypes = activeVariableType.split(',');

        // Allow 'any' type to connect with all other types
        if (targetTypes.includes('any') || activeTypes.includes('any')) {
            return true;
        }

        return targetTypes.some(targetType => activeTypes.includes(targetType));
    };

    return {
        validateVariableTypeMatch
    };
};