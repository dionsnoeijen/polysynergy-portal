import React, {useState} from "react";
import {PlayCircleIcon} from "@heroicons/react/24/outline";
import {useHandlePlay} from "@/hooks/editor/useHandlePlay";
import {Select} from "@/components/select";
import useStagesStore from "@/stores/stagesStore";

type Props = {
    nodeId: string;
    disabled?: boolean;
    collapsed?: boolean;
    centered?: boolean;
    staged?: boolean;
    categoryMainTextColor?: string;
    categorySubTextColor?: string;
};

const PlayButton: React.FC<Props> = ({
    nodeId,
    disabled = false,
    collapsed = false,
    centered = true,
    staged = false,
    categoryMainTextColor = 'text-sky-600 dark:text-white',
}) => {
    const handlePlay = useHandlePlay();
    const stages = useStagesStore((state) => state.stages);
    const [selectedStage, setSelectedStage] = useState("mock");

    const run = (e: React.MouseEvent) => {
        handlePlay(e, nodeId, selectedStage);
    };

    return (
        <div
            className={`flex ${staged ? "flex-row" : "flex-col"} items-center justify-center gap-2 rounded-md relative ${
                centered ? "w-full" : ""
            } ${collapsed ? "p-0" : "p-3 -mb-5"} ${disabled ? "select-none opacity-0" : ""}`}
        >
            {staged && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="flex-grow"
                >
                    <Select
                        value={selectedStage}
                        onChange={(e) => setSelectedStage(e.target.value)}
                        className="w-full h-9"
                    >
                        {stages.map((stage) => (
                            <option key={`${nodeId}-${stage.name}`} value={stage.name}>
                                {stage.name}
                            </option>
                        ))}
                    </Select>
                </div>
            )}

            <button
                type="button"
                className={`h-9 ${staged ? 'w-9' : 'w-full'} min-w-[2.25rem] flex justify-center items-center rounded-md border border-white/90 focus:outline-none`}
                onClick={run}
                onDoubleClick={(e) => e.stopPropagation()}
            >
                <PlayCircleIcon className={`h-5 w-5 ${categoryMainTextColor} !opacity-100`} />
            </button>
        </div>
    );
};

export default PlayButton;