import React from 'react';
import {NodeVariable} from '@/types/types';
import OAuthVariableContainer from '@/components/editor/nodes/rows/containers/oauth-variable-container';
import OAuthContent from '@/components/editor/nodes/rows/components/oauth-content';

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

const OAuthVariable: React.FC<Props> = ({
    variable,
    nodeId,
    disabled = false,
}): React.ReactElement => {
    return (
        <OAuthVariableContainer
            variable={variable}
            nodeId={nodeId}
            disabled={disabled}
        >
            {(logic) => <OAuthContent logic={logic} />}
        </OAuthVariableContainer>
    );
};

export default OAuthVariable;