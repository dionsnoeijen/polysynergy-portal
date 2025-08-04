import React from 'react';
import {UserCircleIcon} from '@heroicons/react/24/outline';
import NodeChatBubble from '@/components/editor/nodes/node-chat-bubble';

interface AvatarContentProps {
    logic?: {
        nodeId: string;
        isGenerating: boolean;
        hasValue: boolean;
        value: unknown;
        avatarState: 'generating' | 'hasImage' | 'placeholder';
    };
}

const AvatarContent: React.FC<AvatarContentProps> = ({ logic }) => {
    if (!logic) return null;

    const renderAvatar = () => {
        switch (logic.avatarState) {
            case 'generating':
                return (
                    <div className="w-8 h-8 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    </div>
                );
            
            case 'placeholder':
                return (
                    <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                        <UserCircleIcon className="w-6 h-6 text-slate-300"/>
                    </div>
                );
            
            case 'hasImage':
                return (
                    <div className="w-full flex justify-center items-center bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
                        <img
                            src={logic.value as unknown as string}
                            alt="Avatar"
                            className="max-h-48 w-auto object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                );
            
            default:
                return null;
        }
    };

    return (
        <>
            <NodeChatBubble nodeId={logic.nodeId} />
            {renderAvatar()}
        </>
    );
};

export default AvatarContent;