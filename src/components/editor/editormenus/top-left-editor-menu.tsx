import React from "react";
import useEditorStore from "@/stores/editorStore";
import useMockStore from "@/stores/mockStore";
import {
    AdjustmentsHorizontalIcon,
    ArrowUturnUpIcon,
    CursorArrowRaysIcon,
    // PaintBrushIcon,
    PlayIcon,
    PlusIcon,
    StopIcon
} from "@heroicons/react/24/outline";
import {Divider} from "@/components/divider";
import {useKeyBindings} from "@/hooks/editor/useKeyBindings";
import {EditorMode, FormType} from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import {useHandlePlay} from "@/hooks/editor/useHandlePlay";
import Image from "next/image";

const TopLeftEditorMenu: React.FC = () => {
    const setShowAddingNode = useEditorStore((state) => state.setShowAddingNode);
    const openForm = useEditorStore((state) => state.openForm);

    const editorMode = useEditorStore((state) => state.editorMode);
    const setEditorMode = useEditorStore((state) => state.setEditorMode);

    const clearMockStore = useMockStore((state) => state.clearMockStore);
    const hasMockData = useMockStore((state) => state.hasMockData);
    const mainPlayNode = useNodesStore((state) => state.findMainPlayNode());
    const handlePlay = useHandlePlay();

    useKeyBindings({
        'ctrl+z': {
            handler: () => {
                console.info('Not yet implemented');
                // useHistoryStore.getState().undo();
            }
        },
        'shift+ctrl+z': {
            handler: () => {
                console.info('Not yet implemented');
                // useHistoryStore.getState().redo();
            }
        },
        'c': {
            handler: () => {
                clearMockStore();
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
                    setEditorMode(EditorMode.Select);
                } else {
                    setEditorMode(EditorMode.Draw);
                }
            },
        }
    });

    return (
        <div className={`absolute z-auto left-5 top-5`}>
            <div
                className="bg-sky-50 dark:bg-zinc-800/80 border border-sky-500/60 dark:border-white/25 p-2 rounded-xl flex flex-col items-center justify-center">

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

                {/*<div className="flex flex-col items-start justify-center w-full h-full">*/}
                {/*    <button*/}
                {/*        disabled={true}*/}
                {/*        className={`w-full text-lg font-semibold text-white rounded p-2`}*/}
                {/*        title={'Undo'}*/}
                {/*    >*/}
                {/*        <ArrowTurnDownLeftIcon className={"w-4 h-4"}/>*/}
                {/*    </button>*/}
                {/*    <button*/}
                {/*        disabled={true}*/}
                {/*        className={`w-full text-lg font-semibold text-white rounded p-2`}*/}
                {/*        title={'Redo'}*/}
                {/*    >*/}
                {/*        <ArrowTurnDownRightIcon className={"w-4 h-4"}/>*/}
                {/*    </button>*/}
                {/*</div>*/}

                {/*<Divider className={'mt-1 mb-1'}/>*/}

                <div className="flex flex-col items-start justify-center w-full h-full">
                    <button
                        disabled={!hasMockData}
                        type="button"
                        className={`w-full text-lg font-semibold ${!hasMockData ? 'text-sky-500 dark:text-zinc-600' : 'text-white'} rounded p-2 ${!hasMockData ? 'bg-transparent' : 'bg-sky-500'}`}
                        onMouseDown={clearMockStore}
                        title={'Clear mock data'}
                        data-tour-id="clear-mock-data-button"
                    >
                        <ArrowUturnUpIcon className="w-4 h-4"/>
                    </button>
                    <button
                        disabled={!mainPlayNode}
                        type="button"
                        className={`w-full text-lg font-semibold text-sky-500 hover:text-white dark:text-white rounded p-2 hover:bg-sky-300 dark:hover:bg-zinc-600`}
                        onMouseDown={(e) => handlePlay(e, mainPlayNode?.id as string)}
                        title={'Play'}
                        data-tour-id="main-play-button"
                    >
                        <PlayIcon className="w-4 h-4"/>
                    </button>
                </div>

                <Divider className={'mt-1 mb-1'}/>

                <div className="flex flex-col items-start justify-center w-full h-full rounded hover:bg-zinc-600">
                    <button
                        type="button"
                        className={`w-full text-lg font-semibold text-sky-500 hover:text-white dark:text-white rounded p-2 hover:bg-sky-300 dark:hover:bg-zinc-600`}
                        onMouseDown={() => openForm(FormType.PublishedVariableForm)}
                        title={'Published variables'}
                        data-tour-id="published-variable-button"
                    >
                        <AdjustmentsHorizontalIcon className="w-4 h-4"/>
                    </button>
                </div>

                <Divider className={'mt-1 mb-1'}/>

                {/*<div className="flex flex-col items-start justify-center w-full h-full rounded hover:bg-zinc-600">*/}
                {/*    <button*/}
                {/*        type="button"*/}
                {/*        className={`w-full text-lg font-semibold text-white rounded p-2 ${editorMode === EditorMode.Draw ? 'bg-sky-500' : 'bg-transparent'}`}*/}
                {/*        onMouseDown={() => {*/}
                {/*            setEditorMode(EditorMode.Draw)*/}
                {/*        }}*/}
                {/*        title={'Draw'}*/}
                {/*    >*/}
                {/*        <PaintBrushIcon className="w-4 h-4"/>*/}
                {/*    </button>*/}
                {/*</div>*/}

                {/*<Divider className={'mt-1 mb-1'}/>*/}

                <div className="flex flex-col items-start justify-center w-full h-full">
                    <button
                        type="button"
                        className={`w-full text-lg font-semibold  text-sky-500 hover:text-white dark:text-white rounded p-2 hover:bg-sky-300 dark:hover:bg-zinc-600 ${editorMode === EditorMode.BoxSelect ? 'bg-sky-500 text-white' : 'bg-transparent'}`}
                        onMouseDown={() => {
                            setEditorMode(EditorMode.BoxSelect)
                        }}
                        title={'Box select'}
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
                        title={'Select'}
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