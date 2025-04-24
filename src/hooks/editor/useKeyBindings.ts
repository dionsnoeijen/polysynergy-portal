import {useEffect} from "react";

type KeyBinding = {
    handler: (event: KeyboardEvent) => void;
    condition?: () => boolean;
};

type KeyBindings = {
    [key: string]: KeyBinding;
};

export const useKeyBindings = (bindings: KeyBindings) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const activeElement = document.activeElement;
            if (
                activeElement &&
                activeElement instanceof HTMLElement &&
                (activeElement.tagName === "INPUT" ||
                    activeElement.tagName === "TEXTAREA" ||
                    activeElement.isContentEditable)
            ) {
                return;
            }

            const ctrlOrCmd = event.ctrlKey || event.metaKey;
            const modifiers = [
                ctrlOrCmd ? 'ctrl' : '',
                event.shiftKey ? 'shift' : '',
                event.altKey ? 'alt' : '',
            ].filter(Boolean);

            const mainKey = event.key.toLowerCase();
            const keyCombination = [...modifiers, mainKey].join('+');

            const binding = bindings[keyCombination];
            if (binding) {
                if (!binding.condition || binding.condition()) {
                    binding.handler(event);
                    event.preventDefault();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [bindings]);
};