import React, {useState} from 'react';
import {Input} from "@/components/input";
import {Text} from "@/components/text";
import {Subheading} from "@/components/heading";
import {SectionField} from "@/types/types";

interface FieldLibraryProps {
    fields: SectionField[];
    onDragStart: (field: SectionField) => void;
}

const FieldLibrary: React.FC<FieldLibraryProps> = ({fields, onDragStart}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFields = fields.filter(field =>
        field.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        field.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        field.field_type_handle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDragStart = (e: React.DragEvent, field: SectionField) => {
        e.dataTransfer.setData('field', JSON.stringify(field));
        e.dataTransfer.effectAllowed = 'copy';
        onDragStart(field);
    };

    return (
        <div className="p-6 space-y-4">
            <Subheading>Field Library</Subheading>

            <Input
                type="text"
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="space-y-2">
                {filteredFields.length === 0 && (
                    <Text className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                        {searchQuery ? 'No fields found' : 'No fields available'}
                    </Text>
                )}

                {filteredFields.map((field) => (
                    <div
                        key={field.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, field)}
                        className="p-3 rounded-lg border-2 border-gray-300 dark:border-white/20 bg-white dark:bg-zinc-800 cursor-move hover:border-sky-500 dark:hover:border-sky-400 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <Text className="font-medium text-sm truncate">
                                        {field.label}
                                    </Text>
                                    {field.is_required && (
                                        <span className="text-red-500 dark:text-red-400">*</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    <span className="truncate">{field.handle}</span>
                                    <span>•</span>
                                    <span className="truncate">{field.field_type_handle}</span>
                                </div>
                            </div>
                            <div className="text-gray-400 dark:text-gray-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                </svg>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FieldLibrary;
