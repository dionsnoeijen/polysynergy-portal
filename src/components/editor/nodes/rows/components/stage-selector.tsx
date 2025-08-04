import React from 'react';
import {usePlayButtonLogic} from '@/hooks/editor/nodes/usePlayButtonLogic';
import {Select} from "@/components/select";

interface StageSelectorProps {
    logic: ReturnType<typeof usePlayButtonLogic>;
}

const StageSelector: React.FC<StageSelectorProps> = ({ logic }) => {
    if (!logic.staged) {
        return null;
    }

    return (
        <div
            onClick={logic.stopPropagation}
            onMouseDown={logic.stopPropagation}
            onTouchStart={logic.stopPropagation}
            className="flex-grow"
        >
            <Select {...logic.selectProps}>
                {logic.stages.map((stage) => (
                    <option key={`${logic.nodeId}-${stage.name}`} value={stage.name}>
                        {stage.name}
                    </option>
                ))}
            </Select>
        </div>
    );
};

export default StageSelector;