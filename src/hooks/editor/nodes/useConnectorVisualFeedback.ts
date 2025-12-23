import { useRef } from 'react';

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

    // Image aliases: polysynergy_nodes.image.types.Image, Image -> image
    if (normalized === 'image' || normalized.endsWith('.image')) {
        return 'image';
    }

    return normalized;
};

export const useConnectorVisualFeedback = () => {
    const activeConnectorVariableTypeRef = useRef<string | null>(null);

    const dimConnectors = () => {
        const activeTypes = activeConnectorVariableTypeRef.current
            ? activeConnectorVariableTypeRef.current.split(',').map(t => t.trim().toLowerCase())
            : [];

        // Normalize active types for compatibility checking
        const normalizedActiveTypes = activeTypes.map(normalizeType);

        // Select both regular node connectors and group connectors
        const allInConnectors = [...document.querySelectorAll(`[data-type="in"][data-node-id], [data-type="in"][data-group-id]`)];
        const allOutConnectors = [...document.querySelectorAll(`[data-type="out"][data-node-id], [data-type="out"][data-group-id]`)];

        [...allInConnectors, ...allOutConnectors].forEach((el) => {
            const elStyle = (el as HTMLElement).style;
            elStyle.opacity = '0.5';
            elStyle.outline = 'none';
        });

        allInConnectors.forEach((el) => {
            const variableType = el.getAttribute("data-variable-type");
            const isGroupConnector = el.hasAttribute("data-group-id");

            // Group connectors accept all types, so always highlight them
            if (isGroupConnector) {
                const elStyle = (el as HTMLElement).style;
                elStyle.opacity = '1';
                elStyle.outline = '4px solid rgba(59, 130, 246, 0.9)';

                const animatedEl = el.querySelector(".connector-animatable");
                if (animatedEl) {
                    animatedEl.classList.add("animate-[snap-white_0.2s_ease-out]");
                    setTimeout(() => {
                        animatedEl.classList.remove("animate-[snap-white_0.2s_ease-out]");
                    }, 250);
                }
                return;
            }

            const nodeTypes = (variableType || "").split(",").map(t => t.trim().toLowerCase());
            // Normalize node types for compatibility checking
            const normalizedNodeTypes = nodeTypes.map(normalizeType);

            // Allow 'any' or 'typing.any' type to always be highlighted as valid
            const isValid = normalizedNodeTypes.some(type => normalizedActiveTypes.includes(type)) ||
                           nodeTypes.includes('any') || activeTypes.includes('any') ||
                           nodeTypes.includes('typing.any') || activeTypes.includes('typing.any');

            if (isValid) {
                const elStyle = (el as HTMLElement).style;
                elStyle.opacity = '1';
                elStyle.outline = '4px solid rgba(59, 130, 246, 0.9)';

                const animatedEl = el.querySelector(".connector-animatable");
                if (animatedEl) {
                    animatedEl.classList.add("animate-[snap-white_0.2s_ease-out]");
                    setTimeout(() => {
                        animatedEl.classList.remove("animate-[snap-white_0.2s_ease-out]");
                    }, 250);
                }
            }
        });
    };

    const undimConnectors = () => {
        const connectors = document.querySelectorAll(`[data-type="in"], [data-type="out"]`);
        connectors.forEach((connector) => {
            (connector as HTMLElement).style.opacity = "";
            (connector as HTMLElement).style.outline = 'none';
            (connector as HTMLElement).style.boxShadow = '';
        });
    };

    const animateConnector = (target: HTMLElement) => {
        const animatedEl = target.querySelector(".connector-animatable");
        if (animatedEl) {
            animatedEl.classList.add("animate-[snap-white_0.2s_ease-out]");
            setTimeout(() => {
                animatedEl.classList.remove("animate-[snap-white_0.2s_ease-out]");
            }, 250);
        }
    };

    const setActiveVariableType = (variableType: string | null) => {
        activeConnectorVariableTypeRef.current = variableType;
    };

    const getActiveVariableType = () => {
        return activeConnectorVariableTypeRef.current;
    };

    return {
        dimConnectors,
        undimConnectors,
        animateConnector,
        setActiveVariableType,
        getActiveVariableType
    };
};