import React from "react";
import { PlayCircleIcon } from "@heroicons/react/24/outline";
import useEditorStore from "@/stores/editorStore";
import useMockStore from "@/stores/mockStore";
import { runMockApi } from "@/api/runApi";

type Props = {
    nodeId: string;
    disabled?: boolean;
    collapsed?: boolean;
    centered?: boolean;
};

const PlayButton: React.FC<Props> = ({
    nodeId,
    disabled = false,
    collapsed = false,
    centered = true
}: Props) => {
    const { activeVersionId, activeProjectId } = useEditorStore();
    const { setMockConnections, setMockNodes } = useMockStore();

    const handlePlay = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (activeVersionId) {
            const response = await runMockApi(activeProjectId, activeVersionId, nodeId);
            const data = await response.json();

            let result;
            if (data.result.body) {
                result = JSON.parse(data.result.body);
            } else {
                result = data.result;
            }

            if (result.connections && result.nodes_order) {
                setMockConnections(result.connections);
                setMockNodes(result.nodes_order);
            } else {
                console.error("No mock data returned", result);
            }
        }
    }

    return (
        <div className={`flex items-center justify-center rounded-md relative ${centered ? 'w-full' : ''} ${collapsed ? 'p-0' : 'p-2 -mb-5'} ${disabled && 'select-none opacity-0'}`}>
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