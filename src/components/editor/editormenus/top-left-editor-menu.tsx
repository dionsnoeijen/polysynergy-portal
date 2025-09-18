import React from "react";
import useEditorStore from "@/stores/editorStore";
import useDrawingStore from "@/stores/drawingStore";
import {
    CursorArrowRaysIcon,
    PaintBrushIcon,
    PlusIcon,
    StopIcon,
    ArrowUturnLeftIcon,
    ArrowUturnRightIcon,
    HandRaisedIcon
} from "@heroicons/react/24/outline";
import {Divider} from "@/components/divider";
import {useKeyBindings} from "@/hooks/editor/useKeyBindings";
import {EditorMode} from "@/types/types";
import Image from "next/image";
import useChatViewStore from "@/stores/chatViewStore";
import { useHistoryStore } from "@/stores/historyStore";

const TopLeftEditorMenu: React.FC = () => {
    const setShowAddingNode = useEditorStore((state) => state.setShowAddingNode);
    const editorMode = useEditorStore((state) => state.editorMode);
    const setEditorMode = useEditorStore((state) => state.setEditorMode);
    const clearBubbles = useChatViewStore((state) => state.clearBubbles);
    const clearAccordionAndMockData = useEditorStore((state) => state.clearAccordionAndMockData);
    
    // Drawing store
    const setCurrentTool = useDrawingStore((state) => state.setCurrentTool);
    const setSelectedObject = useDrawingStore((state) => state.setSelectedObject);
    
    // History store hooks
    const undo = useHistoryStore((state) => state.undo);
    const redo = useHistoryStore((state) => state.redo);
    
    // Get state values directly to ensure reactivity
    const undoStack = useHistoryStore((state) => state.undoStack);
    const redoStack = useHistoryStore((state) => state.redoStack);
    const history = useHistoryStore((state) => state.history);
    const future = useHistoryStore((state) => state.future);
    const isEnabled = useHistoryStore((state) => state.isEnabled);
    const isBatching = useHistoryStore((state) => state.isBatching);
    
    // Compute can undo/redo locally to ensure reactivity
    const canUndo = (undoStack.length > 0 || history.length > 0) && isEnabled && !isBatching;
    const canRedo = (redoStack.length > 0 || future.length > 0) && isEnabled && !isBatching;
    
    // Get last action for tooltip
    const lastAction = undoStack[undoStack.length - 1] || null;

    useKeyBindings({
        'ctrl+z': {
            handler: () => {
                if (canUndo) {
                    undo();
                }
            }
        },
        'shift+ctrl+z': {
            handler: () => {
                if (canRedo) {
                    redo();
                }
            }
        },
        'c': {
            handler: () => {
                clearAccordionAndMockData();
                clearBubbles();
            },
        },
        'b': {
            handler: () => {
                setEditorMode(EditorMode.BoxSelect);
            },
        },
        'd': {
            handler: () => {
                if (editorMode === EditorMode.Draw) {
                    // Exit draw mode: deselect objects and go to select mode
                    setSelectedObject(null);
                    setEditorMode(EditorMode.Select);
                } else {
                    // Enter draw mode: activate select tool and deselect objects
                    setCurrentTool('select');
                    setSelectedObject(null);
                    setEditorMode(EditorMode.Draw);
                }
            },
        }
    });

    return (
        <div className={`absolute z-[50] left-2 top-2`}>
            <div
                className="bg-sky-50 dark:bg-zinc-800/80 border border-sky-500/60 dark:border-white/25 p-2 rounded-lg flex flex-col items-center justify-center">

                <Image src="/ps-logo-simple-color.svg" alt="Logo" className="w-8 h-8 mb-1" width={40} height={40}/>

                <Divider className={'mt-1 mb-1'}/>

                <div className="flex flex-col items-start justify-center w-full h-full">
                    <button
                        className={`group w-full text-lg font-semibold text-white rounded p-2 bg-sky-100 hover:bg-sky-200 dark:bg-zinc-300 dark:hover:bg-zinc-600`}
                        onMouseDown={() => setShowAddingNode(true)}
                        title={'Add node'}
                        data-tour-id="add-node-button"
                    >
                        <PlusIcon className={"w-4 h-4 text-sky-500 dark:text-zinc-800 group-hover:hover:text-sky-600 dark:group-hover:text-zinc-100"}/>
                    </button>
                </div>

                <Divider className={'mt-1 mb-1'}/>

                <div className="flex flex-col items-start justify-center w-full h-full">
                    <button
                        disabled={!canUndo}
                        className={`w-full text-lg font-semibold rounded p-2 ${
                            canUndo 
                                ? 'text-sky-500 hover:text-white dark:text-white hover:bg-sky-300 dark:hover:bg-zinc-600 bg-transparent' 
                                : 'text-gray-400 dark:text-gray-500 bg-transparent cursor-not-allowed'
                        }`}
                        title={canUndo ? `Undo: ${lastAction?.description || 'Last action'}` : 'Undo (Ctrl+Z)'}
                        onClick={() => canUndo && undo()}
                        data-tour-id="undo-button"
                    >
                        <ArrowUturnLeftIcon className="w-4 h-4"/>
                    </button>
                    <button
                        disabled={!canRedo}
                        className={`w-full text-lg font-semibold rounded p-2 ${
                            canRedo 
                                ? 'text-sky-500 hover:text-white dark:text-white hover:bg-sky-300 dark:hover:bg-zinc-600 bg-transparent' 
                                : 'text-gray-400 dark:text-gray-500 bg-transparent cursor-not-allowed'
                        }`}
                        title={canRedo ? 'Redo (Shift+Ctrl+Z)' : 'Redo (Shift+Ctrl+Z)'}
                        onClick={() => canRedo && redo()}
                        data-tour-id="redo-button"
                    >
                        <ArrowUturnRightIcon className="w-4 h-4"/>
                    </button>
                </div>

                <Divider className={'mt-1 mb-1'}/>


                <div className="flex flex-col items-start justify-center w-full h-full rounded hover:bg-zinc-600">
                    <button
                        type="button"
                        className={`w-full text-lg font-semibold rounded p-2 ${editorMode === EditorMode.Draw ? 'bg-sky-500 text-white' : 'text-sky-500 hover:text-white dark:text-white hover:bg-sky-300 dark:hover:bg-zinc-600 bg-transparent'}`}
                        onMouseDown={() => {
                            if (editorMode === EditorMode.Draw) {
                                // Exit draw mode: deselect objects and go to select mode
                                setSelectedObject(null);
                                setEditorMode(EditorMode.Select);
                            } else {
                                // Enter draw mode: activate select tool and deselect objects
                                setCurrentTool('select');
                                setSelectedObject(null);
                                setEditorMode(EditorMode.Draw);
                            }
                        }}
                        title={'Draw (D)'}
                        data-tour-id="draw-button"
                    >
                        <PaintBrushIcon className="w-4 h-4"/>
                    </button>
                </div>

                <Divider className={'mt-1 mb-1'}/>

                <div className="flex flex-col items-start justify-center w-full h-full">
                    <button
                        type="button"
                        className={`w-full text-lg font-semibold  text-sky-500 hover:text-white dark:text-white rounded p-2 hover:bg-sky-300 dark:hover:bg-zinc-600 ${editorMode === EditorMode.Pan ? 'bg-sky-500 text-white' : 'bg-transparent'}`}
                        onMouseDown={() => {
                            setEditorMode(EditorMode.Pan)
                        }}
                        title={'Pan mode - Click and drag to pan canvas (Space)'}
                        data-tour-id="pan-button"
                    >
                        <HandRaisedIcon className="w-4 h-4"/>
                    </button>
                    <button
                        type="button"
                        className={`w-full text-lg font-semibold  text-sky-500 hover:text-white dark:text-white rounded p-2 hover:bg-sky-300 dark:hover:bg-zinc-600 ${editorMode === EditorMode.BoxSelect ? 'bg-sky-500 text-white' : 'bg-transparent'}`}
                        onMouseDown={() => {
                            setEditorMode(EditorMode.BoxSelect)
                        }}
                        title={'Box select (B)'}
                        data-tour-id="box-select-button"
                    >
                        <StopIcon className="w-4 h-4"/>
                    </button>
                    <button
                        type="button"
                        className={`w-full text-lg font-semibold  text-sky-500 hover:text-white dark:text-white rounded p-2 hover:bg-sky-300 dark:hover:bg-zinc-600 ${editorMode === EditorMode.Select ? 'bg-sky-500 text-white' : 'bg-transparent'}`}
                        onMouseDown={() => {
                            setEditorMode(EditorMode.Select)
                        }}
                        title={'Select mode - Click nodes to select'}
                        data-tour-id="pointer-select-button"
                    >
                        <CursorArrowRaysIcon className="w-4 h-4"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TopLeftEditorMenu;