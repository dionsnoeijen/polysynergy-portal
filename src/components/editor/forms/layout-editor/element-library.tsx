import React from 'react';
import {
    Square2StackIcon,
    ViewColumnsIcon,
    Bars3Icon,
    DocumentTextIcon,
    PhotoIcon,
    CodeBracketIcon,
    CubeIcon,
    ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { ElementType, AvailableComponent } from './types';

type ElementLibraryProps = {
    availableComponents: AvailableComponent[];
    onDragStart: (type: ElementType, componentKey?: string) => void;
};

type LibraryItem = {
    type: ElementType;
    name: string;
    icon: React.ReactNode;
    componentKey?: string;
    description?: string;
};

type LibrarySection = {
    id: string;
    name: string;
    items: LibraryItem[];
};

const ElementLibrary: React.FC<ElementLibraryProps> = ({ availableComponents, onDragStart }) => {
    const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
        layout: true,
        content: true,
        components: true,
    });

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }));
    };

    const sections: LibrarySection[] = [
        {
            id: 'layout',
            name: 'Layout',
            items: [
                {
                    type: 'block',
                    name: 'Block',
                    icon: <Square2StackIcon className="w-5 h-5" />,
                    description: 'Simple container for content',
                },
                {
                    type: 'columns',
                    name: 'Columns',
                    icon: <ViewColumnsIcon className="w-5 h-5" />,
                    description: 'Side-by-side columns',
                },
                {
                    type: 'stack',
                    name: 'Stack',
                    icon: <Bars3Icon className="w-5 h-5" />,
                    description: 'Vertical or horizontal stack',
                },
            ],
        },
        {
            id: 'content',
            name: 'Content',
            items: [
                { type: 'text', name: 'Markdown', icon: <DocumentTextIcon className="w-5 h-5" />, description: 'Rich text with markdown' },
                { type: 'image', name: 'Image', icon: <PhotoIcon className="w-5 h-5" /> },
                { type: 'code', name: 'Code', icon: <CodeBracketIcon className="w-5 h-5" />, description: 'Jinja2 template' },
            ],
        },
        {
            id: 'components',
            name: 'Components',
            items: availableComponents.map(comp => ({
                type: 'component' as ElementType,
                name: comp.label,
                icon: <CubeIcon className="w-5 h-5" />,
                componentKey: comp.key,
            })),
        },
    ];

    const handleDragStart = (e: React.DragEvent, item: LibraryItem) => {
        e.dataTransfer.setData('application/layout-element', JSON.stringify({
            type: item.type,
            componentKey: item.componentKey,
        }));
        e.dataTransfer.effectAllowed = 'copy';
        onDragStart(item.type, item.componentKey);
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-zinc-800">
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Elements
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto">
                {sections.map((section) => (
                    <div key={section.id} className="border-b border-zinc-100 dark:border-zinc-700/50">
                        <button
                            type="button"
                            onClick={() => toggleSection(section.id)}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 uppercase tracking-wider"
                        >
                            {section.name}
                            <ChevronDownIcon
                                className={`w-4 h-4 transition-transform ${expandedSections[section.id] ? '' : '-rotate-90'}`}
                            />
                        </button>

                        {expandedSections[section.id] && (
                            <div className="px-2 pb-2 grid grid-cols-2 gap-1">
                                {section.items.length === 0 ? (
                                    <div className="col-span-2 text-center py-4 text-xs text-zinc-400 dark:text-zinc-500">
                                        No components connected
                                    </div>
                                ) : (
                                    section.items.map((item, index) => (
                                        <div
                                            key={`${item.type}-${item.componentKey || index}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, item)}
                                            className="flex flex-col items-center gap-1 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:border-sky-300 dark:hover:border-sky-600 hover:bg-white dark:hover:bg-zinc-800 cursor-grab active:cursor-grabbing transition-all"
                                        >
                                            <div className="w-8 h-8 rounded-md bg-white dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shadow-sm">
                                                {item.icon}
                                            </div>
                                            <span className="text-xs text-zinc-600 dark:text-zinc-400 text-center truncate w-full">
                                                {item.name}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ElementLibrary;
