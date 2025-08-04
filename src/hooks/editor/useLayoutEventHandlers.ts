import { useEffect, useCallback } from 'react';
import useEditorStore from '@/stores/editorStore';

export const useLayoutEventHandlers = () => {
    const nodeToMoveToGroupId = useEditorStore((state) => state.nodeToMoveToGroupId);
    const setNodeToMoveToGroupId = useEditorStore((state) => state.setNodeToMoveToGroupId);
    const setEditorPosition = useEditorStore((state) => state.setEditorPosition);

    const updateEditorPosition = useCallback(() => {
        const editor = document.querySelector('[data-type="editor"]') as HTMLElement;
        if (editor) {
            const rect = editor.getBoundingClientRect();
            setEditorPosition({ x: rect.left, y: rect.top });
        }
    }, [setEditorPosition]);

    // Handle escape key and click outside for node move mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && nodeToMoveToGroupId) {
                setNodeToMoveToGroupId(null);
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (nodeToMoveToGroupId) {
                const target = e.target as HTMLElement;
                // Cancel als er niet op een geldige node geklikt is
                if (!target.closest('[data-type="closed-group"]')) {
                    setNodeToMoveToGroupId(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, [nodeToMoveToGroupId, setNodeToMoveToGroupId]);

    return {
        updateEditorPosition
    };
};