import React from "react";
import { CursorArrowRaysIcon } from "@heroicons/react/24/outline";
import { useKeyBindings } from "@/hooks/editor/useKeyBindings";
import useMockStore from "@/stores/mockStore";
import {ArrowUturnUpIcon} from "@heroicons/react/16/solid";

const ClearMockViewMenu: React.FC = () => {
    const clearMockStore = useMockStore((state) => state.clearMockStore);
    const hasMockData = useMockStore((state) => state.hasMockData());

    useKeyBindings({
        'c': () => {
            clearMockStore();
        },
    });

    return (
        <div className="absolute left-5 top-36 flex flex-col items-center justify-center">
            <div className="flex flex-col items-start justify-center w-full h-full">
                <button
                    disabled={!hasMockData}
                    type="button"
                    className={`w-full text-lg font-semibold text-white rounded-sm p-1 ${!hasMockData ? 'bg-gray-800' : 'bg-sky-500'}`}
                    onMouseDown={clearMockStore}
                >
                    <ArrowUturnUpIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ClearMockViewMenu;
