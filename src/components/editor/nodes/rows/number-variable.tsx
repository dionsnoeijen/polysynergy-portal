import React from "react";
import {NodeVariable} from "@/types/types";
import InterpretedVariableContainer from '@/components/editor/nodes/rows/containers/interpreted-variable-container';
import NumberContent from '@/components/editor/nodes/rows/components/number-content';

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

const NumberVariable: React.FC<Props> = ({
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
}) => {
    return (
        <InterpretedVariableContainer
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
            {(logic) => <NumberContent logic={logic} />}
        </InterpretedVariableContainer>
    );
};

export default NumberVariable;