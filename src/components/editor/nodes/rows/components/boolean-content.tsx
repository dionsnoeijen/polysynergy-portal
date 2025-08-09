import React from 'react';
import {BoltIcon, CheckCircleIcon, XCircleIcon} from '@heroicons/react/24/outline';

interface BooleanContentProps {
    logic?: {
        displayName?: string;
        textColor: string;
        iconColor: string;
        isValueConnected: boolean;
        booleanValue: boolean;
        hasValue: boolean;
        valueText: string;
        categorySubTextColor?: string;
    };
}

const BooleanContent: React.FC<BooleanContentProps> = ({ logic }) => {
    if (!logic) return null;

    return (
        <>
            <h3 className={`font-semibold truncate ${logic.textColor}`}>
                {logic.displayName || 'Unknown'}:
            </h3>
            {logic.booleanValue ? (
                <CheckCircleIcon className={`w-4 h-4 ml-1 ${logic.iconColor}`} />
            ) : (
                <XCircleIcon className={`w-4 h-4 ml-1 ${logic.iconColor}`} />
            )}
            {logic.hasValue && logic.valueText && (
                <span className={`ml-1 ${logic.categorySubTextColor}`}>
                    {typeof logic.valueText === 'string' ? logic.valueText : String(logic.valueText)}
                </span>
            )}
            {logic.isValueConnected && (
                <span className="ml-1">
                    <BoltIcon className={'w-4 h-4 text-orange-800 dark:text-yellow-300'} />
                </span>
            )}
        </>
    );
};

export default BooleanContent;