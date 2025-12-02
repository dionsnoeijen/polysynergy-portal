'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { ArrowLeftEndOnRectangleIcon, ArrowRightEndOnRectangleIcon } from "@heroicons/react/24/outline";
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

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
import EditorTopBar from "@/components/editor/editormenus/editor-top-bar";
import ItemManagerIntroTour from "@/components/guidedtour/item-manager-intro-tour";
import AutosaveIndicator from "@/components/AutosaveIndicator";
import Chat from "@/components/editor/chat/chat";
import EmptyStatePanel from "@/components/editor/empty-state-panel";
import { useBranding } from '@/contexts/branding-context';

import { useLayoutPanels } from "@/hooks/editor/useLayoutPanels";
import { useLayoutResizing } from "@/hooks/editor/useLayoutResizing";
import { useRouteSetup } from "@/hooks/editor/useRouteSetup";
import { useDebugTools } from "@/hooks/editor/useDebugTools";
import { useLayoutEventHandlers } from "@/hooks/editor/useLayoutEventHandlers";
import { useLayoutState } from "@/hooks/editor/useLayoutState";
import useGlobalStoreListenersWithImmediateSave from "@/hooks/editor/nodes/useGlobalStoresListener";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useDynamicRoutesStore from "@/stores/dynamicRoutesStore";
import useSchedulesStore from "@/stores/schedulesStore";
import useBlueprintsStore from "@/stores/blueprintsStore";
import useChatWindowsStore from "@/stores/chatWindowsStore";
import useEditorTabsStore from "@/stores/editorTabsStore";
import { formatSegments } from "@/utils/formatters";
import PerformanceHUD from "@/components/debug/performance-hud";
import { v4 as uuidv4 } from 'uuid';

const DrawingLayer = dynamic(() => import('@/components/editor/drawing/drawing-layer'), { ssr: false });
const Editor = dynamic(() => import('@/components/editor/editor'), {
    ssr: false
});

const EditorLayout = ({
    projectUuid,
    routeUuid,
    scheduleUuid,
    chatWindowUuid,
    blueprintUuid,
    configUuid,
    isEndUserChatMode = false,
    showChatBackButton = false,
    onChatBackClick,
}: {
    projectUuid?: string,
    routeUuid?: string,
    scheduleUuid?: string,
    chatWindowUuid?: string,
    blueprintUuid?: string,
    configUuid?: string,
    isEndUserChatMode?: boolean,
    showChatBackButton?: boolean,
    onChatBackClick?: () => void,
}) => {
    // Detect if we're in end-user chat mode (not admin editor)
    const isChatWindow = isEndUserChatMode;
    // Performance HUD toggle state
    const [showPerformanceHUD, setShowPerformanceHUD] = useState(false);

    // Get branding colors
    const { accent_color } = useBranding();

    // Set read-only mode for end-user chat windows
    const setIsReadOnly = useEditorStore((state) => state.setIsReadOnly);
    useEffect(() => {
        setIsReadOnly(isChatWindow);
        return () => setIsReadOnly(false); // Clean up on unmount
    }, [isChatWindow, setIsReadOnly]);
    
    // Custom hooks for separated concerns
    const {
        width,
        height,
        windowHeight,
        itemManagerClosed,
        dockClosed,
        outputClosed,
        chatPanelOpen,
        toggleCloseItemManager,
        toggleCloseDock,
        toggleCloseOutput,
        toggleChatPanel,
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
    
    useRouteSetup({ projectUuid, routeUuid, scheduleUuid, chatWindowUuid, blueprintUuid });
    useGlobalStoreListenersWithImmediateSave(); // Hoisted from Editor to ensure forceSave always available
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

    // Chat window permissions for conditional UI
    const chatWindowPermissions = useEditorStore(s => s.chatWindowPermissions);

    // Get opened group state to conditionally hide drawing layer
    const openedGroup = useNodesStore(s => s.openedGroup);

    // /chat route specific UI state
    const chatEditorCollapsed = useEditorStore(s => s.chatEditorCollapsed);
    const setChatEditorCollapsed = useEditorStore(s => s.setChatEditorCollapsed);
    const chatOutputCollapsed = useEditorStore(s => s.chatOutputCollapsed);
    const setChatOutputCollapsed = useEditorStore(s => s.setChatOutputCollapsed);

    // Chat Mode functions - moved here where layout panels are available
    const enterChatMode = useCallback(() => {
        // Hide sidebars and output panel for clean vertical split
        let needsUpdate = false;
        if (!itemManagerClosed) {
            toggleCloseItemManager();
            needsUpdate = true;
        }
        if (!dockClosed) {
            toggleCloseDock();
            needsUpdate = true;
        }
        if (!outputClosed) {
            toggleCloseOutput();
            needsUpdate = true;
        }
        
        // Open chat panel and set chat mode
        if (!chatPanelOpen) {
            toggleChatPanel();
            needsUpdate = true;
        }
        setChatMode(true);
        
        // Update editor position after panel changes
        if (needsUpdate) {
            setTimeout(() => {
                updateEditorPosition();
            }, 200);
        }
    }, [itemManagerClosed, dockClosed, outputClosed, chatPanelOpen, toggleCloseItemManager, toggleCloseDock, toggleCloseOutput, toggleChatPanel, setChatMode, updateEditorPosition]);
    
    const exitChatMode = useCallback(() => {
        // Close chat panel and restore normal layout
        let needsUpdate = false;
        if (chatPanelOpen) {
            toggleChatPanel();
            needsUpdate = true;
        }
        
        // Restore sidebars
        if (itemManagerClosed) {
            toggleCloseItemManager();
            needsUpdate = true;
        }
        if (dockClosed) {
            toggleCloseDock();
            needsUpdate = true;
        }
        if (outputClosed) {
            toggleCloseOutput();
            needsUpdate = true;
        }
        
        setChatMode(false);
        
        // Update editor position after panel changes
        if (needsUpdate) {
            setTimeout(() => {
                updateEditorPosition();
            }, 200);
        }
    }, [chatPanelOpen, itemManagerClosed, dockClosed, outputClosed, toggleChatPanel, toggleCloseItemManager, toggleCloseDock, toggleCloseOutput, setChatMode, updateEditorPosition]);

    // Router for navigation
    const router = useRouter();

    // Store getters for fetching fundamental data
    const getDynamicRoute = useDynamicRoutesStore((state) => state.getDynamicRoute);
    const getSchedule = useSchedulesStore((state) => state.getSchedule);
    const getBlueprint = useBlueprintsStore((state) => state.getBlueprint);
    const getChatWindow = useChatWindowsStore((state) => state.getChatWindow);

    // Tab store actions
    const addTab = useEditorTabsStore((state) => state.addTab);
    const hasTab = useEditorTabsStore((state) => state.hasTab);
    const getTabByFundamentalId = useEditorTabsStore((state) => state.getTabByFundamentalId);
    const setActiveTab = useEditorTabsStore((state) => state.setActiveTab);

    // Restore last active tab when landing on project root
    useEffect(() => {
        // Only run when we're on project root (no fundamental in URL)
        if (!projectUuid || routeUuid || scheduleUuid || chatWindowUuid || blueprintUuid || configUuid) {
            return;
        }

        // Get active tab for this project
        const getActiveTab = useEditorTabsStore.getState().getActiveTab;
        const activeTab = getActiveTab(projectUuid);

        // If there's an active tab, navigate to it
        if (activeTab) {
            const fundamentalPath = activeTab.type === 'chatwindow' ? 'chat-window' : activeTab.type;
            router.replace(`/project/${projectUuid}/${fundamentalPath}/${activeTab.fundamentalId}`);
        }
    }, [projectUuid, routeUuid, scheduleUuid, chatWindowUuid, blueprintUuid, configUuid, router]);

    // Sync URL with tabs: When URL changes, ensure tab exists and is active
    useEffect(() => {
        if (!projectUuid) return;

        let fundamentalId: string | undefined;
        let fundamentalType: 'route' | 'schedule' | 'blueprint' | 'chatwindow' | undefined;
        let fundamentalName: string | undefined;
        let fundamentalMethod: string | undefined;

        if (routeUuid) {
            const route = getDynamicRoute(routeUuid);
            if (route) {
                fundamentalId = routeUuid;
                fundamentalType = 'route';
                fundamentalName = formatSegments(route.segments);
                fundamentalMethod = route.method;
            }
        } else if (scheduleUuid) {
            const schedule = getSchedule(scheduleUuid);
            if (schedule) {
                fundamentalId = scheduleUuid;
                fundamentalType = 'schedule';
                fundamentalName = schedule.name;
            }
        } else if (chatWindowUuid) {
            const chatWindow = getChatWindow(chatWindowUuid);
            if (chatWindow) {
                fundamentalId = chatWindowUuid;
                fundamentalType = 'chatwindow';
                fundamentalName = chatWindow.name;
            }
        } else if (blueprintUuid) {
            const blueprint = getBlueprint(blueprintUuid);
            if (blueprint) {
                fundamentalId = blueprintUuid;
                fundamentalType = 'blueprint';
                fundamentalName = blueprint.name;
            }
        }

        // If we have a fundamental in the URL
        if (fundamentalId && fundamentalType && fundamentalName) {
            // Check if tab already exists
            const existingTab = getTabByFundamentalId(projectUuid, fundamentalId);

            if (existingTab) {
                // Tab exists - make it active
                setActiveTab(projectUuid, existingTab.id);
            } else {
                // Tab doesn't exist - create new one (addTab also sets it as active)
                addTab(projectUuid, {
                    id: uuidv4(),
                    type: fundamentalType,
                    fundamentalId: fundamentalId,
                    name: fundamentalName,
                    method: fundamentalMethod
                });
            }
        }
    }, [projectUuid, routeUuid, scheduleUuid, chatWindowUuid, blueprintUuid, getDynamicRoute, getSchedule, getChatWindow, getBlueprint, addTab, hasTab, getTabByFundamentalId, setActiveTab]);

    // Tab change/close handlers are now in EditorTopBar

    // Determine if we're in fullscreen mode (all panels closed)
    const isFullscreen = React.useMemo(() => {
        return itemManagerClosed && dockClosed && outputClosed;
    }, [itemManagerClosed, dockClosed, outputClosed]);

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
        setWindowDimensions(window.innerHeight, window.innerHeight * 0.75);
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
                    <div className="z-[100] fixed top-0 left-0 right-0 h-[1px] bg-green-500 animate-progress"></div>
                    <div
                        className="z-[100] fixed top-2 left-1/2 -translate-x-1/2 sm:max-w-md bg-green-100 text-green-800 p-4 rounded-md shadow-lg animate-fade-in-out">
                        {closeFormMessage}
                    </div>
                </>
            )}
            <div className="absolute top-0 right-0 left-0" data-panel="top"
                 style={{height: isChatWindow ? windowHeight : (outputClosed ? windowHeight : height.horizontalEditorLayout)}}>
                {/* Only show ItemManager for non-chat-windows (never for end-user chat mode) */}
                {!isChatWindow && !itemManagerClosed && (chatWindowPermissions?.can_view_flow !== false) && (
                    <div style={{width: width.itemManager}} className="absolute top-0 left-0 bottom-0" data-panel="item-manager">
                        <div className="absolute inset-0">
                            <ItemManagerTabs toggleClose={handleToggleItemManager}/>
                        </div>
                        {!chatMode && (
                            <button
                                onMouseDown={() => startResizing(ResizeWhat.ItemManager)}
                                type="button"
                                className="absolute top-0 right-0 bottom-0 w-[8px] cursor-col-resize"
                            />
                        )}
                    </div>
                )}

                {!isChatWindow && itemManagerClosed && !chatMode && (chatWindowPermissions?.can_view_flow !== false) && (<button
                    type="button"
                    onClick={handleToggleItemManager}
                    className="absolute z-10 top-1/2 -translate-y-1/2 left-0 p-3 radius-tl-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm"
                ><ArrowRightEndOnRectangleIcon className="w-4 h-4 text-zinc-700 dark:text-white"/></button>)}

                {/* Chat Panel - Left Side (always open for chat windows) */}
                {(chatPanelOpen || isChatWindow) && (
                    <div style={{
                        width: isChatWindow
                            ? (chatWindowPermissions?.can_view_flow === false && chatWindowPermissions?.can_view_output === false
                                ? '100vw'  // Full width for chat-only mode (no permissions)
                                : (chatWindowPermissions?.can_view_flow === false && !chatOutputCollapsed
                                    ? `calc(100vw - ${width.dock}px)`  // No editor, but dock visible
                                    : (chatWindowPermissions?.can_view_flow === false && chatOutputCollapsed
                                        ? 'calc(100vw - 40px)'  // No editor, dock collapsed
                                        : (chatEditorCollapsed && chatOutputCollapsed
                                            ? 'calc(100vw - 80px)'  // Both collapsed (2x 40px bars)
                                            : (chatEditorCollapsed && !chatOutputCollapsed
                                                ? `calc(100vw - ${width.dock + 40}px)`  // Editor collapsed (40px), dock open
                                                : (!chatEditorCollapsed && chatOutputCollapsed
                                                    ? width.chatPanel  // Editor open, dock collapsed
                                                    : width.chatPanel))))))  // Both open - normal split
                            : width.chatPanel
                    }} className={`absolute top-0 left-0 bottom-0 bg-white dark:bg-zinc-800 ${(isChatWindow && chatEditorCollapsed && chatOutputCollapsed) ? '' : 'border-r border-gray-200 dark:border-gray-700'}`} data-panel="chat">
                        <div className="absolute inset-0">
                            <Chat
                                showBackButton={showChatBackButton}
                                onBackClick={onChatBackClick}
                                isEndUserChatMode={isChatWindow}
                            />
                        </div>
                        {!isChatWindow && chatWindowPermissions?.can_view_flow !== false && (
                            <button
                                onMouseDown={() => startResizing(ResizeWhat.ChatPanel)}
                                type="button"
                                className="absolute top-0 right-0 bottom-0 w-[8px] cursor-col-resize hover:bg-gray-300 dark:hover:bg-gray-600"
                            />
                        )}
                    </div>
                )}

                {/* Only render main panel when editor is not collapsed in chat window */}
                {!(isChatWindow && chatEditorCollapsed) && (
                <main className="absolute top-0 bottom-0" data-panel="main" style={{
                    left: isChatWindow ? width.chatPanel : (chatPanelOpen ? width.chatPanel : ((itemManagerClosed || chatWindowPermissions?.can_view_flow === false) ? 0 : width.itemManager)),
                    right: isChatWindow
                        ? (chatOutputCollapsed ? 40 : width.dock)  // Space for dock or collapsed bar
                        : ((dockClosed || chatWindowPermissions?.can_view_flow === false) ? 0 : width.dock)
                }}>
                    <div
                        className={`absolute top-0 left-0 right-0 bottom-0 ${isFormOpen() || showDocs ? 'overflow-scroll' : 'overflow-hidden'} border-l border-r ${(!isChatWindow && !chatMode && !isFullscreen) ? '' : 'border-t'} dark:border-white/10 ${showForm ? 'bg-white dark:bg-zinc-800' : 'bg-white dark:bg-zinc-700'}`}
                        style={{
                            borderColor: `${accent_color}80` // 50% opacity
                        }}
                    >
                        {isChatWindow && chatWindowPermissions?.can_view_flow === false ? (
                            // Chat window with no flow view permission - show nothing (chat is on the left)
                            <div className="flex justify-center items-center h-full bg-zinc-50 dark:bg-zinc-900">
                                <p className="text-zinc-400 dark:text-zinc-600">Chat mode only</p>
                            </div>
                        ) : showForm ? (
                            <Form/>
                        ) : showDocs ? (
                            <EnhancedDocs/>
                        ) : (
                            projectUuid ? (
                                <>
                                    {/* Editor Top Bar - visible when not in fullscreen, chat window, or chat mode */}
                                    {!isChatWindow && !chatMode && !isFullscreen && (
                                        <div className="absolute top-0 left-0 right-0 z-10">
                                            <EditorTopBar
                                                projectId={projectUuid}
                                            />
                                        </div>
                                    )}

                                    {/* Content area - below bar when visible */}
                                    <div className="absolute left-0 right-0 bottom-0" style={{
                                        top: (!isChatWindow && !chatMode && !isFullscreen) ? '33px' : '0'
                                    }}>
                                        {(routeUuid || scheduleUuid || chatWindowUuid || blueprintUuid || configUuid) ? (
                                            activeVersionId ? (
                                                <>
                                                    {/* Don't render DrawingLayer for chat windows or when group is open */}
                                                    {!isChatWindow && !openedGroup && <DrawingLayer />}

                                                    <Editor
                                                        key={'editor-' + activeVersionId}
                                                        readOnly={isChatWindow}
                                                    />

                                                    {/* Output panel toggle button - centered relative to editor area */}
                                                    {outputClosed && !chatMode && !isChatWindow && (chatWindowPermissions?.can_view_output !== false) && (
                                                        <button
                                                            type="button"
                                                            onClick={toggleCloseOutput}
                                                            className="absolute z-10 bottom-2 left-1/2 -translate-x-1/2 p-3 radius-bl-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm"
                                                        >
                                                            <ArrowRightEndOnRectangleIcon className="w-4 h-4 text-zinc-700 dark:text-white"/>
                                                        </button>
                                                    )}

                                                    {/* Only show menus for non-chat windows */}
                                                    {!chatMode && !isChatWindow && (
                                                        <>
                                                            <BottomDrawToolbar/>
                                                            <TopRightEditorListener/>
                                                            <TopLeftEditorMenu key={'top-left-editor-menu-' + activeVersionId}/>
                                                            <VersionPublishedMenu/>
                                                            <BottomLeftPlayMenu/>

                                                            {/* Floating AutosaveIndicator - centered relative to menu height */}
                                                            <div className="absolute bottom-1 right-2 z-[120] pointer-events-none flex items-center" style={{height: '52px'}}>
                                                                <AutosaveIndicator />
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* Minimal autosave indicator for chat windows */}
                                                    {isChatWindow && (
                                                        <>
                                                            <div className="absolute bottom-1 right-2 z-[120] pointer-events-none flex items-center" style={{height: '52px'}}>
                                                                <AutosaveIndicator />
                                                            </div>

                                                            {/* Collapse Editor Button - left side */}
                                                            {!chatEditorCollapsed && chatWindowPermissions?.can_view_flow !== false && (
                                                                <button
                                                                    onClick={() => setChatEditorCollapsed(true)}
                                                                    className="absolute top-2 left-2 z-[110] p-2 rounded bg-white dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700"
                                                                    title="Collapse editor"
                                                                >
                                                                    <ArrowRightEndOnRectangleIcon className="w-4 h-4 text-gray-700 dark:text-white" />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="flex justify-center items-center h-full">
                                                    <p className="text-white">Loading node setup...</p>
                                                </div>
                                            )
                                        ) : (
                                            <>
                                                <EmptyStatePanel />
                                                {/* Output panel toggle button - also available when no flow is open */}
                                                {outputClosed && !chatMode && !isChatWindow && (chatWindowPermissions?.can_view_output !== false) && (
                                                    <button
                                                        type="button"
                                                        onClick={toggleCloseOutput}
                                                        className="absolute z-10 bottom-2 left-1/2 -translate-x-1/2 p-3 radius-bl-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm"
                                                    >
                                                        <ArrowRightEndOnRectangleIcon className="w-4 h-4 text-zinc-700 dark:text-white"/>
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <EmptyStatePanel />
                                    {/* Output panel toggle button - also available when no project is loaded */}
                                    {outputClosed && !chatMode && !isChatWindow && (chatWindowPermissions?.can_view_output !== false) && (
                                        <button
                                            type="button"
                                            onClick={toggleCloseOutput}
                                            className="absolute z-10 bottom-2 left-1/2 -translate-x-1/2 p-3 radius-bl-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm"
                                        >
                                            <ArrowRightEndOnRectangleIcon className="w-4 h-4 text-zinc-700 dark:text-white"/>
                                        </button>
                                    )}
                                </>
                            )
                        )}
                    </div>
                    
                    {/* Loading Overlay for Flow Switching */}
                    {isLoadingFlow && (
                        <div
                            className="absolute inset-0 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                            style={{
                                backgroundColor: `${accent_color}4D` // 30% opacity
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="animate-spin h-6 w-6 border-2 border-t-transparent rounded-full"
                                    style={{ borderColor: accent_color, borderTopColor: 'transparent' }}
                                ></div>
                                <span className="dark:text-white font-medium" style={{ color: accent_color }}>Loading flow...</span>
                            </div>
                        </div>
                    )}
                </main>
                )}

                {/* Collapsed Editor Bar for /chat route */}
                {isChatWindow && chatEditorCollapsed && chatWindowPermissions?.can_view_flow !== false && (
                    <div
                        className="absolute top-0 bottom-0 w-[40px] bg-white dark:bg-zinc-800 border-l border-gray-200 dark:border-gray-700 flex items-center justify-center"
                        style={{
                            right: chatOutputCollapsed ? 40 : width.dock  // Position depends on dock
                        }}
                    >
                        <button
                            onClick={() => setChatEditorCollapsed(false)}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                            title="Expand editor"
                        >
                            <ArrowLeftEndOnRectangleIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Dock (Output) Panel for /chat route (right side) */}
                {isChatWindow && chatWindowPermissions?.can_view_output !== false && (
                    <>
                        {!chatOutputCollapsed ? (
                            <div style={{width: width.dock}} className="absolute top-0 right-0 bottom-0 overflow-scroll" data-panel="dock">
                                <div className="absolute inset-0">
                                    <DockTabs toggleClose={() => setChatOutputCollapsed(true)} />
                                </div>
                            </div>
                        ) : (
                            <div className="absolute top-0 right-0 bottom-0 w-[40px] bg-white dark:bg-zinc-800 border-l border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                <button
                                    onClick={() => setChatOutputCollapsed(false)}
                                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                                    title="Expand dock"
                                >
                                    <ArrowLeftEndOnRectangleIcon className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Don't render Dock for chat windows */}
                {!isChatWindow && !dockClosed && (chatWindowPermissions?.can_view_flow !== false) && (
                    <>
                        <div style={{width: width.dock}} className="absolute top-0 right-0 bottom-0 overflow-scroll" data-panel="dock">
                            <div className="absolute inset-0">
                                <DockTabs toggleClose={toggleCloseDock}/>
                            </div>
                            {!chatMode && (
                                <button
                                    onMouseDown={() => startResizing(ResizeWhat.Dock)}
                                    type="button"
                                    className="absolute top-0 left-0 bottom-0 w-[8px] cursor-col-resize"
                                />
                            )}
                        </div>
                    </>
                )}

                {!isChatWindow && dockClosed && (chatWindowPermissions?.can_view_flow !== false) && (
                    <button
                        type="button"
                        onClick={toggleCloseDock}
                        className="absolute z-10 top-1/2 -translate-y-1/2 right-0 p-3 radius-tr-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm"
                    >
                        <ArrowLeftEndOnRectangleIcon className="w-4 h-4 text-zinc-700 dark:text-white"/>
                    </button>
                )}
            </div>

            {/* Render Output panel when not in chat mode, not chat window, and permission allows */}
            {!isChatWindow && !outputClosed && !chatMode && (chatWindowPermissions?.can_view_output !== false) && (
                <div
                    className="absolute left-0 bottom-0 right-0" data-panel="bottom"
                    style={{height: windowHeight - height.horizontalEditorLayout}}
                >
                    <button
                        type="button"
                        onClick={toggleCloseOutput}
                        className={`absolute z-10 top-1 left-0.5 p-3`}
                    ><ArrowLeftEndOnRectangleIcon className="w-4 h-4 text-zinc-700 dark:text-white"/></button>
                    <button
                        onMouseDown={() => startResizing(ResizeWhat.Output)}
                        type="button"
                        className="absolute h-[8px] left-0 right-0 top-0 cursor-row-resize z-10"
                    />
                    <div
                        className="absolute top-0 left-0 right-0 bottom-0">
                        <BottomBar />
                    </div>
                </div>
            )}


            <ContextMenu/>
        </div>
    );
}

export {EditorLayout};
