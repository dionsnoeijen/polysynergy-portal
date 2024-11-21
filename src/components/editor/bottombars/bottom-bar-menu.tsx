import React from "react";
import { CodeBracketIcon, CodeBracketSquareIcon } from "@heroicons/react/16/solid";
import { BottomBarView, useEditorStore } from "@/stores/editorStore";

const BottomBarMenu: React.FC = (): React.ReactElement => {
    const { bottomBarView, setBottomBarView } = useEditorStore();

    return (
        <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center justify-center border-t border-b border-l border-sky-500 rounded-tl-md rounded-bl-md dark:bg-zinc-800 dark:border-r dark:border-white/20 p-2">
            <div className="flex flex-col items-start justify-center w-full h-full">
                <button
                    type={"button"}
                    className={`w-full text-lg font-semibold text-white rounded-sm p-1 ${bottomBarView === BottomBarView.Debug ? 'bg-sky-500' : 'bg-zinc-500'}`}
                    onMouseDown={() => setBottomBarView(BottomBarView.Debug)}
                >
                    <CodeBracketIcon className={"w-4 h-4"}/>
                </button>
                <button
                    type={"button"}
                    className={`w-full text-lg font-semibold text-white rounded-sm p-1 mt-1 ${bottomBarView === BottomBarView.Output ? 'bg-sky-500' : 'bg-zinc-500'}`}
                    onMouseDown={() => setBottomBarView(BottomBarView.Output)}
                >
                    <CodeBracketSquareIcon className={"w-4 h-4"}/>
                </button>
            </div>
        </div>
    );
};

export default BottomBarMenu;
