import React, {useCallback} from "react";
import useEditorStore from "@/stores/editorStore";
import useMockStore from "@/stores/mockStore";
import {
    AdjustmentsHorizontalIcon,
    ArrowTurnDownLeftIcon,
    ArrowTurnDownRightIcon
} from "@heroicons/react/24/outline";
import {Divider} from "@/components/divider";
import {useKeyBindings} from "@/hooks/editor/useKeyBindings";
import {ArrowUturnUpIcon, PlusIcon, CursorArrowRaysIcon, StopIcon} from "@heroicons/react/16/solid";
import {FormType} from "@/types/types";

const TopLeftEditorMenu: React.FC = () => {

    const clickSelect = useEditorStore((state) => state.clickSelect);
    const boxSelect = useEditorStore((state) => state.boxSelect);
    const setClickSelect = useEditorStore((state) => state.setClickSelect);
    const setBoxSelect = useEditorStore((state) => state.setBoxSelect);
    const setShowAddingNode = useEditorStore((state) => state.setShowAddingNode);
    const openForm = useEditorStore((state) => state.openForm);

    const handleClickSelect = useCallback(() => {
        setBoxSelect(false);
        setClickSelect(true);
    }, [setBoxSelect, setClickSelect]);

    const handleBoxSelect = useCallback(() => {
        setClickSelect(false);
        setBoxSelect(true);
    }, [setClickSelect, setBoxSelect]);

    const clearMockStore = useMockStore((state) => state.clearMockStore);
    const hasMockData = useMockStore((state) => state.hasMockData());

    useKeyBindings({
        'c': () => {
            clearMockStore();
        },
    });

    useKeyBindings({
        'b': () => {
            handleBoxSelect();
        },
    });

    return (
        <div className="bg-zinc-800 bg-opacity-80 border border-white/25 p-2 rounded-full absolute left-5 top-5 flex flex-col items-center justify-center">
            <div className="flex flex-col items-start justify-center w-full h-full">
                <button
                    className={`group w-full text-lg font-semibold text-white rounded-full p-2 bg-zinc-300 hover:bg-zinc-600`}
                    onMouseDown={() => setShowAddingNode(true)}
                >
                    <PlusIcon className={"w-4 h-4 text-zinc-800 group-hover:text-zinc-100"}/>
                </button>
            </div>

            <Divider className={'mt-1 mb-1'}/>

            <div className="flex flex-col items-start justify-center w-full h-full">
                <button
                    disabled={true}
                    className={`w-full text-lg font-semibold text-white rounded-full p-2`}
                >
                    <ArrowTurnDownLeftIcon className={"w-4 h-4"}/>
                </button>
                <button
                    disabled={true}
                    className={`w-full text-lg font-semibold text-white rounded-full p-2`}
                >
                    <ArrowTurnDownRightIcon className={"w-4 h-4"}/>
                </button>
            </div>

            <Divider className={'mt-1 mb-1'}/>

            <div className="flex flex-col items-start justify-center w-full h-full">
                <button
                    disabled={!hasMockData}
                    type="button"
                    className={`w-full text-lg font-semibold ${!hasMockData ? 'text-zinc-600' : 'text-white'} rounded-full p-2 ${!hasMockData ? 'bg-transparent' : 'bg-sky-500'}`}
                    onMouseDown={clearMockStore}
                >
                    <ArrowUturnUpIcon className="w-4 h-4" />
                </button>
            </div>

            <Divider className={'mt-1 mb-1'} />

            <div className="flex flex-col items-start justify-center w-full h-full rounded-full hover:bg-zinc-600">
                <button
                    type="button"
                    className={`w-full text-lg font-semibold text-white rounded-sm p-2`}
                    onMouseDown={() => openForm(FormType.PublishedVariableForm)}
                >
                    <AdjustmentsHorizontalIcon className="w-4 h-4" />
                </button>
            </div>

            <Divider className={'mt-1 mb-1'} />

            <div className="flex flex-col items-start justify-center w-full h-full">
                <button
                    type="button"
                    className={`w-full text-lg font-semibold text-white rounded-full p-2 hover:bg-zinc-600 ${boxSelect ? 'bg-sky-500' : 'bg-transparent'}`}
                    onMouseDown={handleBoxSelect}
                >
                    <StopIcon className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    className={`w-full text-lg font-semibold text-white rounded-full p-2 hover:bg-zinc-600 ${clickSelect ? 'bg-sky-500' : 'bg-transparent'}`}
                    onMouseDown={handleClickSelect}
                >
                    <CursorArrowRaysIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default TopLeftEditorMenu;