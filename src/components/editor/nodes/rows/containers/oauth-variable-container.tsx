import React, {ReactNode} from 'react';
import {useOAuthVariableLogic, OAuthVariableProps} from '@/hooks/editor/nodes/variables/useOAuthVariableLogic';
import NodeChatBubble from '@/components/editor/nodes/node-chat-bubble';

interface OAuthVariableContainerProps extends OAuthVariableProps {
    children: (logic: ReturnType<typeof useOAuthVariableLogic>) => ReactNode;
}

const OAuthVariableContainer: React.FC<OAuthVariableContainerProps> = ({
    children,
    ...oauthProps
}) => {
    const logic = useOAuthVariableLogic(oauthProps);

    return (
        <div className={logic.containerClassName}>
            <div className="w-full flex justify-center items-center">
                {children(logic)}
            </div>
            <NodeChatBubble nodeId={logic.nodeId} />
        </div>
    );
};

export default OAuthVariableContainer;