import React from "react";
import { PlayCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/button";
import useEditorStore from "@/stores/editorStore";
import useMockStore from "@/stores/mockStore";
import { runMockApi } from "@/api/runApi";

type Props = {
    nodeId: string;
    disabled?: boolean;
};

const PlayButton: React.FC<Props> = ({
    nodeId,
    disabled = false,
}: Props) => {
    const { activeVersionId } = useEditorStore();
    const { setMockConnections, setMockNodes } = useMockStore();

    const handlePlay = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (activeVersionId) {
            const response = await runMockApi(activeVersionId, nodeId);
            const data = await response.json();
            setMockConnections(data.result.connections);
            setMockNodes(data.result.nodes_order);
        }
    }

    return <div
        className={`flex items-center justify-between rounded-md w-full pl-3 pr-3 pt-2 relative ${disabled && 'select-none opacity-0'}`}>
        <Button
            color={'orange'}
            type={"button"}
            className={'block w-full'}
            onClick={handlePlay}
            onDoubleClick={(e:React.MouseEvent) => e.stopPropagation()}
        ><PlayCircleIcon className={'h-6 w-6 text-white'}/></Button>
    </div>
};

export default PlayButton;