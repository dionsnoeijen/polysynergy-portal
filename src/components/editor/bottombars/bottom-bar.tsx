import React from "react";
import BottomBarMenu from "@/components/editor/bottombars/bottom-bar-menu";
import { BottomBarView, useEditorStore } from "@/stores/editorStore";
import Debug from "@/components/editor/bottombars/debug";
import Output from "@/components/editor/bottombars/output";

const BottomBar: React.FC = (): React.ReactElement => {
    const { bottomBarView } = useEditorStore();

    return (
        <>
            <BottomBarMenu />
            <div className="ml-10 h-full">
                {bottomBarView === BottomBarView.Debug && <Debug />}
                {bottomBarView === BottomBarView.Output && <Output />}
            </div>
        </>
    );
};

export default BottomBar;
