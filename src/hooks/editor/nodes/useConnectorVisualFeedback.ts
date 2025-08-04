import { useRef } from 'react';

export const useConnectorVisualFeedback = () => {
    const activeConnectorVariableTypeRef = useRef<string | null>(null);

    const dimConnectors = () => {
        const activeTypes = activeConnectorVariableTypeRef.current
            ? activeConnectorVariableTypeRef.current.split(',')
            : [];

        const allInConnectors = [...document.querySelectorAll(`[data-type="in"][data-node-id]`)];
        const allOutConnectors = [...document.querySelectorAll(`[data-type="out"][data-node-id]`)];

        [...allInConnectors, ...allOutConnectors].forEach((el) => {
            const elStyle = (el as HTMLElement).style;
            elStyle.opacity = '0.5';
            elStyle.outline = 'none';
        });

        allInConnectors.forEach((el) => {
            const nodeTypes = (el.getAttribute("data-variable-type") || "").split(",");
            const isValid = nodeTypes.some(type => activeTypes.includes(type));

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