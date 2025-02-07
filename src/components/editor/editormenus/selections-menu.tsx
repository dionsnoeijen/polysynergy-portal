import React, { useCallback } from "react";
import { CursorArrowRaysIcon, StopIcon } from "@heroicons/react/24/outline";
import useEditorStore from "@/stores/editorStore";
import {useKeyBindings} from "@/hooks/editor/useKeyBindings";

const SelectionsMenu: React.FC = () => {
    const clickSelect = useEditorStore((state) => state.clickSelect);
    const boxSelect = useEditorStore((state) => state.boxSelect);
    const setClickSelect = useEditorStore((state) => state.setClickSelect);
    const setBoxSelect = useEditorStore((state) => state.setBoxSelect);

    const handleClickSelect = useCallback(() => {
        setBoxSelect(false);
        setClickSelect(true);
    }, [setBoxSelect, setClickSelect]);

    const handleBoxSelect = useCallback(() => {
        setClickSelect(false);
        setBoxSelect(true);
    }, [setClickSelect, setBoxSelect]);

    useKeyBindings({
        'b': () => {
            handleBoxSelect();
        },
    });

    return (
        <div className="absolute left-5 top-20 flex flex-col items-center justify-center">
            <div className="flex flex-col items-start justify-center w-full h-full">
                <button
                    type="button"
                    className={`w-full text-lg font-semibold text-white rounded-sm p-1 ${clickSelect ? 'bg-sky-500' : 'bg-zinc-500'}`}
                    onMouseDown={handleClickSelect}
                >
                    <CursorArrowRaysIcon className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    className={`w-full text-lg font-semibold text-white rounded-sm p-1 mt-1 ${boxSelect ? 'bg-sky-500' : 'bg-zinc-500'}`}
                    onMouseDown={handleBoxSelect}
                >
                    <StopIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default SelectionsMenu;
