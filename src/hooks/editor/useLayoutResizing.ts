import { useState, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';

export enum ResizeWhat {
    ItemManager = 'itemManager',
    Dock = 'dock',
    Output = 'output',
    ChatPanel = 'chatPanel',
}

interface ResizeConfig {
    updateEditorPosition: () => void;
    setWidth: React.Dispatch<React.SetStateAction<{itemManager: number, dock: number, chatPanel: number}>>;
    setHeight: React.Dispatch<React.SetStateAction<{horizontalEditorLayout: number}>>;
}

export const useLayoutResizing = ({ updateEditorPosition, setWidth, setHeight }: ResizeConfig) => {
    const [resizing, setResizing] = useState<ResizeWhat | null>(null);

    const startResizing = useCallback((resizeWhat: ResizeWhat) => {
        setResizing(resizeWhat);
        document.body.style.cursor = resizeWhat === ResizeWhat.Output ? 'row-resize' : 'col-resize';
    }, []);

    const stopResizing = useCallback(() => {
        setResizing(null);
        document.body.style.cursor = '';
    }, []);

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (resizing) {
                const newHeight = e.clientY;
                const newWidth = e.clientX;
                if (resizing === ResizeWhat.ItemManager) {
                    updateEditorPosition();
                    flushSync(() => {
                        setWidth((prev) => ({...prev, itemManager: Math.max(newWidth, 100)}));
                    });
                } else if (resizing === ResizeWhat.Dock) {
                    const dockWidth = Math.max(window.innerWidth - newWidth, 100);
                    flushSync(() => {
                        setWidth((prev) => ({...prev, dock: dockWidth}));
                    });
                } else if (resizing === ResizeWhat.Output) {
                    flushSync(() => {
                        setHeight((prev) => ({...prev, horizontalEditorLayout: Math.max(newHeight, 100)}));
                    });
                } else if (resizing === ResizeWhat.ChatPanel) {
                    updateEditorPosition();
                    flushSync(() => {
                        setWidth((prev) => ({...prev, chatPanel: Math.max(newWidth, 200)}));
                    });
                }
            }
        },
        [resizing, updateEditorPosition, setWidth, setHeight]
    );

    useEffect(() => {
        if (resizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', stopResizing);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', stopResizing);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', stopResizing);
        };
    }, [resizing, handleMouseMove, stopResizing]);

    return {
        ResizeWhat,
        resizing,
        startResizing,
        stopResizing
    };
};