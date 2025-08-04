import React from 'react';
import {useInterpretedVariableLogic} from '@/hooks/editor/nodes/variables/useInterpretedVariableLogic';
import {BoltIcon, HashtagIcon} from "@heroicons/react/24/outline";

interface NumberContentProps {
    logic: ReturnType<typeof useInterpretedVariableLogic>;
}

const NumberContent: React.FC<NumberContentProps> = ({ logic }) => {
    const value =
        typeof logic.variable.value === "number"
            ? logic.variable.value
            : typeof logic.variable.value === "string" && !isNaN(parseFloat(logic.variable.value))
                ? parseFloat(logic.variable.value)
                : "";

    return (
        <>
            <h3 className={`font-semibold truncate ${logic.textColor}`}>
                {logic.displayName}:
            </h3>
            <HashtagIcon className={`w-4 h-4 ml-1 ${logic.iconColor}`} />
            {logic.isValueConnected ? (
                <span className="ml-1">
                    <BoltIcon className={'w-4 h-4 text-orange-800 dark:text-yellow-300'} />
                </span>
            ) : (
                <span className={`ml-1 ${logic.categorySubTextColor}`}>{value}</span>
            )}
        </>
    );
};

export default NumberContent;