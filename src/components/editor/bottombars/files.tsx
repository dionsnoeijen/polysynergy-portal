import React from "react";
import FileManager from "@/components/editor/file-manager/FileManager";

const Files: React.FC = (): React.ReactElement => {
    return (
        <div className="flex h-full">
            <div className="w-full min-w-[300px] h-full flex flex-col">
                <div className="border-b border-sky-500/50 dark:border-white/10 p-2">
                    <h3 className="text-sky-500 dark:text-white/80">File Manager</h3>
                </div>
                <div className="flex-1 overflow-hidden">
                    <FileManager className="h-full" />
                </div>
            </div>
        </div>
    );
};

export default Files;