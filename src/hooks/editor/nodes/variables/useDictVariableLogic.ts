import {useMemo} from 'react';
import {NodeVariable} from '@/types/types';
import useConnectionsStore from '@/stores/connectionsStore';
import interpretNodeVariableType from '@/utils/interpretNodeVariableType';

export interface DictVariableLogicProps {
    variable: NodeVariable;
    nodeId: string;
    isOpen: boolean;
    isMirror?: boolean;
    disabled?: boolean;
    groupId?: string;
    onlyIn?: boolean;
    onlyOut?: boolean;
    isInService?: boolean;
    categoryMainTextColor?: string;
    categorySubTextColor?: string;
}

export const useDictVariableLogic = ({
    variable,
    nodeId,
    isOpen,
    isMirror = false,
    disabled = false,
    groupId,
    onlyIn = false,
    onlyOut = false,
    isInService = false,
    categoryMainTextColor = 'text-sky-600 dark:text-white',
    categorySubTextColor = 'text-slate-400 dark:text-slate-500'
}: DictVariableLogicProps) => {
    const isSubValueConnected = useConnectionsStore((state) => state.isValueConnectedExcludingGroupBoundary);
    const isMainValueConnected = useConnectionsStore((state) => state.isValueConnectedExcludingGroupBoundary(nodeId, variable.handle));

    return useMemo(() => {
        const variableType = interpretNodeVariableType(variable);
        
        const displayName = (groupId && variable.group_name_override) 
            ? variable.group_name_override 
            : variable.name;

        // Check if any sub-items have output connectors
        const hasSubItemOutputs = Array.isArray(variable.value) &&
            (variable.value as NodeVariable[]).some((item: NodeVariable) => item.has_out);

        // Show main OUT connector:
        // - Always show if dict itself has has_out=True (even when open)
        // - Show aggregated sub-item outputs only when closed
        const showMainOutConnector = variable.has_out || (hasSubItemOutputs && !isOpen);

        const textColor = isMainValueConnected 
            ? 'text-orange-800 dark:text-yellow-300' 
            : categoryMainTextColor;
            
        const iconColor = isMainValueConnected 
            ? 'text-orange-800 dark:text-yellow-300' 
            : categoryMainTextColor;

        const containerClassName = `flex items-center justify-between rounded-md w-full pl-4 pr-4 pt-1 relative ${disabled ? 'select-none opacity-0' : ''}`;

        // Connector props for main dict variable
        const inConnectorProps = {
            nodeId,
            handle: variable.handle,
            disabled: disabled || isInService,
            groupId,
            nodeVariableType: variable.in_type_override || variableType.validationType
        };

        const outConnectorProps = {
            nodeId,
            handle: variable.handle,
            disabled: disabled || isInService,
            groupId,
            nodeVariableType: variable.out_type_override || variableType.validationType
        };

        const showInConnector = variable.has_in && !disabled && !onlyOut;
        const showOutConnector = showMainOutConnector && !disabled && !onlyIn;
        const showFakeInConnector = variable.has_in && isMirror && !onlyOut;
        const showFakeOutConnector = showMainOutConnector && isMirror && !onlyIn;

        return {
            // Original data
            variable,
            variableType,
            
            // Connection state
            isMainValueConnected,
            isSubValueConnected,
            
            // Display properties
            displayName,
            textColor,
            iconColor,
            containerClassName,
            
            // Dict-specific logic
            hasSubItemOutputs,
            showMainOutConnector,
            shouldShowSubItems: !isMainValueConnected && isOpen && Array.isArray(variable.value),
            
            // Connector configuration
            inConnectorProps,
            outConnectorProps,
            showInConnector,
            showOutConnector,
            showFakeInConnector,
            showFakeOutConnector,
            
            // State flags
            isOpen,
            isDisabled: disabled,
            isMirror,
            
            // Props for sub-components
            subItemProps: {
                variable,
                nodeId,
                onlyIn,
                onlyOut,
                disabled,
                groupId,
                isMirror,
                categoryMainTextColor,
                categorySubTextColor,
                isInService
            }
        };
    }, [
        variable,
        nodeId,
        isOpen,
        isMainValueConnected,
        isSubValueConnected,
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