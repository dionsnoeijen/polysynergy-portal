import {useMemo} from 'react';
import {NodeVariable} from '@/types/types';
import useConnectionsStore from '@/stores/connectionsStore';
import interpretNodeVariableType from '@/utils/interpretNodeVariableType';

export interface FileVariableLogicProps {
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

export const useFileVariableLogic = ({
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
}: FileVariableLogicProps) => {
    const isValueConnected = useConnectionsStore((state) => state.isValueConnectedExcludingGroupBoundary(nodeId, variable.handle));

    return useMemo(() => {
        const variableType = interpretNodeVariableType(variable);
        
        const displayName = (groupId && variable.group_name_override) 
            ? variable.group_name_override 
            : variable.name;

        const textColor = isValueConnected 
            ? 'text-orange-800 dark:text-yellow-300' 
            : categoryMainTextColor;
            
        const iconColor = isValueConnected 
            ? 'text-orange-800 dark:text-yellow-300' 
            : categoryMainTextColor;

        const containerClassName = `flex items-center justify-between rounded-md w-full pl-4 pr-4 pt-1 relative ${disabled ? 'select-none opacity-0' : ''}`;

        // Connector props
        const inConnectorProps = {
            nodeId,
            handle: variable.handle,
            disabled: disabled || isInService,
            groupId,
            nodeVariableType: variableType.validationType
        };

        const outConnectorProps = {
            nodeId,
            handle: variable.handle,
            disabled: disabled || isInService,
            groupId,
            nodeVariableType: variableType.validationType
        };

        const showInConnector = variable.has_in && !disabled && !onlyOut;
        const showOutConnector = variable.has_out && !disabled && !onlyIn;
        const showFakeInConnector = variable.has_in && isMirror && !onlyOut;
        const showFakeOutConnector = variable.has_out && isMirror && !onlyIn;

        return {
            // Original data
            variable,
            variableType,
            
            // Connection state
            isValueConnected,
            
            // Display properties
            displayName,
            textColor,
            iconColor,
            containerClassName,
            
            // File-specific properties
            isOpen,
            shouldShowFileList: !isValueConnected && isOpen && Array.isArray(variable.value),
            fileList: Array.isArray(variable.value) ? (variable.value as string[]) : [],
            
            // Connector configuration
            inConnectorProps,
            outConnectorProps,
            showInConnector,
            showOutConnector,
            showFakeInConnector,
            showFakeOutConnector,
            
            // State flags
            isDisabled: disabled,
            isMirror,
            
            // Props for sub-components
            fileListProps: {
                variable,
                nodeId,
                categorySubTextColor,
                categoryMainTextColor,
                textColor
            }
        };
    }, [
        variable,
        nodeId,
        isOpen,
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