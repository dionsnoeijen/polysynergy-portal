import React from "react";
import BottomBarMenu from "@/components/editor/bottombars/bottom-bar-menu";
import useEditorStore, { BottomBarView } from "@/stores/editorStore";
import Debug from "@/components/editor/bottombars/debug";
import Output from "@/components/editor/bottombars/output";
import Info from "@/components/editor/bottombars/Info";
import Files from "@/components/editor/bottombars/files";
import SectionDataTables from "@/components/sections/section-data-tables";
import { useBranding } from "@/contexts/branding-context";

const BottomBar: React.FC = (): React.ReactElement => {
    const bottomBarView = useEditorStore((state) => state.bottomBarView);
    const chatMode = useEditorStore((state) => state.chatMode);
    const { accent_color } = useBranding();

    // Helper to convert hex to rgba
    const hexToRgba = (hex: string, opacity: number) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return `rgba(14, 165, 233, ${opacity})`;
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    return (
        <>
            {!chatMode && <BottomBarMenu />}
            <div
                className={`h-full border-t ${!chatMode ? 'ml-10 border-l' : ''} dark:border-white/20 bg-white dark:bg-zinc-800`}
                style={{
                    borderTopColor: hexToRgba(accent_color, 0.5),
                    ...((!chatMode) && { borderLeftColor: hexToRgba(accent_color, 0.5) })
                }}
            >
                {bottomBarView === BottomBarView.Debug && <Debug />}
                {bottomBarView === BottomBarView.Output && <Output />}
                {bottomBarView === BottomBarView.Info && <Info />}
                {bottomBarView === BottomBarView.Files && <Files />}
                {bottomBarView === BottomBarView.Sections && <SectionDataTables />}
            </div>
        </>
    );
};

export default BottomBar;