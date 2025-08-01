import React from "react";
import {
    ChatBubbleLeftIcon,
    CodeBracketIcon,
    CodeBracketSquareIcon,
    InformationCircleIcon
} from "@heroicons/react/24/outline";
import useEditorStore, { BottomBarView } from "@/stores/editorStore";
import {Bars2Icon} from "@heroicons/react/24/outline";

const BottomBarMenu: React.FC = (): React.ReactElement => {
    const bottomBarView = useEditorStore((state) => state.bottomBarView);
    const setBottomBarView = useEditorStore((state) => state.setBottomBarView);
    const debugBarAvailable = useEditorStore((state) => state.debugBarAvailable);

    return (
        <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center justify-center border border-sky-500/50 rounded-l-md bg-sky-100 dark:bg-zinc-800 dark:border-r dark:border-white/20 p-2">
            <div className="flex flex-col items-start justify-center w-full h-full">
                {debugBarAvailable && <button
                    type={"button"}
                    className={`w-full text-lg font-semibold text-white rounded-sm p-1 ${bottomBarView === BottomBarView.Debug ? 'bg-sky-500' : 'bg-sky-300 dark:bg-zinc-500'}`}
                    onMouseDown={() => setBottomBarView(BottomBarView.Debug)}
                >
                    <CodeBracketIcon className={"w-4 h-4"}/>
                </button>}
                <button
                    type={"button"}
                    className={`w-full text-lg font-semibold text-white rounded-sm p-1 mt-1 ${bottomBarView === BottomBarView.Output ? 'bg-sky-500' : 'bg-sky-300 dark:bg-zinc-500'}`}
                    onMouseDown={() => setBottomBarView(BottomBarView.Output)}
                >
                    <CodeBracketSquareIcon className={"w-4 h-4"}/>
                </button>
                <button
                    type={"button"}
                    className={`w-full text-lg font-semibold text-white rounded-sm p-1 mt-1 ${bottomBarView === BottomBarView.Logs ? 'bg-sky-500' : 'bg-sky-300 dark:bg-zinc-500'}`}
                    onMouseDown={() => setBottomBarView(BottomBarView.Logs)}
                >
                    <Bars2Icon className={'w-4 h-4'} />
                </button>
                <button
                    type={"button"}
                    className={`w-full text-lg font-semibold text-white rounded-sm p-1 mt-1 ${bottomBarView === BottomBarView.Info ? 'bg-sky-500' : 'bg-sky-300 dark:bg-zinc-500'}`}
                    onMouseDown={() => setBottomBarView(BottomBarView.Info)}
                >
                    <InformationCircleIcon className={'w-4 h-4'} />
                </button>
            </div>
        </div>
    );
};

export default BottomBarMenu;
