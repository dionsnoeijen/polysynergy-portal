import React from 'react';
import {usePlayButtonLogic} from '@/hooks/editor/nodes/usePlayButtonLogic';
import {PlayCircleIcon} from "@heroicons/react/24/outline";

interface PlayActionButtonProps {
    logic: ReturnType<typeof usePlayButtonLogic>;
}

const PlayActionButton: React.FC<PlayActionButtonProps> = ({ logic }) => {
    const handleClick = (e: React.MouseEvent) => {
        // CRITICAL: Pass current nodeId at exact click time to prevent stale ID usage
        logic.run(e, logic.nodeId);
    };

    return (
        <button
            type="button"
            className={logic.buttonClassName}
            onClick={handleClick}
            onDoubleClick={logic.stopPropagation}
        >
            <PlayCircleIcon className={logic.iconClassName} />
        </button>
    );
};

export default PlayActionButton;