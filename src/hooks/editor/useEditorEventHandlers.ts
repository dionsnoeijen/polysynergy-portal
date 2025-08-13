import React, { useCallback, useEffect, useRef, useState } from 'react';
import useEditorStore from '@/stores/editorStore';
import { EditorMode } from '@/types/types';
import { usePan } from './usePan';
import { useZoom } from './useZoom';
import { useDeselectOnClickOutside } from './nodes/useDeselectOnClickOutside';

export const useEditorEventHandlers = (contentRef: React.RefObject<HTMLDivElement>) => {
    const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isMouseDown, setIsMouseDown] = useState(false);

    const isDragging = useEditorStore((state) => state.isDragging);
    const isPasting = useEditorStore((state) => state.isPasting);
    const editorMode = useEditorStore((state) => state.editorMode);
    const setEditorPosition = useEditorStore((state) => state.setEditorPosition);
    const openContextMenu = useEditorStore((state) => state.openContextMenu);
    const setShowAddingNode = useEditorStore((state) => state.setShowAddingNode);
    const isDraft = useEditorStore((state) => state.isDraft);

    const { handleZoom } = useZoom();
    const { handlePanMouseDown, handleMouseMove, handleMouseUp } = usePan();
    const { handleEditorMouseDown } = useDeselectOnClickOutside();

    const updateEditorPosition = useCallback(() => {
        if (contentRef.current) {
            const rect = contentRef.current.getBoundingClientRect();
            setEditorPosition({ x: rect.left, y: rect.top });
        }
    }, [setEditorPosition, contentRef]);

    const handleMousePositionUpdate = useCallback((e: React.MouseEvent) => {
        mousePositionRef.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        openContextMenu(
            e.clientX,
            e.clientY,
            [
                {
                    label: "Add Node",
                    action: () => setShowAddingNode(true),
                }
            ]
        );
    }, [openContextMenu, setShowAddingNode]);

    const handleMouseDownDispatch = useCallback((e: React.MouseEvent) => {
        setIsMouseDown(true);
        
        switch (editorMode) {
            case EditorMode.Pan:
                handlePanMouseDown(e);
                break;
            case EditorMode.Select:
                handleEditorMouseDown();
                break;
            case EditorMode.BoxSelect:
                // eventueel BoxSelect-handling
                break;
            case EditorMode.Draw:
                // laat DrawingLayer dit zelf doen, pointer-events aan etc.
                break;
        }
    }, [editorMode, handlePanMouseDown, handleEditorMouseDown, setIsMouseDown]);

    const handleMouseMoveDispatch = useCallback((e: React.MouseEvent) => {
        handleMousePositionUpdate(e);
        if (isDragging || isPasting) return;
        handleMouseMove(e);
    }, [handleMousePositionUpdate, isDragging, isPasting, handleMouseMove]);

    const handleMouseUpDispatch = useCallback(() => {
        setIsMouseDown(false);
        handleMouseUp();
    }, [handleMouseUp]);

    const handleMouseLeaveDispatch = useCallback(() => {
        setIsMouseDown(false);
        handleMouseUp();
    }, [handleMouseUp]);

    // Editor position updates
    useEffect(() => {
        updateEditorPosition();
        window.addEventListener('resize', updateEditorPosition);
        return () => window.removeEventListener('resize', updateEditorPosition);
    }, [updateEditorPosition]);

    // Space key handling for pan mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const tag = target.tagName.toLowerCase();
            const isTextInput = ['input', 'textarea'].includes(tag) || target.isContentEditable;

            if (isTextInput) return;

            if (e.code === 'Space') {
                e.preventDefault();
                setIsSpacePressed(true);
                useEditorStore.getState().setEditorModeWithMemory(EditorMode.Pan);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
                const { previousEditorMode } = useEditorStore.getState();
                useEditorStore.getState().setEditorMode(previousEditorMode);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Global wheel handling for zoom
    useEffect(() => {
        const handleWheelGlobal = (e: WheelEvent) => {
            const contentEl = contentRef.current;
            if (!contentEl) return;
            const hoveredEl = document.elementFromPoint(e.clientX, e.clientY);
            if (hoveredEl?.closest('[data-type="editor"], [data-type="drawing-layer"]')) {
                e.preventDefault();
                handleZoom(e as unknown as React.WheelEvent, contentEl.getBoundingClientRect());
            }
        };
        window.addEventListener('wheel', handleWheelGlobal, { passive: false });
        return () => window.removeEventListener('wheel', handleWheelGlobal);
    }, [handleZoom, contentRef]);

    return {
        mousePositionRef,
        isSpacePressed,
        isMouseDown,
        handleMouseDownDispatch,
        handleMouseMoveDispatch,
        handleMouseUpDispatch,
        handleMouseLeaveDispatch,
        handleContextMenu: isDraft ? handleContextMenu : () => {}
    };
};