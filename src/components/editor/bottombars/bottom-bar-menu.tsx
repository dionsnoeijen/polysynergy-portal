import React from "react";
import {
    CodeBracketIcon,
    CodeBracketSquareIcon,
    InformationCircleIcon,
    FolderIcon,
    TableCellsIcon
} from "@heroicons/react/24/outline";
import useEditorStore, { BottomBarView } from "@/stores/editorStore";
import { useBranding } from "@/contexts/branding-context";
import { hexToRgba } from "@/utils/colorUtils";

const BottomBarMenu: React.FC = (): React.ReactElement => {
    const bottomBarView = useEditorStore((state) => state.bottomBarView);
    const setBottomBarView = useEditorStore((state) => state.setBottomBarView);
    const debugBarAvailable = useEditorStore((state) => state.debugBarAvailable);
    const { accent_color } = useBranding();

    return (
        <div
            className="absolute left-0 top-0 bottom-0 flex flex-col items-center justify-center border-t dark:border-white/20 dark:bg-zinc-800 p-2"
            style={{
                borderTopColor: hexToRgba(accent_color, 0.5),
                backgroundColor: hexToRgba(accent_color, 0.1)
            }}
        >
            <div className="flex flex-col items-start justify-center w-full h-full">
                {debugBarAvailable && <button
                    type={"button"}
                    className="w-full text-lg font-semibold text-white rounded-sm p-1 dark:bg-zinc-500"
                    style={{
                        backgroundColor: bottomBarView === BottomBarView.Debug ? accent_color : hexToRgba(accent_color, 0.3)
                    }}
                    onMouseDown={() => setBottomBarView(BottomBarView.Debug)}
                >
                    <CodeBracketIcon className={"w-4 h-4"}/>
                </button>}
                <button
                    type={"button"}
                    className="w-full text-lg font-semibold text-white rounded-sm p-1 mt-1 dark:bg-zinc-500"
                    style={{
                        backgroundColor: bottomBarView === BottomBarView.Output ? accent_color : hexToRgba(accent_color, 0.3)
                    }}
                    onMouseDown={() => setBottomBarView(BottomBarView.Output)}
                >
                    <CodeBracketSquareIcon className={"w-4 h-4"}/>
                </button>
                <button
                    type={"button"}
                    className="w-full text-lg font-semibold text-white rounded-sm p-1 mt-1 dark:bg-zinc-500"
                    style={{
                        backgroundColor: bottomBarView === BottomBarView.Info ? accent_color : hexToRgba(accent_color, 0.3)
                    }}
                    onMouseDown={() => setBottomBarView(BottomBarView.Info)}
                >
                    <InformationCircleIcon className={'w-4 h-4'} />
                </button>
                <button
                    type={"button"}
                    className="w-full text-lg font-semibold text-white rounded-sm p-1 mt-1 dark:bg-zinc-500"
                    style={{
                        backgroundColor: bottomBarView === BottomBarView.Files ? accent_color : hexToRgba(accent_color, 0.3)
                    }}
                    onMouseDown={() => setBottomBarView(BottomBarView.Files)}
                    title="File Manager"
                >
                    <FolderIcon className={'w-4 h-4'} />
                </button>
                <button
                    type={"button"}
                    className="w-full text-lg font-semibold text-white rounded-sm p-1 mt-1 dark:bg-zinc-500"
                    style={{
                        backgroundColor: bottomBarView === BottomBarView.Sections ? accent_color : hexToRgba(accent_color, 0.3)
                    }}
                    onMouseDown={() => setBottomBarView(BottomBarView.Sections)}
                    title="Sections"
                >
                    <TableCellsIcon className={'w-4 h-4'} />
                </button>
            </div>
        </div>
    );
};

export default BottomBarMenu;
