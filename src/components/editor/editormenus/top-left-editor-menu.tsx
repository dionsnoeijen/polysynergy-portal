import React from "react";
import useEditorStore from "@/stores/editorStore";
import useMockStore from "@/stores/mockStore";
import {
    AdjustmentsHorizontalIcon,
    ArrowTurnDownLeftIcon,
    ArrowTurnDownRightIcon,
    ArrowUturnUpIcon,
    CursorArrowRaysIcon,
    PaintBrushIcon,
    PlayIcon,
    PlusIcon,
    StopIcon
} from "@heroicons/react/24/outline";
import {Divider} from "@/components/divider";
import {useKeyBindings} from "@/hooks/editor/useKeyBindings";
import {EditorMode, FormType} from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import {useHandlePlay} from "@/hooks/editor/useHandlePlay";

const TopLeftEditorMenu: React.FC = () => {
    const setShowAddingNode = useEditorStore((state) => state.setShowAddingNode);
    const openForm = useEditorStore((state) => state.openForm);

    const editorMode = useEditorStore((state) => state.editorMode);
    const setEditorMode = useEditorStore((state) => state.setEditorMode);

    const clearMockStore = useMockStore((state) => state.clearMockStore);
    const hasMockData = useMockStore((state) => state.hasMockData());
    const mainPlayNode = useNodesStore((state) => state.findMainPlayNode());
    const handlePlay = useHandlePlay();

    useKeyBindings({
        'c': () => {
            clearMockStore();
        },
        'b': () => {
            setEditorMode(EditorMode.BoxSelect);
        },
        'd': () => {
            if (editorMode === EditorMode.Draw) {
                setEditorMode(EditorMode.Select);
            } else {
                setEditorMode(EditorMode.Draw);
            }
        }
    });

    return (
        <div className="bg-zinc-800 bg-opacity-80 border border-white/25 p-2 rounded-xl absolute z-auto left-5 top-5 flex flex-col items-center justify-center">
            <div className="flex flex-col items-start justify-center w-full h-full">
                <button
                    className={`group w-full text-lg font-semibold text-white rounded p-2 bg-zinc-300 hover:bg-zinc-600`}
                    onMouseDown={() => setShowAddingNode(true)}
                >
                    <PlusIcon className={"w-4 h-4 text-zinc-800 group-hover:text-zinc-100"}/>
                </button>
            </div>

            <Divider className={'mt-1 mb-1'}/>

            <div className="flex flex-col items-start justify-center w-full h-full">
                <button
                    disabled={true}
                    className={`w-full text-lg font-semibold text-white rounded p-2`}
                >
                    <ArrowTurnDownLeftIcon className={"w-4 h-4"}/>
                </button>
                <button
                    disabled={true}
                    className={`w-full text-lg font-semibold text-white rounded p-2`}
                >
                    <ArrowTurnDownRightIcon className={"w-4 h-4"}/>
                </button>
            </div>

            <Divider className={'mt-1 mb-1'}/>

            <div className="flex flex-col items-start justify-center w-full h-full">
                <button
                    disabled={!hasMockData}
                    type="button"
                    className={`w-full text-lg font-semibold ${!hasMockData ? 'text-zinc-600' : 'text-white'} rounded p-2 ${!hasMockData ? 'bg-transparent' : 'bg-sky-500'}`}
                    onMouseDown={clearMockStore}
                >
                    <ArrowUturnUpIcon className="w-4 h-4" />
                </button>
                <button
                    disabled={!mainPlayNode}
                    type="button"
                    className={`w-full text-lg font-semibold text-white rounded p-2 hover:bg-zinc-600`}
                    onMouseDown={(e) => handlePlay(e, mainPlayNode?.id as string)}
                >
                    <PlayIcon className="w-4 h-4" />
                </button>
            </div>

            <Divider className={'mt-1 mb-1'} />

            <div className="flex flex-col items-start justify-center w-full h-full rounded hover:bg-zinc-600">
                <button
                    type="button"
                    className={`w-full text-lg font-semibold text-white rounded p-2`}
                    onMouseDown={() => openForm(FormType.PublishedVariableForm)}
                >
                    <AdjustmentsHorizontalIcon className="w-4 h-4" />
                </button>
            </div>

            <Divider className={'mt-1 mb-1'} />

            <div className="flex flex-col items-start justify-center w-full h-full rounded hover:bg-zinc-600">
                <button
                    type="button"
                    className={`w-full text-lg font-semibold text-white rounded p-2 ${editorMode === EditorMode.Draw ? 'bg-sky-500' : 'bg-transparent'}`}
                    onMouseDown={() => {setEditorMode(EditorMode.Draw)}}
                >
                    <PaintBrushIcon className="w-4 h-4" />
                </button>
            </div>

            <Divider className={'mt-1 mb-1'} />

            <div className="flex flex-col items-start justify-center w-full h-full">
                <button
                    type="button"
                    className={`w-full text-lg font-semibold text-white rounded p-2 hover:bg-zinc-600 ${editorMode === EditorMode.BoxSelect ? 'bg-sky-500' : 'bg-transparent'}`}
                    onMouseDown={() => {setEditorMode(EditorMode.BoxSelect)}}
                >
                    <StopIcon className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    className={`w-full text-lg font-semibold text-white rounded p-2 hover:bg-zinc-600 ${editorMode === EditorMode.Select ? 'bg-sky-500' : 'bg-transparent'}`}
                    onMouseDown={() => {setEditorMode(EditorMode.Select)}}
                >
                    <CursorArrowRaysIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default TopLeftEditorMenu;