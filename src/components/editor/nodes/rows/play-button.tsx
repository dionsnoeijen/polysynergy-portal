import React from "react";
import { PlayCircleIcon } from "@heroicons/react/24/outline";
import useEditorStore from "@/stores/editorStore";
import useMockStore from "@/stores/mockStore";
import { runMockApi } from "@/api/runApi";

type Props = {
    nodeId: string;
    disabled?: boolean;
    collapsed?: boolean;
};

const PlayButton: React.FC<Props> = ({
    nodeId,
    disabled = false,
    collapsed = false,
}: Props) => {
    const { activeVersionId } = useEditorStore();
    const { setMockConnections, setMockNodes } = useMockStore();

    const handlePlay = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (activeVersionId) {
            const response = await runMockApi(activeVersionId, nodeId);
            const data = await response.json();
            const result = JSON.parse(data.result.body);
            setMockConnections(result.connections);
            setMockNodes(result.nodes_order);
        }
    }

    return (
        <div className={`flex items-center justify-center rounded-md w-full relative ${collapsed ? 'p-0' : 'p-2 -mb-5'} ${disabled && 'select-none opacity-0'}`}>
            <button
                color="orange"
                type="button"
                className={`flex justify-center items-center rounded-md focus:outline-none w-full ${!collapsed ? 'border border-white/50 p-1' : ''}`}
                onClick={handlePlay}
                onDoubleClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                <PlayCircleIcon className={`${collapsed ? 'h-10 w-10' : 'h-6 w-6'} text-white !opacity-100`} />
            </button>
        </div>
    );
};

export default PlayButton;