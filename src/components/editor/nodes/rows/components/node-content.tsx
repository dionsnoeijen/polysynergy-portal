import React from 'react';
import {useInterpretedVariableLogic} from '@/hooks/editor/nodes/variables/useInterpretedVariableLogic';
import {BoltIcon, DocumentTextIcon} from "@heroicons/react/24/outline";
import {isPlaceholder} from "@/utils/isPlaceholder";

interface NodeContentProps {
    logic: ReturnType<typeof useInterpretedVariableLogic>;
}

const NodeContent: React.FC<NodeContentProps> = ({ logic }) => {
    return (
        <>
            <h3 className={`font-semibold truncate ${logic.textColor}`}>
                {logic.displayName}:
            </h3>
            <DocumentTextIcon className={`w-4 h-4 ml-1 ${logic.iconColor}`} />
            {logic.isValueConnected ? (
                <span className="ml-1">
                    <BoltIcon className={'w-4 h-4 text-orange-800 dark:text-yellow-300'} />
                </span>
            ) : (
                isPlaceholder(logic.variable.value) ? (
                    <span className="ml-1 text-green-300">{logic.variable.value as string}</span>
                ) : (
                    <span className={`ml-1 ${logic.categorySubTextColor}`}>{logic.variable.value as unknown as string}</span>
                )
            )}
        </>
    );
};

export default NodeContent;