import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import MarkdownContent from './markdown-content';

type ReasoningBubbleProps = {
    text: string;
    nodeName?: string;
    isTeamMember?: boolean;
};

export const ReasoningBubble: React.FC<ReasoningBubbleProps> = ({
    text,
    nodeName,
    isTeamMember
}) => {
    return (
        <div className="flex items-start gap-3 mb-3 opacity-80">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
            </div>
            <div className="flex-1 bg-purple-50 dark:bg-purple-950 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                <div className="text-xs text-purple-600 dark:text-purple-400 mb-2 font-medium flex items-center gap-1.5">
                    <span>💭 Thinking{nodeName ? ` (${nodeName})` : ''}...</span>
                    {isTeamMember && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-800">
                            TEAM
                        </span>
                    )}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                    <MarkdownContent
                        text={text}
                        enableMarkdown={true}
                        className="italic"
                    />
                </div>
            </div>
        </div>
    );
};

export default React.memo(ReasoningBubble);
