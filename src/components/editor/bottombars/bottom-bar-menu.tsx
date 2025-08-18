import React from "react";
import {
    CodeBracketIcon,
    CodeBracketSquareIcon,
    InformationCircleIcon,
    FolderIcon
} from "@heroicons/react/24/outline";
import useEditorStore, { BottomBarView } from "@/stores/editorStore";

const BottomBarMenu: React.FC = (): React.ReactElement => {
    const bottomBarView = useEditorStore((state) => state.bottomBarView);
    const setBottomBarView = useEditorStore((state) => state.setBottomBarView);
    const debugBarAvailable = useEditorStore((state) => state.debugBarAvailable);

    return (
        <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center justify-center border-t border-sky-500/50 dark:border-white/20 bg-sky-100 dark:bg-zinc-800 p-2">
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
                    className={`w-full text-lg font-semibold text-white rounded-sm p-1 mt-1 ${bottomBarView === BottomBarView.Info ? 'bg-sky-500' : 'bg-sky-300 dark:bg-zinc-500'}`}
                    onMouseDown={() => setBottomBarView(BottomBarView.Info)}
                >
                    <InformationCircleIcon className={'w-4 h-4'} />
                </button>
                <button
                    type={"button"}
                    className={`w-full text-lg font-semibold text-white rounded-sm p-1 mt-1 ${bottomBarView === BottomBarView.Files ? 'bg-sky-500' : 'bg-sky-300 dark:bg-zinc-500'}`}
                    onMouseDown={() => setBottomBarView(BottomBarView.Files)}
                    title="File Manager"
                >
                    <FolderIcon className={'w-4 h-4'} />
                </button>
            </div>
        </div>
    );
};

export default BottomBarMenu;
