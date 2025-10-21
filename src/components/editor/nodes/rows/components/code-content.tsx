import React from 'react';
import {useInterpretedVariableLogic} from '@/hooks/editor/nodes/variables/useInterpretedVariableLogic';
import {BoltIcon, CodeBracketIcon} from "@heroicons/react/24/outline";
import {truncateText} from "@/utils/truncateText";

interface CodeContentProps {
    logic: ReturnType<typeof useInterpretedVariableLogic>;
}

const CodeContent: React.FC<CodeContentProps> = ({ logic }) => {
    return (
        <>
            <h3 className={`font-semibold truncate ${logic.textColor}`}>
                {logic.displayName}:
            </h3>
            <CodeBracketIcon className={`w-4 h-4 ml-1 ${logic.iconColor}`} />
            {logic.isValueConnected ? (
                <span className="ml-1">
                    <BoltIcon className={'w-4 h-4 text-orange-800 dark:text-yellow-300'} />
                </span>
            ) : (
                <span className={`ml-1 truncate ${logic.categorySubTextColor}`}>{truncateText(logic.variable.value as string, 300)}</span>
            )}
        </>
    );
};

export default CodeContent;
