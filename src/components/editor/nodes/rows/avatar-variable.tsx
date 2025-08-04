import React from 'react';
import {NodeVariable} from '@/types/types';
import AvatarVariableContainer from '@/components/editor/nodes/rows/containers/avatar-variable-container';
import AvatarContent from '@/components/editor/nodes/rows/components/avatar-content';

type Props = {
    variable: NodeVariable;
    nodeId: string;
    disabled?: boolean;
    groupId?: string;
    isMirror?: boolean;
    categoryMainTextColor?: string;
    categorySubTextColor?: string;
    isInService?: boolean;
};

const AvatarVariable: React.FC<Props> = ({
    variable,
    nodeId,
    disabled = false,
}): React.ReactElement => {
    return (
        <AvatarVariableContainer
            variable={variable}
            nodeId={nodeId}
            disabled={disabled}
        >
            {(logic) => <AvatarContent logic={logic} />}
        </AvatarVariableContainer>
    );
};

export default AvatarVariable;