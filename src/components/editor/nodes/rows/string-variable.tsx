import React from "react";
import { NodeVariable } from "@/types/types";
import StringVariableContainer from '@/components/editor/nodes/rows/containers/string-variable-container';
import StringContent from '@/components/editor/nodes/rows/components/string-content';

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

const StringVariable: React.FC<Props> = ({
    variable,
    nodeId,
    onlyIn = false,
    onlyOut = false,
    disabled = false,
    groupId,
    isMirror = false,
    categoryMainTextColor = 'text-slate-300',
    categorySubTextColor = 'text-slate-400',
    isInService = false
}): React.ReactElement => {
    return (
        <StringVariableContainer
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
            {(logic) => <StringContent logic={logic} />}
        </StringVariableContainer>
    );
};

export default StringVariable;