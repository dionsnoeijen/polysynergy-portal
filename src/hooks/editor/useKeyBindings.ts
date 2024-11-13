import { useEffect } from 'react';

type KeyBindings = {
    [key: string]: (event: KeyboardEvent) => void;
};

export const useKeyBindings = (bindings: KeyBindings) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const keyCombination = [
                event.ctrlKey || event.metaKey ? 'ctrl' : '',
                event.shiftKey ? 'shift' : '',
                event.key.toLowerCase(),
            ]
                .filter(Boolean)
                .join('+');

            if (bindings[keyCombination]) {
                bindings[keyCombination](event);
                event.preventDefault();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [bindings]);
};
