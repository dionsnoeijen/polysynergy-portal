import React from "react";
import useEditorStore from "@/stores/editorStore";

const IsExecuting: React.FC = () => {
    const isExecuting = useEditorStore((state) => state.isExecuting);

    return (
        <>
            {isExecuting && (
                <div className="absolute top-0 left-0 w-full z-40 pointer-events-none">
                    <div className="mx-auto max-w-2xl mt-4 bg-white dark:bg-zinc-800/80 border border-sky-500/50 dark:border-white/25  backdrop-blur-sm
                                    rounded-md py-2 px-4 flex items-center justify-center gap-3 text-white shadow-md">
                        <div
                            className="animate-spin h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full"/>
                        <span className="text-sm font-medium text-sky-500 dark:text-white">
                            {typeof isExecuting === 'string' ? isExecuting : 'Executing...'}
                        </span>
                    </div>
                </div>
            )}
        </>
    )
};

export default IsExecuting;

