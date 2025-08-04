import {useMemo} from 'react';
import {NodeVariable} from '@/types/types';
import {useAvatarStore} from '@/stores/avatarStore';
import {isPlaceholder} from '@/utils/isPlaceholder';

export interface AvatarVariableProps {
    variable: NodeVariable;
    nodeId: string;
    disabled?: boolean;
}

export const useAvatarVariableLogic = ({
    variable,
    nodeId,
    disabled = false
}: AvatarVariableProps) => {
    const isGenerating = useAvatarStore(state => state.isGenerating(nodeId));

    return useMemo(() => {
        const value = variable.value;
        const hasValue = value && !isPlaceholder(value);
        
        // Avatar has special className based on whether it has a value
        const containerClassName = `flex items-center justify-between rounded-md ${!hasValue ? 'pl-4 pr-4 pt-1' : 'p-0 -mt-1'} w-full relative ${disabled ? 'opacity-40' : ''}`;
        
        // Avatar states for rendering
        const avatarState = isGenerating 
            ? 'generating' 
            : hasValue 
                ? 'hasImage' 
                : 'placeholder';

        return {
            // Avatar-specific state
            isGenerating,
            hasValue: Boolean(hasValue),
            value,
            avatarState: avatarState as 'generating' | 'hasImage' | 'placeholder',
            nodeId,
            
            // Display properties
            containerClassName
        };
    }, [
        variable,
        nodeId,
        isGenerating,
        disabled
    ]);
};