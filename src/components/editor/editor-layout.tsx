'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { ArrowLeftEndOnRectangleIcon, ArrowRightEndOnRectangleIcon } from "@heroicons/react/24/outline";
import dynamic from 'next/dynamic';

import ItemManagerTabs from "@/components/editor/sidebars/item-manager-tabs";
import DockTabs from "@/components/editor/sidebars/dock-tabs";
import Form from "@/components/editor/form";
import EnhancedDocs from "@/components/editor/enhanced-docs";
import BottomBar from "@/components/editor/bottombars/bottom-bar";
import ContextMenu from "@/components/editor/context-menu";
import VersionPublishedMenu from "@/components/editor/editormenus/version-published-menu";
import TopLeftEditorMenu from "@/components/editor/editormenus/top-left-editor-menu";
import TopRightEditorListener from "@/components/editor/editormenus/top-right-editor-listener";
import BottomDrawToolbar from "@/components/editor/editormenus/bottom-draw-toolbar";
import BottomLeftPlayMenu from "@/components/editor/editormenus/bottom-left-play-menu";
import ChatModeToggle from "@/components/editor/editormenus/chat-mode-toggle";
import ItemManagerIntroTour from "@/components/guidedtour/item-manager-intro-tour";
import AutosaveIndicator from "@/components/AutosaveIndicator";

import { useLayoutPanels } from "@/hooks/editor/useLayoutPanels";
import { useLayoutResizing } from "@/hooks/editor/useLayoutResizing";
import { useRouteSetup } from "@/hooks/editor/useRouteSetup";
import { useDebugTools } from "@/hooks/editor/useDebugTools";
import { useLayoutEventHandlers } from "@/hooks/editor/useLayoutEventHandlers";
import { useLayoutState } from "@/hooks/editor/useLayoutState";
import useEditorStore from "@/stores/editorStore";
import PerformanceHUD from "@/components/debug/performance-hud";

const DrawingLayer = dynamic(() => import('@/components/editor/drawing/drawing-layer'), { ssr: false });
const Editor = dynamic(() => import('@/components/editor/editor'), {
    ssr: false
});

const EditorLayout = ({
    projectUuid,
    routeUuid,
    scheduleUuid,
    blueprintUuid,
    configUuid,
}: {
    projectUuid?: string,
    routeUuid?: string,
    scheduleUuid?: string,
    blueprintUuid?: string,
    configUuid?: string,
}) => {
    // Performance HUD toggle state
    const [showPerformanceHUD, setShowPerformanceHUD] = useState(false);
    
    // Custom hooks for separated concerns
    const {
        width,
        height,
        windowHeight,
        itemManagerClosed,
        dockClosed,
        outputClosed,
        toggleCloseItemManager,
        toggleCloseDock,
        toggleCloseOutput,
        toggleFullscreen,
        setWindowDimensions,
        setWidth,
        setHeight
    } = useLayoutPanels();
    
    const { updateEditorPosition } = useLayoutEventHandlers();
    
    const { ResizeWhat, startResizing } = useLayoutResizing({
        updateEditorPosition,
        setWidth,
        setHeight
    });
    
    useRouteSetup({ projectUuid, routeUuid, scheduleUuid, blueprintUuid });
    useDebugTools();
    
    const {
        showForm,
        isFormOpen,
        showDocs,
        activeVersionId,
        closeFormMessage,
        fetchAvailableNodes,
        isLoadingFlow
    } = useLayoutState();

    // Chat mode and execution state for glow
    const chatMode = useEditorStore(s => s.chatMode);
    const setChatMode = useEditorStore(s => s.setChatMode);
    // const isExecuting = useEditorStore(s => s.isExecuting);
    
    // Chat Mode functions - moved here where layout panels are available
    const enterChatMode = useCallback(() => {
        // Hide sidebars only (not output panel)
        // Check if they're already closed to avoid unnecessary state updates
        let needsUpdate = false;
        if (!itemManagerClosed) {
            toggleCloseItemManager();
            needsUpdate = true;
        }
        if (!dockClosed) {
            toggleCloseDock();
            needsUpdate = true;
        }
        
        // Keep output panel open but set to chat mode (will handle in bottom bar)
        setChatMode(true);
        
        // Update editor position after panel changes
        if (needsUpdate) {
            setTimeout(() => {
                updateEditorPosition();
            }, 200);
        }
    }, [itemManagerClosed, dockClosed, toggleCloseItemManager, toggleCloseDock, setChatMode, updateEditorPosition]);
    
    const exitChatMode = useCallback(() => {
        // Restore sidebars
        // Check if they're closed to avoid unnecessary state updates
        let needsUpdate = false;
        if (itemManagerClosed) {
            toggleCloseItemManager();
            needsUpdate = true;
        }
        if (dockClosed) {
            toggleCloseDock();
            needsUpdate = true;
        }
        
        setChatMode(false);
        
        // Update editor position after panel changes
        if (needsUpdate) {
            setTimeout(() => {
                updateEditorPosition();
            }, 200);
        }
    }, [itemManagerClosed, dockClosed, toggleCloseItemManager, toggleCloseDock, setChatMode, updateEditorPosition]);
    

    // Listen for Chat Mode events from child components
    useEffect(() => {
        const handleEnterChatMode = () => {
            enterChatMode();
        };

        const handleExitChatMode = () => {
            exitChatMode();
        };

        window.addEventListener('enterChatMode', handleEnterChatMode);
        window.addEventListener('exitChatMode', handleExitChatMode);

        return () => {
            window.removeEventListener('enterChatMode', handleEnterChatMode);
            window.removeEventListener('exitChatMode', handleExitChatMode);
        };
    }, [enterChatMode, exitChatMode]);

    // Initialize window dimensions
    useEffect(() => {
        setWindowDimensions(window.innerHeight, window.innerHeight * 0.6);
        const handleResize = () => setWindowDimensions(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [fetchAvailableNodes, setWindowDimensions]);

    // Add 'F' key binding for fullscreen mode
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't trigger if user is typing in an input
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

            // Check for 'f' key (case insensitive)
            if (event.key.toLowerCase() === 'f' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
                event.preventDefault();
                
                // If in Chat Mode, exit it first
                if (chatMode) {
                    exitChatMode();
                } else {
                    toggleFullscreen();
                }
                
                // Update editor position after toggle
                setTimeout(() => {
                    updateEditorPosition();
                }, 200);
            }
            
            // Check for 'p' key (case insensitive) for Performance HUD toggle
            if (event.key.toLowerCase() === 'p' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
                event.preventDefault();
                setShowPerformanceHUD(prev => !prev);
            }
            
            // Check for 'Shift+C' key for Chat Mode toggle
            if (event.key.toLowerCase() === 'c' && event.shiftKey && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                
                // Toggle Chat Mode
                if (chatMode) {
                    exitChatMode();
                } else {
                    enterChatMode();
                }
                
                // Update editor position after toggle
                setTimeout(() => {
                    updateEditorPosition();
                }, 200);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [chatMode, exitChatMode, enterChatMode, toggleFullscreen, updateEditorPosition]);

    // Enhanced toggle functions with editor position updates
    const handleToggleItemManager = () => {
        toggleCloseItemManager();
        setTimeout(() => {
            updateEditorPosition();
        }, 200);
    };

    return (
        <div className="absolute top-0 right-0 bottom-0 left-0 bg-zinc-100 dark:bg-zinc-900">
            {showPerformanceHUD && <PerformanceHUD />}
            <ItemManagerIntroTour/>
            {closeFormMessage && (
                <>
                    <div className="z-20 fixed top-0 left-0 right-0 h-[1px] bg-green-500 animate-progress"></div>
                    <div
                        className="z-20 fixed top-2 left-1/2 sm:max-w-md bg-green-100 text-green-800 p-4 rounded-md shadow-lg animate-fade-in-out">
                        {closeFormMessage}
                    </div>
                </>
            )}
            <div className="absolute top-0 right-0 left-0" data-panel="top"
                 style={{height: outputClosed ? windowHeight : height.horizontalEditorLayout}}>
                {!itemManagerClosed && (
                    <div style={{width: width.itemManager}} className="absolute top-0 left-0 bottom-0" data-panel="item-manager">
                        <div className="absolute inset-0">
                            <ItemManagerTabs toggleClose={handleToggleItemManager}/>
                        </div>
                        <button
                            onMouseDown={() => startResizing(ResizeWhat.ItemManager)}
                            type="button"
                            className="absolute top-0 right-0 bottom-0 w-[8px] cursor-col-resize"
                        />
                    </div>
                )}

                {itemManagerClosed && (<button
                    type="button"
                    onClick={handleToggleItemManager}
                    className="absolute z-10 top-1/2 -translate-y-1/2 left-0 p-3 radius-tl-0"
                ><ArrowRightEndOnRectangleIcon className="w-4 h-4 text-white"/></button>)}

                <main className="absolute top-0 bottom-0" data-panel="main" style={{
                    left: itemManagerClosed ? 0 : width.itemManager,
                    right: dockClosed ? 0 : width.dock
                }}>
                    <div
                        className={`absolute top-0 left-0 right-0 bottom-0 ${isFormOpen() || showDocs ? 'overflow-scroll' : 'overflow-hidden'} border-l border-r border-black ${showForm ? 'bg-white dark:bg-zinc-800' : 'bg-white dark:bg-zinc-700'}`}
                    >
                        {showForm ? (
                            <Form/>
                        ) : showDocs ? (
                            <EnhancedDocs/>
                        ) : (
                            projectUuid && (routeUuid || scheduleUuid || blueprintUuid || configUuid) ? (
                                activeVersionId ? (
                                    <>
                                        <DrawingLayer />
                                        <Editor key={'editor-' + activeVersionId}/>
                                        {!chatMode && (
                                            <>
                                                <BottomDrawToolbar/>
                                                <TopRightEditorListener/>
                                                <TopLeftEditorMenu key={'top-left-editor-menu-' + activeVersionId}/>
                                                <VersionPublishedMenu/>
                                                <BottomLeftPlayMenu/>
                                                
                                                {/* Floating AutosaveIndicator - centered relative to menu height */}
                                                <div className="absolute bottom-1 right-2 z-[9999] pointer-events-none flex items-center" style={{height: '52px'}}>
                                                    <AutosaveIndicator />
                                                </div>
                                            </>
                                        )}
                                        
                                        {/* Chat Mode Toggle - visible when all panels closed (fullscreen) or in chat mode */}
                                        {(chatMode || (itemManagerClosed && dockClosed && outputClosed)) && (
                                            <ChatModeToggle />
                                        )}
                                    </>
                                ) : (
                                    <div className="flex justify-center items-center h-full">
                                        <p className="text-white">Loading node setup...</p>
                                    </div>
                                )
                            ) : (

                                <div className="flex justify-center items-center h-full">
                                    <p className="text-sky-500 dark:text-white">
                                        Select a route, schedule or blueprint to start editing nodes
                                    </p>
                                </div>
                            )
                        )}
                    </div>
                    
                    {/* Loading Overlay for Flow Switching */}
                    {isLoadingFlow && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="flex items-center gap-4">
                                <div className="animate-spin h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full"></div>
                                <span className="text-white font-medium">Loading flow...</span>
                            </div>
                        </div>
                    )}
                </main>

                {!dockClosed && (
                    <>
                        <div style={{width: width.dock}} className="absolute top-0 right-0 bottom-0 overflow-scroll" data-panel="dock">
                            <div className="absolute inset-0">
                                <DockTabs toggleClose={toggleCloseDock}/>
                            </div>
                            <button
                                onMouseDown={() => startResizing(ResizeWhat.Dock)}
                                type="button"
                                className="absolute top-0 left-0 bottom-0 w-[8px] cursor-col-resize"
                            />
                        </div>
                    </>
                )}

                {dockClosed && (
                    <button
                        type="button"
                        onClick={toggleCloseDock}
                        className="absolute z-10 top-1/2 -translate-y-1/2 right-0 p-3 radius-tr-0"
                    >
                        <ArrowLeftEndOnRectangleIcon className="w-4 h-4 text-white"/>
                    </button>
                )}
            </div>

            {!outputClosed && (
                <div
                    className="absolute left-0 bottom-0 right-0" data-panel="bottom"
                    style={{height: windowHeight - height.horizontalEditorLayout}}
                >
                    <button
                        type="button"
                        onClick={toggleCloseOutput}
                        className={`absolute z-10 top-1 left-2 p-3 radius-bl-0`}
                    ><ArrowLeftEndOnRectangleIcon className="w-4 h-4 text-white"/></button>
                    <button
                        onMouseDown={() => startResizing(ResizeWhat.Output)}
                        type="button"
                        className="absolute h-[8px] left-0 right-0 top-0 cursor-row-resize z-10"
                    />
                    <div
                        className="absolute top-0 left-0 right-0 bottom-0">
                        <BottomBar/>
                    </div>
                </div>
            )}

            {outputClosed && (
                <button
                    type="button"
                    onClick={toggleCloseOutput}
                    className="absolute z-10 bottom-2 left-1/2 -translate-x-1/2 p-3 radius-bl-0"
                >
                    <ArrowRightEndOnRectangleIcon className="w-4 h-4 text-white"/>
                </button>
            )}

            <ContextMenu/>
        </div>
    );
}

export {EditorLayout};
