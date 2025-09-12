import React from "react";
import BottomBarMenu from "@/components/editor/bottombars/bottom-bar-menu";
import useEditorStore, { BottomBarView } from "@/stores/editorStore";
import Debug from "@/components/editor/bottombars/debug";
import Output from "@/components/editor/bottombars/output";
import Info from "@/components/editor/bottombars/Info";
import Files from "@/components/editor/bottombars/files";

const BottomBar: React.FC = (): React.ReactElement => {
    const bottomBarView = useEditorStore((state) => state.bottomBarView);
    const chatMode = useEditorStore((state) => state.chatMode);

    return (
        <>
            {!chatMode && <BottomBarMenu />}
            <div className={`h-full border-t ${!chatMode ? 'ml-10 border-l' : ''} border-sky-500/50 dark:border-white/20 bg-white dark:bg-zinc-800`}>
                {bottomBarView === BottomBarView.Debug && <Debug />}
                {bottomBarView === BottomBarView.Output && <Output />}
                {bottomBarView === BottomBarView.Info && <Info />}
                {bottomBarView === BottomBarView.Files && <Files />}
            </div>
        </>
    );
};

export default BottomBar;