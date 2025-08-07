import React, {ReactNode} from 'react';
import {useAvatarVariableLogic, AvatarVariableProps} from '@/hooks/editor/nodes/variables/useAvatarVariableLogic';
import NodeChatBubble from '@/components/editor/nodes/node-chat-bubble';

interface AvatarVariableContainerProps extends AvatarVariableProps {
    children: (logic: ReturnType<typeof useAvatarVariableLogic>) => ReactNode;
}

const AvatarVariableContainer: React.FC<AvatarVariableContainerProps> = ({
    children,
    ...avatarProps
}) => {
    const logic = useAvatarVariableLogic(avatarProps);

    return (
        <div className={logic.containerClassName}>
            <div className="w-full flex justify-center items-center">
                {children(logic)}
            </div>
            <NodeChatBubble nodeId={logic.nodeId} />
        </div>
    );
};

export default AvatarVariableContainer;