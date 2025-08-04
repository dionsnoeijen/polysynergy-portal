import React from 'react';
import {BoltIcon, ForwardIcon} from '@heroicons/react/24/outline';

interface DependencyContentProps {
    logic?: {
        displayName?: string;
        textColor: string;
        iconColor: string;
        isValueConnected: boolean;
        valueText: string;
        categorySubTextColor?: string;
    };
}

const DependencyContent: React.FC<DependencyContentProps> = ({ logic }) => {
    if (!logic) return null;

    return (
        <>
            <h3 className={`font-semibold truncate ${logic.textColor}`}>
                {logic.displayName || 'Unknown'}:
            </h3>
            <ForwardIcon className={`w-4 h-4 ml-1 ${logic.iconColor}`} />
            {logic.isValueConnected ? (
                <span className="ml-1">
                    <BoltIcon className={'w-4 h-4 text-orange-800 dark:text-yellow-300'} />
                </span>
            ) : (
                <span className={`ml-1 ${logic.categorySubTextColor}`}>
                    {logic.valueText}
                </span>
            )}
        </>
    );
};

export default DependencyContent;