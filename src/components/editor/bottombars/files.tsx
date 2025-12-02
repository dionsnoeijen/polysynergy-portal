import React from "react";
import FileManager from "@/components/editor/file-manager/FileManager";
import { useBranding } from "@/contexts/branding-context";
import { hexToRgba } from "@/utils/colorUtils";

const Files: React.FC = (): React.ReactElement => {
    const { accent_color } = useBranding();

    return (
        <div className="flex h-full">
            <div className="w-full min-w-[300px] h-full flex flex-col">
                <div
                    className="border-b dark:border-white/10 p-2"
                    style={{ borderBottomColor: hexToRgba(accent_color, 0.5) }}
                >
                    <h3 className="dark:text-white/80" style={{ color: accent_color }}>File Manager</h3>
                </div>
                <div className="flex-1 overflow-hidden">
                    <FileManager className="h-full" />
                </div>
            </div>
        </div>
    );
};

export default Files;