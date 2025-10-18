import React from 'react';
import {BoltIcon, CodeBracketIcon} from '@heroicons/react/24/outline';
import {truncateText} from "@/utils/truncateText";

interface JsonContentProps {
    logic?: {
        displayName?: string;
        textColor: string;
        iconColor: string;
        isValueConnected: boolean;
        valueText: string;
        categorySubTextColor?: string;
    };
}

const JsonContent: React.FC<JsonContentProps> = ({ logic }) => {
    if (!logic) return null;

    return (
        <>
            <h3 className={`font-semibold truncate ${logic.textColor}`}>
                {logic.displayName || 'Unknown'}:
            </h3>
            <CodeBracketIcon className={`w-4 h-4 ml-1 ${logic.iconColor}`} />
            {logic.isValueConnected ? (
                <span className="ml-1">
                    <BoltIcon className={'w-4 h-4 text-orange-800 dark:text-yellow-300'} />
                </span>
            ) : (
                <span className={`ml-1 truncate ${logic.categorySubTextColor}`}>
                    {truncateText(logic.valueText)}
                </span>
            )}
        </>
    );
};

export default JsonContent;