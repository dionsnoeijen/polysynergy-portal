import {useMemo} from 'react';
import {NodeVariable} from '@/types/types';
import useConnectionsStore from '@/stores/connectionsStore';
import { sanitizeValueToDisplayString } from '@/utils/dataSanitization';

export interface SimpleVariableLogicProps {
    variable: NodeVariable;
    nodeId: string;
    isMirror?: boolean;
    disabled?: boolean;
    groupId?: string;
    onlyIn?: boolean;
    onlyOut?: boolean;
    isInService?: boolean;
    categoryMainTextColor?: string;
    categorySubTextColor?: string;
}

export const useSimpleVariableLogic = ({
    variable,
    nodeId,
    isMirror = false,
    disabled = false,
    groupId,
    onlyIn = false,
    onlyOut = false,
    isInService = false,
    categoryMainTextColor = 'text-sky-600 dark:text-white',
    categorySubTextColor = 'text-sky-400 dark:text-slate-400'
}: SimpleVariableLogicProps) => {
    const isValueConnected = useConnectionsStore((state) => state.isValueConnectedExcludingGroupBoundary(nodeId, variable.handle));

    return useMemo(() => {
        const displayName = (groupId && variable.group_name_override) 
            ? variable.group_name_override 
            : variable.name;

        const textColor = isValueConnected 
            ? 'text-orange-800 dark:text-yellow-300' 
            : categoryMainTextColor;
            
        const iconColor = isValueConnected 
            ? 'text-orange-800 dark:text-yellow-300' 
            : categoryMainTextColor;

        const containerClassName = `flex items-center justify-between rounded-md w-full pl-4 pr-4 pt-1 relative ${disabled ? 'opacity-0' : ''}`;

        // Connector props (simple variables use variable.type directly)
        const inConnectorProps = {
            nodeId,
            handle: variable.handle,
            disabled: disabled || isInService,
            groupId,
            nodeVariableType: variable.type
        };

        const outConnectorProps = {
            nodeId,
            handle: variable.handle,
            disabled: disabled || isInService,
            groupId,
            nodeVariableType: variable.type
        };

        const showInConnector = variable.has_in && !disabled && !onlyOut;
        const showOutConnector = variable.has_out && !disabled && !onlyIn;
        const showFakeInConnector = variable.has_in && isMirror && !onlyOut;
        const showFakeOutConnector = variable.has_out && isMirror && !onlyIn;

        return {
            // Original data
            variable,
            
            // Connection state
            isValueConnected,
            
            // Display properties
            displayName,
            textColor,
            iconColor,
            containerClassName,
            
            // Simple variable properties
            valueText: sanitizeValueToDisplayString(variable.value),
            categorySubTextColor,
            
            // Connector configuration
            inConnectorProps,
            outConnectorProps,
            showInConnector,
            showOutConnector,
            showFakeInConnector,
            showFakeOutConnector,
            
            // State flags
            isDisabled: disabled,
            isMirror
        };
    }, [
        variable,
        nodeId,
        isValueConnected,
        isMirror,
        disabled,
        groupId,
        onlyIn,
        onlyOut,
        isInService,
        categoryMainTextColor,
        categorySubTextColor
    ]);
};