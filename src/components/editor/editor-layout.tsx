'use client';

import React, {useCallback, useEffect, useState} from 'react';
import {ArrowLeftEndOnRectangleIcon, ArrowRightEndOnRectangleIcon} from "@heroicons/react/24/outline";
import ItemManager from "@/components/editor/sidebars/item-manager";
import Dock from "@/components/editor/sidebars/dock";
import useEditorStore from "@/stores/editorStore";
import Form from "@/components/editor/form";
import SelectionsMenu from "@/components/editor/editormenus/selections-menu";
import UndoRedoMenu from "@/components/editor/editormenus/undo-redo-menu";
import BottomBar from "@/components/editor/bottombars/bottom-bar";
import ContextMenu from "@/components/editor/context-menu";
import dynamic from 'next/dynamic';
import VersionPublishedMenu from "@/components/editor/editormenus/version-published-menu";
import fetchAndApplyNodeSetup from "@/utils/fetchNodeSetup";

const Editor = dynamic(() => import('@/components/editor/editor'), {
    ssr: false
});

export function EditorLayout({
    projectUuid = null,
    routeUuid = null,
    scheduleUuid = null,
}: {
    projectUuid?: null | string,
    routeUuid?: null | string,
    scheduleUuid?: null | string,
}) {

    enum ResizeWhat {
        ItemManager = 'itemManager',
        Dock = 'dock',
        Output = 'output',
    }

    const [resizing, setResizing] = useState<ResizeWhat | null>(null);
    const [width, setWidth] = useState({itemManager: 256, dock: 256});
    const [height, setHeight] = useState({horizontalEditorLayout: 0});
    const [windowHeight, setWindowHeight] = useState(0);

    const [itemManagerClosed, setItemManagerClosed] = useState(false);
    const [dockClosed, setDockClosed] = useState(false);
    const [outputClosed, setOutputClosed] = useState(false);

    const {
        showForm,
        setActiveProjectId,
        setActiveRouteId,
        setActiveScheduleId,
        activeVersionId,
        closeFormMessage
    } = useEditorStore();

    useEffect(() => {
        setHeight({horizontalEditorLayout: window.innerHeight * 0.85});
        setWindowHeight(window.innerHeight);

        setActiveProjectId(projectUuid || '');
        if (routeUuid) {
            setActiveRouteId(routeUuid);
            fetchAndApplyNodeSetup(routeUuid);
        }
        if (scheduleUuid) {
            setActiveScheduleId(scheduleUuid);
            // idem als je schedule-nodes wilt laden
            // fetchScheduleNodeSetupContent(scheduleUuid); // als je zoiets hebt
        }

        const handleResize = () => {
            setWindowHeight(window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [projectUuid, routeUuid, scheduleUuid]);


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
    }, [resizing, handleMouseMove, stopResizing]);

    const toggleCloseItemManager = () => {
        setItemManagerClosed(prev => !prev);
    };

    const toggleCloseDock = () => {
        setDockClosed(prev => !prev);
    };

    const toggleCloseOutput = () => {
        setOutputClosed(prev => !prev);
    };

    return (
        <div className="absolute top-0 right-0 bottom-0 left-0 bg-zinc-100 dark:bg-zinc-900">

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
                    <div style={{width: width.itemManager}} className="absolute top-0 left-0 bottom-0 max-lg:hidden">
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
                        className={`absolute top-[10px] left-0 right-0 bottom-0 overflow-scroll border border-sky-500 dark:border-white/20 shadow-sm rounded-md ${showForm ? 'bg-white dark:bg-zinc-800' : 'bg-white dark:bg-zinc-700'}`}
                    >
                        {showForm ? (
                            <Form />
                        ) : (
                            projectUuid && routeUuid ? (
                                activeVersionId ? (
                                    <>
                                        <Editor />
                                        <SelectionsMenu />
                                        <UndoRedoMenu />
                                        <VersionPublishedMenu />
                                    </>
                                ) : (
                                    <div className="flex justify-center items-center h-full">
                                        <p className="text-white">Loading node data...</p>
                                    </div>
                                )
                            ) : (
                                <div className="flex justify-center items-center h-full">
                                    <p className="text-white">Select a route or schedule to start editing nodes</p>
                                </div>
                            )
                        )}
                    </div>
                </main>

                {!dockClosed && (
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
