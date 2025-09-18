import React, { useEffect } from "react";
import { SignalIcon, SignalSlashIcon } from "@heroicons/react/24/outline";
import useListenerStore from "@/stores/listenerStore";
import useEditorStore from "@/stores/editorStore";

const TopRightEditorListener: React.FC = () => {
    const activeVersionId = useEditorStore((state) => state.activeVersionId);
    const isActive = useListenerStore((state) =>
        state.isListenerActive(activeVersionId as string)
    );
    const initListenerStatus = useListenerStore((state) => state.initListenerStatus);
    const toggleListener = useListenerStore((state) => state.toggleListener);

    useEffect(() => {
        if (activeVersionId) {
            initListenerStatus(activeVersionId);
        }
    }, [activeVersionId, initListenerStatus]);

    if (!activeVersionId) return null;

    return (
        <button
            title={`Listener ${isActive ? "actief" : "inactief"} – klik om te togglen`}
            onClick={() => toggleListener(activeVersionId)}
            className="absolute bottom-3.5 left-20 z-[50] p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
            {isActive ? (
                <SignalIcon className="w-6 h-6 text-green-500 dark:text-green-400" />
            ) : (
                <SignalSlashIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            )}
        </button>
    );
};

export default TopRightEditorListener;