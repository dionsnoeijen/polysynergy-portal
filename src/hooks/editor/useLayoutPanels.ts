import { useState, useCallback } from 'react';

export const useLayoutPanels = () => {
    const [width, setWidth] = useState({ itemManager: 256, dock: 512 });
    const [height, setHeight] = useState({ horizontalEditorLayout: 0 });
    const [windowHeight, setWindowHeight] = useState(0);

    // Item manager is open by default
    const [itemManagerClosed, setItemManagerClosed] = useState(false);
    const [dockClosed, setDockClosed] = useState(false);
    const [outputClosed, setOutputClosed] = useState(false);

    const toggleCloseItemManager = useCallback(() => {
        setItemManagerClosed(prev => !prev);
    }, []);

    const toggleCloseDock = useCallback(() => {
        setDockClosed(prev => !prev);
    }, []);

    const toggleCloseOutput = useCallback(() => {
        setOutputClosed(prev => !prev);
    }, []);

    const toggleFullscreen = useCallback(() => {
        // If any panel is open, close all
        if (!itemManagerClosed || !dockClosed || !outputClosed) {
            setItemManagerClosed(true);
            setDockClosed(true);
            setOutputClosed(true);
        } else {
            // If all panels are closed, open them
            setItemManagerClosed(false);
            setDockClosed(false);
            setOutputClosed(false);
        }
    }, [itemManagerClosed, dockClosed, outputClosed]);

    const updatePanelDimensions = useCallback((newWidth?: Partial<typeof width>, newHeight?: Partial<typeof height>) => {
        if (newWidth) {
            setWidth(prev => ({ ...prev, ...newWidth }));
        }
        if (newHeight) {
            setHeight(prev => ({ ...prev, ...newHeight }));
        }
    }, []);

    const setWindowDimensions = useCallback((newWindowHeight: number, newEditorLayoutHeight?: number) => {
        setWindowHeight(newWindowHeight);
        if (newEditorLayoutHeight !== undefined) {
            setHeight(prev => ({ ...prev, horizontalEditorLayout: newEditorLayoutHeight }));
        }
    }, []);

    return {
        // State
        width,
        height,
        windowHeight,
        itemManagerClosed,
        dockClosed,
        outputClosed,
        
        // Actions
        toggleCloseItemManager,
        toggleCloseDock,
        toggleCloseOutput,
        toggleFullscreen,
        updatePanelDimensions,
        setWindowDimensions,
        
        // Direct setters for live updates
        setWidth,
        setHeight
    };
};