'use client';

import React, {useCallback, useEffect, useState} from 'react';
import {ArrowLeftEndOnRectangleIcon, ArrowRightEndOnRectangleIcon} from "@heroicons/react/24/outline";
import {usePathname} from "next/navigation";
import {useAutoFetch} from "@/hooks/editor/useAutoFetch";

import ItemManager from "@/components/editor/sidebars/item-manager";
import Dock from "@/components/editor/sidebars/dock";
import Form from "@/components/editor/form";
import Docs from "@/components/editor/docs";
import BottomBar from "@/components/editor/bottombars/bottom-bar";
import ContextMenu from "@/components/editor/context-menu";
import dynamic from 'next/dynamic';
import VersionPublishedMenu from "@/components/editor/editormenus/version-published-menu";
import fetchAndApplyNodeSetup from "@/utils/fetchNodeSetup";
import TopLeftEditorMenu from "@/components/editor/editormenus/top-left-editor-menu";
import TopRightEditorListener from "@/components/editor/editormenus/top-right-editor-listener";
import BottomDrawToolbar from "@/components/editor/editormenus/bottom-draw-toolbar";

import useEditorStore from "@/stores/editorStore";
import useAvailableNodeStore from "@/stores/availableNodesStore";
import useMockStore from "@/stores/mockStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useNodesStore from "@/stores/nodesStore";
import EditorIntroTour from "@/components/guidedtour/editor-intro-tour";
import ItemManagerIntroTour from "@/components/guidedtour/item-manager-intro-tour";

// const DrawingLayer = dynamic(() => import('@/components/editor/drawing/drawing-layer'), { ssr: false })
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

    enum ResizeWhat {
        ItemManager = 'itemManager',
        Dock = 'dock',
        Output = 'output',
    }

    const fetchAvailableNodes = useAvailableNodeStore((state) => state.fetchAvailableNodes);

    const [resizing, setResizing] = useState<ResizeWhat | null>(null);
    const [width, setWidth] = useState({itemManager: 256, dock: 256});
    const [height, setHeight] = useState({horizontalEditorLayout: 0});
    const [windowHeight, setWindowHeight] = useState(0);

    const [itemManagerClosed, setItemManagerClosed] = useState(false);
    const [dockClosed, setDockClosed] = useState(false);
    const [outputClosed, setOutputClosed] = useState(false);

    const showForm = useEditorStore((state) => state.showForm);
    const isFormOpen = useEditorStore((state) => state.isFormOpen);
    const showDocs = useEditorStore((state) => state.showDocs);
    const setActiveProjectId = useEditorStore((state) => state.setActiveProjectId);
    const setActiveRouteId = useEditorStore((state) => state.setActiveRouteId);
    const setActiveScheduleId = useEditorStore((state) => state.setActiveScheduleId);
    const setActiveBlueprintId = useEditorStore((state) => state.setActiveBlueprintId);
    const setActiveConfigId = useEditorStore((state) => state.setActiveConfigId);
    const setIsExecuting = useEditorStore((state) => state.setIsExecuting);
    const activeVersionId = useEditorStore((state) => state.activeVersionId);
    const closeFormMessage = useEditorStore((state) => state.closeFormMessage);
    const setEditorPosition = useEditorStore((state) => state.setEditorPosition);
    const nodeToMoveToGroupId = useEditorStore((state) => state.nodeToMoveToGroupId);
    const setNodeToMoveToGroupId = useEditorStore((state) => state.setNodeToMoveToGroupId);
    const pathname = usePathname();
    const clearMockStore = useMockStore((state) => state.clearMockStore);

    const removeNode = useNodesStore((state) => state.removeNode);
    const removeConnectionById = useConnectionsStore((state) => state.removeConnectionById);

    const isExecuting = useEditorStore((state) => state.isExecuting);

    useEffect(() => {
        clearMockStore();
    }, [clearMockStore, pathname]);

    useEffect(() => {
        setHeight({horizontalEditorLayout: window.innerHeight * 0.85});
        setWindowHeight(window.innerHeight);

        fetchAvailableNodes();

        const handleResize = () => setWindowHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [fetchAvailableNodes]);

    useEffect(() => {
        setActiveProjectId(projectUuid || '');
    }, [projectUuid, setActiveProjectId]);

    useEffect(() => {
        if (!routeUuid) return;

        setActiveBlueprintId('');
        setActiveScheduleId('');
        setActiveConfigId('');
        setActiveRouteId(routeUuid);

        fetchAndApplyNodeSetup({routeId: routeUuid});
        setIsExecuting(null);
    }, [routeUuid, setActiveBlueprintId, setActiveScheduleId, setActiveConfigId, setActiveRouteId, setIsExecuting]);

    useEffect(() => {
        if (!scheduleUuid) return;

        setActiveRouteId('');
        setActiveBlueprintId('');
        setActiveConfigId('');
        setActiveScheduleId(scheduleUuid);

        fetchAndApplyNodeSetup({scheduleId: scheduleUuid});
        setIsExecuting(null);
    }, [scheduleUuid, setActiveRouteId, setActiveBlueprintId, setActiveConfigId, setActiveScheduleId, setIsExecuting]);

    useEffect(() => {
        if (!blueprintUuid) return;

        setActiveRouteId('');
        setActiveScheduleId('');
        setActiveConfigId('');
        setActiveBlueprintId(blueprintUuid);

        fetchAndApplyNodeSetup({blueprintId: blueprintUuid});
        setIsExecuting(null);
    }, [blueprintUuid, setActiveRouteId, setActiveScheduleId, setActiveConfigId, setActiveBlueprintId, setIsExecuting]);

    useEffect(() => {
        if (!configUuid) return;

        setActiveRouteId('');
        setActiveScheduleId('');
        setActiveBlueprintId('');
        setActiveConfigId(configUuid);

        fetchAndApplyNodeSetup({configId: configUuid});
        setIsExecuting(null);
    }, [configUuid, setActiveRouteId, setActiveScheduleId, setActiveBlueprintId, setActiveConfigId, setIsExecuting]);

    useAutoFetch();

    const updateEditorPosition = useCallback(() => {
        const editor = document.querySelector('[data-type="editor"]') as HTMLElement;
        if (editor) {
            const rect = editor.getBoundingClientRect();
            setEditorPosition({x: rect.left, y: rect.top});
        }
    }, [setEditorPosition]);

    const startResizing = useCallback((resizeWhat: ResizeWhat) => {
        setResizing(resizeWhat);
        document.body.style.cursor = resizeWhat === ResizeWhat.Output ? 'row-resize' : 'col-resize';
    }, [ResizeWhat.Output]);

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
                    setWidth((prev) => ({...prev, itemManager: Math.max(newWidth, 100)}));
                } else if (resizing === ResizeWhat.Dock) {
                    const dockWidth = window.innerWidth - newWidth;
                    setWidth((prev) => ({...prev, dock: Math.max(dockWidth, 100)}));
                } else if (resizing === ResizeWhat.Output) {
                    setHeight((prev) => ({...prev, horizontalEditorLayout: Math.max(newHeight, 100)}));
                }
            }
        },
        [
            updateEditorPosition,
            ResizeWhat.Dock,
            ResizeWhat.ItemManager,
            ResizeWhat.Output,
            resizing
        ]
    );

    useEffect(() => {
        if (typeof window !== "undefined") {
            window.debugMode = false;
            window.toggleDebug = function () {
                window.debugMode = !window.debugMode;
                console.log("Debug mode is:", window.debugMode);
            };
            // @ts-expect-error value is ambiguous
            window.snipeConnection = function (connectionId: string) {
                console.log('SNIPE', connectionId);
                removeConnectionById(connectionId);
            }

            // @ts-expect-error value is ambiguous
            window.snipeNode = function (nodeId: string) {
                console.log('SNIPE', nodeId);
                removeNode(nodeId);
            }
        }

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
    }, [resizing, handleMouseMove, stopResizing, removeConnectionById, removeNode]);

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

    const toggleCloseItemManager = () => {
        setItemManagerClosed(prev => !prev);
        setTimeout(() => {
            updateEditorPosition();
        }, 200);
    };

    const toggleCloseDock = () => {
        setDockClosed(prev => !prev);
    };

    const toggleCloseOutput = () => {
        setOutputClosed(prev => !prev);
    };

    return (
        <div className="absolute top-0 right-0 bottom-0 left-0 bg-zinc-100 dark:bg-zinc-900">
            <ItemManagerIntroTour />
            {isExecuting && (
                // This is to make sure interactions are blocked during execution
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                </div>
            )}
            {closeFormMessage && (
                <>
                    <div className="z-20 fixed top-0 left-0 right-0 h-[1px] bg-green-500 animate-progress"></div>
                    <div
                        className="z-20 fixed top-2 left-1/2 sm:max-w-md bg-green-100 text-green-800 p-4 rounded-md shadow-lg animate-fade-in-out">
                        {closeFormMessage}
                    </div>
                </>
            )}
            <div className="absolute top-0 right-0 left-0"
                 style={{height: outputClosed ? windowHeight - 10 : height.horizontalEditorLayout}}>
                {!itemManagerClosed && (
                    <div style={{width: width.itemManager}} className="absolute top-0 left-0 bottom-0">
                        <div className="absolute inset-[10px]">
                            <ItemManager toggleClose={toggleCloseItemManager}/>
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
                    onClick={toggleCloseItemManager}
                    className="absolute z-10 top-[10px] left-0 p-3 radius-tl-0"
                ><ArrowRightEndOnRectangleIcon className="w-4 h-4 text-white"/></button>)}

                <main className="absolute top-0 bottom-0" style={{
                    left: itemManagerClosed ? 10 : width.itemManager,
                    right: dockClosed ? 10 : width.dock
                }}>
                    <div
                        className={`absolute top-[10px] left-0 right-0 bottom-0 ${isFormOpen() || showDocs ? 'overflow-scroll' : 'overflow-hidden'} border border-sky-500 dark:border-white/20 shadow-sm rounded-md ${showForm ? 'bg-white dark:bg-zinc-800' : 'bg-white dark:bg-zinc-700'}`}
                    >
                        {showForm ? (
                            <Form/>
                        ) : showDocs ? (
                            <Docs/>
                        ) : (
                            projectUuid && (routeUuid || scheduleUuid || blueprintUuid || configUuid) ? (
                                activeVersionId ? (
                                    <>
                                        {/*<DrawingLayer panPosition={panPosition} zoomFactor={zoomFactor} />*/}
                                        <Editor key={'editor-' + activeVersionId}/>
                                        <BottomDrawToolbar/>
                                        <TopRightEditorListener />
                                        <TopLeftEditorMenu key={'top-left-editor-menu-' + activeVersionId}/>
                                        <VersionPublishedMenu routeUuid={routeUuid} scheduleUuid={scheduleUuid}/>
                                    </>
                                ) : (
                                    <div className="flex justify-center items-center h-full">
                                        <p className="text-white">Loading node setup... AVID: {activeVersionId}</p>
                                    </div>
                                )
                            ) : (
                                <div className="flex justify-center items-center h-full">
                                    <p className="text-white">
                                        Select a route, schedule or blueprint to start editing nodes
                                    </p>
                                </div>
                            )
                        )}
                    </div>
                </main>

                {!dockClosed && (
                    <>
                        <div style={{width: width.dock}} className="absolute top-0 right-0 bottom-0 overflow-scroll">
                            <div className="absolute inset-[10px]">
                                <Dock toggleClose={toggleCloseDock}/>
                            </div>
                            <button
                                onMouseDown={() => startResizing(ResizeWhat.Dock)}
                                type="button"
                                className="absolute top-0 left-0 bottom-0 w-[8px] cursor-col-resize"
                            />
                        </div>
                        <div
                            style={{width: width.dock}}
                            className="absolute right-0 bottom-0 h-4 bg-gradient-to-t from-[#18181BFF] to-transparent"
                        />
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
                    className="absolute left-0 bottom-0 right-0"
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
