'use client';

import React, { useRef, useEffect } from 'react';

import Grid from "@/components/editor/grid";
import Node from "@/components/editor/nodes/node";
import Connection from "@/components/editor/nodes/connection";
import BoxSelect from "@/components/editor/box-select";
import OpenGroup from "@/components/editor/nodes/open-group";
import DeleteDialog from "@/components/editor/nodes/delete-dialog";
import DeleteConnectionDialog from "@/components/editor/connections/delete-connection-dialog";
import AddNode from "@/components/editor/add-node";
import PointZeroIndicator from "@/components/editor/point-zero-indicator";
import EditorIntroTour from "@/components/guidedtour/editor-intro-tour";
import IsExecuting from "@/components/editor/is-executing";
import OAuthPopup from "@/components/oauth/oauth-popup";

import { useEditorTransform } from "@/hooks/editor/useEditorTransform";
import { useEditorEventHandlers } from "@/hooks/editor/useEditorEventHandlers";
import { useEditorKeyBindings } from "@/hooks/editor/useEditorKeyBindings";
import { useEditorState } from "@/hooks/editor/useEditorState";
import { useAutoUpdateScheduleNodes } from "@/hooks/editor/useAutoUpdateScheduleNodes";
import { useAutoUpdateRouteNodes } from "@/hooks/editor/useAutoUpdateRouteNodes";
import { useAutoUpdateChatWindowNodes } from "@/hooks/editor/useAutoUpdateChatWindowNodes";
import { useAutoFitNodes } from "@/hooks/editor/nodes/useAutoFitNodes";
import { useExecutionTabSwitcher } from "@/hooks/editor/useExecutionTabSwitcher";
import { EditorMode } from "@/types/types";
import Minimap from "@/components/editor/minimap";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";

export default function Editor({ readOnly = false }: { readOnly?: boolean }) {
    const contentRef = useRef<HTMLDivElement>(null);
    const isReadOnly = useEditorStore((state) => state.isReadOnly) || readOnly;

    // DOM-BASED PANNING
    const isDOMPanning = useRef(false);
    const isDOMActive = useRef<boolean>(false); // Block useEditorTransform during DOM operations
    const panStartPos = useRef({ x: 0, y: 0 });
    const domPanStartTransform = useRef({ x: 0, y: 0, zoom: 1 });
    const panAnimationFrame = useRef<number | null>(null);
    const gridElementRef = useRef<HTMLElement | null>(null);
    
    const handleDOMMouseDown = (e: React.MouseEvent) => {
        // Test with space+click OR middle mouse button
        if (e.button === 1 || (e.button === 0 && editorMode === EditorMode.Pan)) {
            e.preventDefault();
            e.stopPropagation(); // Stop React handlers
            isDOMPanning.current = true;
            isDOMActive.current = true; // Block useEditorTransform
            useEditorStore.getState().setIsPanning(true);
            panStartPos.current = { x: e.clientX, y: e.clientY };
            
            // Get current transform values
            const layer = transformLayerRef.current;
            if (layer) {
                const style = window.getComputedStyle(layer);
                const matrix = new DOMMatrix(style.transform);
                domPanStartTransform.current = {
                    x: matrix.m41,
                    y: matrix.m42, 
                    zoom: matrix.m11
                };
            }
            return; // Don't call React handlers
        }
    };
    
    const handleDOMMouseMove = (e: React.MouseEvent) => {
        if (!isDOMPanning.current) return;
        
        e.preventDefault();
        e.stopPropagation(); // Block React handlers
        
        // Cancel previous frame if still pending
        if (panAnimationFrame.current) {
            cancelAnimationFrame(panAnimationFrame.current);
        }
        
        // Throttle updates using requestAnimationFrame
        panAnimationFrame.current = requestAnimationFrame(() => {
            const deltaX = e.clientX - panStartPos.current.x;
            const deltaY = e.clientY - panStartPos.current.y;
            
            const newX = domPanStartTransform.current.x + deltaX;
            const newY = domPanStartTransform.current.y + deltaY;
            
            const layer = transformLayerRef.current;
            if (layer) {
                layer.style.transform = `translate3d(${newX}px, ${newY}px, 0) scale3d(${domPanStartTransform.current.zoom}, ${domPanStartTransform.current.zoom}, 1)`;
            }
            
            // Also update grid background position - use cached reference
            if (!gridElementRef.current) {
                gridElementRef.current = contentRef.current?.querySelector('.absolute.inset-0.pointer-events-none.z-1') as HTMLElement | null;
            }
            if (gridElementRef.current) {
                gridElementRef.current.style.backgroundPosition = `${newX}px ${newY}px`;
            }
            
            panAnimationFrame.current = null;
        });
        
        return; // Don't call React handlers
    };
    
    const handleDOMMouseUp = () => {
        if (!isDOMPanning.current) return;
        isDOMPanning.current = false;

        // Re-enable connector handlers immediately
        useEditorStore.getState().setIsPanning(false);
        
        // Cancel any pending animation frame
        if (panAnimationFrame.current) {
            cancelAnimationFrame(panAnimationFrame.current);
            panAnimationFrame.current = null;
        }
        
        // Sync final position to store
        const layer = transformLayerRef.current;
        if (layer) {
            const style = window.getComputedStyle(layer);
            const matrix = new DOMMatrix(style.transform);
            
            // Sync to store
            useEditorStore.getState().setPanPositionForVersion({ x: matrix.m41, y: matrix.m42 });
            
        }
        
        // Re-enable useEditorTransform after a short delay
        setTimeout(() => {
            isDOMActive.current = false;
        }, 50);
    };
    
    const handleDOMWheel = (e: WheelEvent) => {
        const contentEl = contentRef.current;
        if (!contentEl) return;
        
        const hoveredEl = document.elementFromPoint(e.clientX, e.clientY);
        if (!hoveredEl?.closest('[data-type="editor"], [data-type="drawing-layer"]')) return;
        
        e.preventDefault();
        e.stopPropagation(); // Block any other handlers
        isDOMActive.current = true; // Block useEditorTransform
        
        // Get current transform
        const layer = transformLayerRef.current;
        if (!layer) return;
        
        const style = window.getComputedStyle(layer);
        const matrix = new DOMMatrix(style.transform);
        const currentZoom = matrix.m11;
        const currentPanX = matrix.m41;
        const currentPanY = matrix.m42;
        
        // Calculate new zoom
        const zoomIntensity = 0.0025;
        const newZoom = Math.min(Math.max(0.1, currentZoom - e.deltaY * zoomIntensity * Math.log2(currentZoom + 1)), 3);
        const scaleRatio = newZoom / currentZoom;
        
        // Calculate zoom-to-mouse position
        const rect = contentEl.getBoundingClientRect();
        const relativeMouseX = e.clientX - rect.left;
        const relativeMouseY = e.clientY - rect.top;
        const contentMousePosX = (relativeMouseX - currentPanX) / rect.width;
        const contentMousePosY = (relativeMouseY - currentPanY) / rect.height;
        
        const newPanX = relativeMouseX - contentMousePosX * (rect.width * scaleRatio);
        const newPanY = relativeMouseY - contentMousePosY * (rect.height * scaleRatio);
        
        // Apply transform directly with 3D acceleration
        layer.style.transform = `translate3d(${newPanX}px, ${newPanY}px, 0) scale3d(${newZoom}, ${newZoom}, 1)`;
        
        // Update grid background position and size - use cached reference
        if (!gridElementRef.current) {
            gridElementRef.current = contentRef.current?.querySelector('.absolute.inset-0.pointer-events-none.z-1') as HTMLElement | null;
        }
        if (gridElementRef.current) {
            const GRID_SIZE = 20; // From snapToGrid
            
            gridElementRef.current.style.backgroundPosition = `${newPanX}px ${newPanY}px`;
            gridElementRef.current.style.backgroundSize = `
                ${GRID_SIZE * newZoom}px ${GRID_SIZE * newZoom}px, 
                ${GRID_SIZE * newZoom}px ${GRID_SIZE * newZoom}px, 
                ${(GRID_SIZE*5) * newZoom}px ${(GRID_SIZE*5) * newZoom}px, 
                ${(GRID_SIZE*5) * newZoom}px ${(GRID_SIZE*5) * newZoom}px
            `;
        }
        
        // Debounced store sync - shorter delay to minimize visual jump
        clearTimeout((window as unknown as {_domZoomTimeout: ReturnType<typeof setTimeout>})._domZoomTimeout);
        (window as unknown as {_domZoomTimeout: ReturnType<typeof setTimeout>})._domZoomTimeout = setTimeout(() => {
            useEditorStore.getState().setZoomFactorForVersion(newZoom);
            useEditorStore.getState().setPanPositionForVersion({ x: newPanX, y: newPanY });
            
            // Re-enable useEditorTransform after sync
            setTimeout(() => {
                isDOMActive.current = false;
            }, 50);
        }, 50); // Reduced from 150ms to 50ms
    };

    // Custom hooks for separated concerns  
    const { transformLayerRef } = useEditorTransform(isDOMActive);
    const {
        isMouseDown,
        handleMouseDownDispatch,
        handleMouseMoveDispatch,
        handleMouseUpDispatch,
        handleMouseLeaveDispatch,
        handleContextMenu
    } = useEditorEventHandlers(contentRef, { disableWheel: true }); // Disable React wheel - we do DOM
    const { handleConfirmDelete, handleCancelDelete } = useEditorKeyBindings();
    const {
        // isInteracted,
        // setIsInteracted,
        selectedNodes,
        deleteNodesDialogOpen,
        deleteConnectionDialogOpen,
        selectedConnectionId,
        // isDraft,
        editorMode,
        activeVersionId,
        nodesToRender,
        openGroups,
        isExecuting,
        chatMode,
        connections,
        connectionStatus,
        containerClass
    } = useEditorState(isMouseDown);

    const isPanning = useEditorStore((state) => state.isPanning);

    // Global listeners and auto-updates
    // Note: useGlobalStoreListenersWithImmediateSave() moved to EditorLayout to ensure forceSave always available
    useAutoUpdateRouteNodes();
    useAutoUpdateScheduleNodes();
    useAutoUpdateChatWindowNodes();
    useAutoFitNodes(contentRef, nodesToRender, 40, activeVersionId);
    useExecutionTabSwitcher();
    
    // DOM wheel event listener for smooth zooming
    useEffect(() => {
        const element = contentRef.current;
        if (!element) return;

        element.addEventListener('wheel', handleDOMWheel, { passive: false });
        return () => element.removeEventListener('wheel', handleDOMWheel);
    }, []);

    // Cleanup temp nodes on editor mount to prevent zombies from previous sessions
    useEffect(() => {
        useNodesStore.getState().clearTempNodes();
        useConnectionsStore.getState().clearTempConnections();
    }, []);

    return (
        <div
            data-type="editor"
            className={containerClass}
            onMouseDown={(e) => {
                handleDOMMouseDown(e);
                if (!isDOMPanning.current) {
                    handleMouseDownDispatch();
                }
            }}
            onMouseMove={(e) => {
                const result = handleDOMMouseMove(e);
                if (result !== undefined) return; // DOM handled it
                if (!isDOMPanning.current) {
                    handleMouseMoveDispatch(e);
                }
            }}
            onMouseUp={() => {
                handleDOMMouseUp();
                if (!isDOMPanning.current) {
                    handleMouseUpDispatch();
                }
            }}
            onMouseLeave={() => {
                handleDOMMouseUp();
                if (!isDOMPanning.current) {
                    handleMouseLeaveDispatch();
                }
            }}
            onContextMenu={handleContextMenu}
            ref={contentRef}
        >
            <EditorIntroTour/>
            
            {/* Execution Glow - Pulserende Rand */}
            {isExecuting && (
                <div
                    className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none
                               bg-transparent
                               draft-executing"
                />
            )}

            {/* Chat Mode Glow - Blue Pulsing Border */}
            {(chatMode || isReadOnly) && !isExecuting && (
                <div
                    className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none
                               bg-transparent
                               chat-mode"
                />
            )}

            {/* Panning Overlay - Blocks all interactions */}
            {isPanning && (
                <div
                    className="absolute top-0 left-0 w-full h-full z-50 cursor-grabbing"
                    style={{ pointerEvents: 'auto' }}
                />
            )}

            <IsExecuting connectionStatus={connectionStatus} />

            <Grid/>

            <div
                ref={transformLayerRef}
                style={{
                    willChange: 'transform',
                    transformOrigin: '0 0',
                    width: '1px',
                    height: '1px'
                }}
                className="absolute inset-0 overflow-visible"
            >
                <PointZeroIndicator/>

                {openGroups.map((group) => (
                    <OpenGroup key={`group-${group.id}`} node={group}/>
                ))}

                {nodesToRender.map((node) => (
                    <Node key={`node-${node.id}`} node={node}/>
                ))}

                {connections && connections
                    .filter((connection) => (!connection.hidden && !connection.temp))
                    .map((connection) => (
                        <Connection
                            key={`connection-${connection.id}`}
                            connection={connection}
                        />
                    ))}
            </div>

            {editorMode === EditorMode.BoxSelect && !isReadOnly && <BoxSelect/>}
            {!isReadOnly && <AddNode/>}

            {!isReadOnly && (
                <>
                    <DeleteDialog
                        isOpen={deleteNodesDialogOpen}
                        onConfirm={handleConfirmDelete}
                        onCancel={handleCancelDelete}
                        selectedNodes={selectedNodes}
                    />

                    <DeleteConnectionDialog
                        isOpen={deleteConnectionDialogOpen}
                        onConfirm={() => useEditorStore.getState().setDeleteConnectionDialogOpen(false)}
                        onCancel={() => useEditorStore.getState().setDeleteConnectionDialogOpen(false)}
                        connectionId={selectedConnectionId}
                    />
                </>
            )}
            
            {/* Minimap in top-right corner */}
            <Minimap />

            {/* OAuth Authorization Popup */}
            <OAuthPopup />
        </div>
    );
}
