import React from 'react';
import {useInterpretedVariableLogic} from '@/hooks/editor/nodes/variables/useInterpretedVariableLogic';
import {BoltIcon, DocumentTextIcon} from "@heroicons/react/24/outline";
import {truncateText} from "@/utils/truncateText";

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

    // When not connected, show truncated preview (max 300 chars)
    if (logic.variable.value) {
        // Strip HTML tags and truncate to prevent node from growing too large
        const strippedText = (logic.variable.value as string).replace(/<[^>]*>/g, '');
        const preview = truncateText(strippedText, 300);

        return (
            <div className={`note-text ${logic.categorySubTextColor} whitespace-pre-wrap`}>
                {preview}
            </div>
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