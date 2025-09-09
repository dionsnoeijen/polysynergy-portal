'use client';

import React, {useState} from 'react';
import {ChevronDownIcon, ChevronRightIcon, DocumentTextIcon} from '@heroicons/react/24/outline';

interface ReferenceItem {
    meta_data?: {
        page?: number;
        source?: string; // Legacy support
        document_name?: string;
        source_url?: string;
        [key: string]: unknown;
    };
    name?: string;
    content: string;
}

interface ReferenceDisplayProps {
    references: ReferenceItem[];
}

const ReferenceDisplay: React.FC<ReferenceDisplayProps> = ({references}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

    const toggleExpanded = () => setIsExpanded(!isExpanded);

    const toggleItemExpanded = (index: number) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedItems(newExpanded);
    };

    const truncateContent = (content: string, maxLength: number = 150) => {
        if (content.length <= maxLength) return content;
        return content.slice(0, maxLength).trim() + '...';
    };

    const getSourceInfo = (item: ReferenceItem) => {
        const parts = [];

        // Prioritize document_name over generic name
        const documentName = item.meta_data?.document_name || item.name;
        if (documentName) parts.push(documentName);

        // Add page information
        if (item.meta_data?.page) parts.push(`page ${item.meta_data.page}`);

        // Add source information (legacy support)
        if (item.meta_data?.source) parts.push(item.meta_data.source);

        return parts.join(' • ') || 'Document';
    };

    return (
        <div
            className="border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3 bg-blue-50/50 dark:bg-blue-950/20">
            {/* Header */}
            <button
                onClick={toggleExpanded}
                className="flex items-center gap-2 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
            >
                {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4"/>
                ) : (
                    <ChevronRightIcon className="w-4 h-4"/>
                )}
                <DocumentTextIcon className="w-4 h-4"/>
                <span className="font-medium text-sm">
                    References ({references.length})
                </span>
            </button>

            {/* Collapsed preview */}
            {!isExpanded && references.length > 0 && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {getSourceInfo(references[0])}
                    {references.length > 1 && ` and ${references.length - 1} more...`}
                </div>
            )}

            {/* Expanded content */}
            {isExpanded && (
                <div className="mt-3 space-y-3">
                    {references.map((item, index) => (
                        <div
                            key={index}
                            className="border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                        >
                            {/* Reference item header */}
                            <button
                                onClick={() => toggleItemExpanded(index)}
                                className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors rounded-t-md"
                            >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {expandedItems.has(index) ? (
                                        <ChevronDownIcon className="w-3 h-3 text-gray-500 flex-shrink-0"/>
                                    ) : (
                                        <ChevronRightIcon className="w-3 h-3 text-gray-500 flex-shrink-0"/>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                            {getSourceInfo(item)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {truncateContent(item.content, 80)}
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {/* Reference item content */}
                            {expandedItems.has(index) && (
                                <div className="px-3 pb-3">
                                    <div
                                        className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed border-t border-gray-200 dark:border-gray-700 pt-2">
                                        {item.content}
                                    </div>
                                    {item.meta_data && Object.keys(item.meta_data).length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                <strong>Source Information:</strong>
                                                <div className="mt-1 space-y-1">
                                                    {item.meta_data.document_name && (
                                                        <div><strong>Document:</strong> {item.meta_data.document_name}
                                                        </div>
                                                    )}
                                                    {item.meta_data.page && (
                                                        <div><strong>Page:</strong> {item.meta_data.page}</div>
                                                    )}
                                                    {item.meta_data.source_url && (
                                                        <div>
                                                            <strong>Source:</strong>
                                                            <a
                                                                href={item.meta_data.source_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
                                                            >
                                                                {item.meta_data.source_url.length > 50
                                                                    ? item.meta_data.source_url.substring(0, 47) + '...'
                                                                    : item.meta_data.source_url
                                                                }
                                                            </a>
                                                        </div>
                                                    )}
                                                    {/* Show other metadata */}
                                                    {Object.entries(item.meta_data).map(([key, value]) => {
                                                        if (key === 'document_name' || key === 'page' || key === 'source_url') return null;
                                                        return (
                                                            <div key={key} className="font-mono text-xs">
                                                                <strong>{key}:</strong> {JSON.stringify(value)}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReferenceDisplay;