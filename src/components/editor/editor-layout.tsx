'use client';

import React, { useEffect } from 'react';
import { ArrowLeftEndOnRectangleIcon, ArrowRightEndOnRectangleIcon } from "@heroicons/react/24/outline";
import dynamic from 'next/dynamic';

import ItemManager from "@/components/editor/sidebars/item-manager";
import DockTabs from "@/components/editor/sidebars/dock-tabs";
import Form from "@/components/editor/form";
import Docs from "@/components/editor/docs";
import BottomBar from "@/components/editor/bottombars/bottom-bar";
import ContextMenu from "@/components/editor/context-menu";
import VersionPublishedMenu from "@/components/editor/editormenus/version-published-menu";
import TopLeftEditorMenu from "@/components/editor/editormenus/top-left-editor-menu";
import TopRightEditorListener from "@/components/editor/editormenus/top-right-editor-listener";
import BottomDrawToolbar from "@/components/editor/editormenus/bottom-draw-toolbar";
import ItemManagerIntroTour from "@/components/guidedtour/item-manager-intro-tour";

import { useLayoutPanels } from "@/hooks/editor/useLayoutPanels";
import { useLayoutResizing } from "@/hooks/editor/useLayoutResizing";
import { useRouteSetup } from "@/hooks/editor/useRouteSetup";
import { useDebugTools } from "@/hooks/editor/useDebugTools";
import { useLayoutEventHandlers } from "@/hooks/editor/useLayoutEventHandlers";
import { useLayoutState } from "@/hooks/editor/useLayoutState";

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
        fetchAvailableNodes
    } = useLayoutState();

    // Initialize window dimensions
    useEffect(() => {
        setWindowDimensions(window.innerHeight, window.innerHeight * 0.6);
        const handleResize = () => setWindowDimensions(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [fetchAvailableNodes, setWindowDimensions]);

    // Enhanced toggle functions with editor position updates
    const handleToggleItemManager = () => {
        toggleCloseItemManager();
        setTimeout(() => {
            updateEditorPosition();
        }, 200);
    };

    return (
        <div className="absolute top-0 right-0 bottom-0 left-0 bg-zinc-100 dark:bg-zinc-900">
            {/*<PerformanceHUD />*/}
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
                 style={{height: outputClosed ? windowHeight - 10 : height.horizontalEditorLayout}}>
                {!itemManagerClosed && (
                    <div style={{width: width.itemManager}} className="absolute top-0 left-0 bottom-0" data-panel="item-manager">
                        <div className="absolute inset-[10px]">
                            <ItemManager toggleClose={handleToggleItemManager}/>
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
                    className="absolute z-10 top-[10px] left-0 p-3 radius-tl-0"
                ><ArrowRightEndOnRectangleIcon className="w-4 h-4 text-white"/></button>)}

                <main className="absolute top-0 bottom-0" data-panel="main" style={{
                    left: itemManagerClosed ? 10 : width.itemManager,
                    right: dockClosed ? 10 : width.dock
                }}>
                    <div
                        className={`absolute top-[10px] left-0 right-0 bottom-0 ${isFormOpen() || showDocs ? 'overflow-scroll' : 'overflow-hidden'} border border-sky-500/50 dark:border-white/20 shadow-sm rounded-md ${showForm ? 'bg-white dark:bg-zinc-800' : 'bg-white dark:bg-zinc-700'}`}
                    >
                        {showForm ? (
                            <Form/>
                        ) : showDocs ? (
                            <Docs/>
                        ) : (
                            projectUuid && (routeUuid || scheduleUuid || blueprintUuid || configUuid) ? (
                                activeVersionId ? (
                                    <>
                                        <DrawingLayer />
                                        <Editor key={'editor-' + activeVersionId}/>
                                        <BottomDrawToolbar/>
                                        <TopRightEditorListener/>
                                        <TopLeftEditorMenu key={'top-left-editor-menu-' + activeVersionId}/>
                                        <VersionPublishedMenu/>
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
                </main>

                {!dockClosed && (
                    <>
                        <div style={{width: width.dock}} className="absolute top-0 right-0 bottom-0 overflow-scroll" data-panel="dock">
                            <div className="absolute inset-[10px]">
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
                        className="absolute z-10 top-[10px] right-0 p-3 radius-tr-0"
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
                        className={`absolute z-10 top-[10px] right-[10px] p-3 radius-bl-0`}
                    ><ArrowLeftEndOnRectangleIcon className="w-4 h-4 text-white"/></button>
                    <button
                        onMouseDown={() => startResizing(ResizeWhat.Output)}
                        type="button"
                        className="absolute h-[8px] left-0 right-0 top-0 cursor-row-resize z-10"
                    />
                    <div
                        className="absolute top-[10px] left-[10px] right-[10px] bottom-[10px]">
                        <BottomBar/>
                    </div>
                </div>
            )}

            {outputClosed && (
                <button
                    type="button"
                    onClick={toggleCloseOutput}
                    className="absolute z-10 bottom-[10px] right-[10px] p-3 radius-bl-0"
                >
                    <ArrowRightEndOnRectangleIcon className="w-4 h-4 text-white"/>
                </button>
            )}

            <ContextMenu/>
        </div>
    );
}

export {EditorLayout};
