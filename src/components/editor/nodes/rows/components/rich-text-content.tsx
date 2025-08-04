import React from 'react';
import {useInterpretedVariableLogic} from '@/hooks/editor/nodes/variables/useInterpretedVariableLogic';
import {BoltIcon, DocumentTextIcon} from "@heroicons/react/24/outline";

interface RichTextContentProps {
    logic: ReturnType<typeof useInterpretedVariableLogic>;
}

const RichTextContent: React.FC<RichTextContentProps> = ({ logic }) => {
    if (logic.isValueConnected) {
        return (
            <>
                <h3 className={`font-semibold truncate ${logic.textColor}`}>
                    {logic.displayName}:
                </h3>
                <span className="ml-1">
                    <BoltIcon className={'w-4 h-4 text-orange-800 dark:text-yellow-300'} />
                </span>
            </>
        );
    }

    // When not connected, show either HTML content or title+icon
    if (logic.variable.value) {
        return (
            <div 
                className={`note-text ${logic.categorySubTextColor}`}
                dangerouslySetInnerHTML={{__html: logic.variable.value as string}}
            />
        );
    }

    return (
        <>
            <h3 className={`font-semibold truncate ${logic.textColor}`}>
                {logic.displayName}:
            </h3>
            <DocumentTextIcon className={`w-4 h-4 ml-1 ${logic.iconColor}`} />
        </>
    );
};

export default RichTextContent;