import React from "react";
import PlayButtonContainer from '@/components/editor/nodes/rows/containers/play-button-container';
import StageSelector from '@/components/editor/nodes/rows/components/stage-selector';
import PlayActionButton from '@/components/editor/nodes/rows/components/play-action-button';

type Props = {
    nodeId: string;
    disabled?: boolean;
    collapsed?: boolean;
    centered?: boolean;
    staged?: boolean;
    categoryMainTextColor?: string;
    categorySubTextColor?: string;
};

const PlayButton: React.FC<Props> = (props) => {
    return (
        <PlayButtonContainer {...props}>
            {(logic) => (
                <>
                    <StageSelector logic={logic} />
                    <PlayActionButton logic={logic} />
                </>
            )}
        </PlayButtonContainer>
    );
};

export default PlayButton;