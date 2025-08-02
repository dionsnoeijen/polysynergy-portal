import React from 'react';
import {usePlayButtonLogic} from '@/hooks/editor/nodes/usePlayButtonLogic';
import {PlayCircleIcon} from "@heroicons/react/24/outline";

interface PlayActionButtonProps {
    logic: ReturnType<typeof usePlayButtonLogic>;
}

const PlayActionButton: React.FC<PlayActionButtonProps> = ({ logic }) => {
    return (
        <button
            type="button"
            className={logic.buttonClassName}
            onClick={logic.run}
            onDoubleClick={logic.stopPropagation}
        >
            <PlayCircleIcon className={logic.iconClassName} />
        </button>
    );
};

export default PlayActionButton;