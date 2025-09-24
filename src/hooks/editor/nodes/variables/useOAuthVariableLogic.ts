import {useMemo} from 'react';
import {NodeVariable} from '@/types/types';
import {isPlaceholder} from '@/utils/isPlaceholder';
import useInteractionStore from '@/stores/interactionStore';

export interface OAuthVariableProps {
    variable: NodeVariable;
    nodeId: string;
    disabled?: boolean;
}

export const useOAuthVariableLogic = ({
    variable,
    nodeId,
    disabled = false
}: OAuthVariableProps) => {
    const { activeInteraction } = useInteractionStore();
    const isAuthorizing = activeInteraction?.node_id === nodeId;

    return useMemo(() => {
        const value = variable.value;
        const hasValue = value && !isPlaceholder(value);

        // OAuth has special className based on authorization state
        const containerClassName = `flex items-center justify-between rounded-md ${!hasValue ? 'pl-4 pr-4 pt-1' : 'p-0 -mt-1'} w-full relative ${disabled ? 'opacity-40' : ''}`;

        // OAuth states for rendering
        const oauthState = isAuthorizing
            ? 'authorizing'
            : hasValue
                ? 'authorized'
                : 'unauthorized';

        return {
            // OAuth-specific state
            isAuthorizing,
            hasValue: Boolean(hasValue),
            value,
            oauthState: oauthState as 'authorizing' | 'authorized' | 'unauthorized',
            nodeId,

            // Display properties
            containerClassName
        };
    }, [
        variable,
        nodeId,
        isAuthorizing,
        disabled
    ]);
};