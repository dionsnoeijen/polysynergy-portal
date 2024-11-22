import { useEffect } from 'react';

type KeyBindings = {
    [key: string]: (event: KeyboardEvent) => void;
};

export const useKeyBindings = (bindings: KeyBindings) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const activeElement = document.activeElement;
            if (
                activeElement &&
                (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.isContentEditable)
            ) {
                return;
            }

            const modifiers = [
                event.ctrlKey ? 'ctrl' : '',
                event.shiftKey ? 'shift' : '',
                event.altKey ? 'alt' : '',
                event.metaKey && !event.ctrlKey ? 'meta' : '',
            ].filter(Boolean);

            const mainKey = event.key.toLowerCase();
            const keyCombination = [...modifiers, mainKey].join('+');

            if (bindings[keyCombination]) {
                bindings[keyCombination](event);
                event.preventDefault();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [bindings]);
};
