import React, {ReactNode} from 'react';
import {usePlayButtonLogic, PlayButtonLogicProps} from '@/hooks/editor/nodes/usePlayButtonLogic';

interface PlayButtonContainerProps extends PlayButtonLogicProps {
    children: (logic: ReturnType<typeof usePlayButtonLogic>) => ReactNode;
}

const PlayButtonContainer: React.FC<PlayButtonContainerProps> = ({
    children,
    ...playButtonProps
}) => {
    const logic = usePlayButtonLogic(playButtonProps);

    return (
        <div className={logic.containerClassName}>
            {children(logic)}
        </div>
    );
};

export default PlayButtonContainer;