import React, { useState, useCallback, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import MarkdownContent from './markdown-content';

interface CollapsibleTeamResponseProps {
    memberName: string;
    memberAvatar?: string | null;
    memberIndex?: number;
    isActive: boolean;
    content: string;
    // runId: string | null; // Removed - not used yet but may be needed for future features
    defaultCollapsed?: boolean;
    onToggle?: (collapsed: boolean) => void;
}

const CollapsibleTeamResponse: React.FC<CollapsibleTeamResponseProps> = ({
    memberName,
    memberAvatar,
    memberIndex,
    isActive,
    content,
    // runId,
    defaultCollapsed = true,
    onToggle,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    // Update local state when defaultCollapsed prop changes (for expand/collapse all)
    useEffect(() => {
        setIsCollapsed(defaultCollapsed);
    }, [defaultCollapsed]);

    const handleToggle = useCallback(() => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        onToggle?.(newState);
    }, [isCollapsed, onToggle]);

    // Get first line of content for preview when collapsed
    const previewText = content.split('\n')[0].substring(0, 100) + (content.length > 100 ? '...' : '');

    return (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden transition-all duration-200">
            {/* Header - Always visible */}
            <button
                onClick={handleToggle}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {/* Activity indicator */}
                    <div className="relative">
                        {isActive ? (
                            <>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
                            </>
                        ) : (
                            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                        )}
                    </div>

                    {/* Avatar */}
                    {memberAvatar && (
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                            <img
                                src={memberAvatar}
                                alt={memberName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Hide image on error
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    {/* Member name and index */}
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                            {memberName}
                        </span>
                        {memberIndex !== undefined && (
                            <span className="px-1.5 py-0.5 text-xs bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded">
                                #{memberIndex + 1}
                            </span>
                        )}
                    </div>

                    {/* Status text */}
                    {isActive && (
                        <span className="text-sm text-green-600 dark:text-green-400 italic">
                            responding...
                        </span>
                    )}
                </div>

                {/* Expand/Collapse icon */}
                <div className="flex items-center gap-2">
                    {isCollapsed && content && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                            {previewText}
                        </span>
                    )}
                    {isCollapsed ? (
                        <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    ) : (
                        <ChevronUpIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    )}
                </div>
            </button>

            {/* Content - Collapsible */}
            <div
                className={`border-t border-gray-200 dark:border-zinc-700 transition-all duration-200 ${
                    isCollapsed ? 'max-h-0 overflow-hidden' : 'max-h-[2000px]'
                }`}
            >
                <div className="px-4 py-3">
                    {content ? (
                        <MarkdownContent
                            text={content}
                            className="text-sm text-gray-700 dark:text-gray-300"
                        />
                    ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                            {isActive ? 'Waiting for response...' : 'No response'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CollapsibleTeamResponse;