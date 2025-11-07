import React from 'react';
import {Text} from "@/components/text";
import {Subheading} from "@/components/heading";

const ELEMENTS = [
    { type: 'text', label: 'Text Block', description: 'Rich text with markdown' },
    { type: 'divider', label: 'Divider', description: 'Horizontal line separator' },
    { type: 'heading', label: 'Heading', description: 'Section heading text' }
];

const ElementsLibrary: React.FC = () => {
    const handleDragStart = (e: React.DragEvent, elementType: string) => {
        e.dataTransfer.setData('element', elementType);
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="p-6 space-y-4 border-t border-gray-200 dark:border-white/10">
            <Subheading>Elements</Subheading>

            <div className="space-y-2">
                {ELEMENTS.map((element) => (
                    <div
                        key={element.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, element.type)}
                        className="p-3 rounded border border-gray-300 dark:border-white/20 bg-white dark:bg-zinc-800 cursor-move hover:border-sky-500 dark:hover:border-sky-400 transition-colors"
                    >
                        <Text className="font-medium text-sm">
                            {element.label}
                        </Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {element.description}
                        </Text>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ElementsLibrary;
