import React from 'react';
import {NodeVariable} from '@/types/types';
import SimpleVariableContainer from '@/components/editor/nodes/rows/containers/simple-variable-container';
import DatetimeContent from '@/components/editor/nodes/rows/components/datetime-content';

type Props = {
    variable: NodeVariable;
    nodeId: string;
    onlyIn?: boolean;
    onlyOut?: boolean;
    disabled?: boolean;
    groupId?: string;
    isMirror?: boolean;
    categoryMainTextColor?: string;
    categorySubTextColor?: string;
    isInService?: boolean;
};

const DatetimeVariable: React.FC<Props> = ({
    variable,
    nodeId,
    onlyIn = false,
    onlyOut = false,
    disabled = false,
    groupId,
    isMirror = false,
    categoryMainTextColor = 'text-sky-600 dark:text-white',
    categorySubTextColor = 'text-sky-400 dark:text-slate-400',
    isInService = false
}: Props) => {
    return (
        <SimpleVariableContainer
            variable={variable}
            nodeId={nodeId}
            onlyIn={onlyIn}
            onlyOut={onlyOut}
            disabled={disabled}
            groupId={groupId}
            isMirror={isMirror}
            categoryMainTextColor={categoryMainTextColor}
            categorySubTextColor={categorySubTextColor}
            isInService={isInService}
        >
            {(logic) => <DatetimeContent logic={logic} />}
        </SimpleVariableContainer>
    );
}

export default DatetimeVariable;