import React from 'react';
import {BoltIcon, CodeBracketSquareIcon} from '@heroicons/react/24/outline';

interface SPAContentProps {
    logic?: {
        displayName?: string;
        textColor: string;
        iconColor: string;
        isValueConnected: boolean;
        valueText: string;
        categorySubTextColor?: string;
    };
}

const SPAContent: React.FC<SPAContentProps> = ({ logic }) => {
    if (!logic) return null;

    // Parse project info from valueText if it's JSON
    let projectInfo = '';
    try {
        if (logic.valueText && !logic.isValueConnected) {
            const parsed = JSON.parse(logic.valueText);
            if (parsed.files) {
                const fileCount = Object.keys(parsed.files).length;
                projectInfo = `${fileCount} file${fileCount !== 1 ? 's' : ''}`;
            }
        }
    } catch {
        projectInfo = '';
    }

    return (
        <>
            <h3 className={`font-semibold truncate ${logic.textColor}`}>
                {logic.displayName || 'Unknown'}:
            </h3>
            <CodeBracketSquareIcon className={`w-4 h-4 ml-1 text-purple-600 dark:text-purple-400`} />
            {logic.isValueConnected ? (
                <span className="ml-1">
                    <BoltIcon className={'w-4 h-4 text-orange-800 dark:text-yellow-300'} />
                </span>
            ) : (
                <span className={`ml-1 truncate ${logic.categorySubTextColor}`}>
                    {projectInfo || 'SPA Project'}
                </span>
            )}
        </>
    );
};

export default SPAContent;
