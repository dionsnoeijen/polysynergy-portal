import React, { useCallback } from "react";
import {
    ArrowTurnDownLeftIcon,
    ArrowTurnDownRightIcon,
    CursorArrowRaysIcon,
    StopIcon
} from "@heroicons/react/16/solid";
import { useEditorStore } from "@/stores/editorStore";

const UndoRedoMenu: React.FC = () => {
    return (
        <div className="absolute left-5 top-5 flex flex-col items-center justify-center">
            <div className="flex flex-col items-start justify-center w-full h-full">
                <button
                    disabled={true}
                    className={`w-full text-lg font-semibold text-white rounded-sm p-1 bg-zinc-500`}
                >
                    <ArrowTurnDownLeftIcon className={"w-4 h-4"}/>
                </button>
                <button
                    disabled={true}
                    className={`w-full text-lg font-semibold text-white rounded-sm p-1 mt-1 bg-zinc-500`}
                >
                    <ArrowTurnDownRightIcon className={"w-4 h-4"}/>
                </button>
            </div>
        </div>
    );
};

export default UndoRedoMenu;
