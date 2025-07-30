import React from "react";
import {NodeVariable} from "@/types/types";
import {UserCircleIcon} from "@heroicons/react/24/outline";
import {isPlaceholder} from "@/utils/isPlaceholder";
import {useAvatarStore} from "@/stores/avatarStore";
import NodeChatBubble from "@/components/editor/nodes/node-chat-bubble";

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

    const isGenerating = useAvatarStore(state => state.isGenerating(nodeId));

    const renderAvatar = () => {
    const value = variable.value;

    if (isGenerating) {
        return (
            <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
            </div>
        );
    }

    if (!value || isPlaceholder(value)) {
        return (
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                <UserCircleIcon className="w-6 h-6 text-slate-300"/>
            </div>
        );
    }

    return (
        <div className="w-full flex justify-center items-center bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
            <img
                src={value as unknown as string}
                alt="Avatar"
                className="max-h-48 w-auto object-contain"
                onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                }}
            />
        </div>
    );
};

    return (
        <div
            className={`flex items-center justify-between rounded-md ${!variable.value ? 'pl-4 pr-4 pt-1' : 'p-0 -mt-1'} w-full relative ${disabled ? 'opacity-40' : ''}`}>
            <div className="w-full flex justify-center items-center">
                <NodeChatBubble nodeId={nodeId} />
                {renderAvatar()}
            </div>
        </div>
    );
};

export default AvatarVariable;