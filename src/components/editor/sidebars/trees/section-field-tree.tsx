'use client';

import React, {ReactElement, useEffect} from "react";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import {FormType, Fundamental, SectionField} from "@/types/types";
import {PencilIcon} from "@heroicons/react/24/outline";
import useSectionFieldsStore from "@/stores/sectionFieldsStore";
import useEditorStore from "@/stores/editorStore";
import { useBranding } from "@/contexts/branding-context";

export default function SectionFieldTree(): ReactElement {
    const { accent_color } = useBranding();
    const fields = useSectionFieldsStore((state) => state.fields);
    const fieldTypes = useSectionFieldsStore((state) => state.fieldTypes);
    const fetchSectionFields = useSectionFieldsStore((state) => state.fetchSectionFields);
    const fetchFieldTypes = useSectionFieldsStore((state) => state.fetchFieldTypes);
    const getFieldType = useSectionFieldsStore((state) => state.getFieldType);

    const openForm = useEditorStore((state) => state.openForm);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);

    // Fetch field types and fields on mount
    useEffect(() => {
        if (fieldTypes.length === 0) {
            fetchFieldTypes();
        }
        fetchSectionFields();
    }, [fieldTypes.length, fetchFieldTypes, fetchSectionFields]);

    return (
        <TreeList
            items={fields}
            title="Section Fields"
            activeItem={null}
            formEditingItem={formEditRecordId as string}
            fundamental={Fundamental.SectionField}
            dataTourId="add-section-field-button"
            renderItem={(field: SectionField) => {
                const fieldType = getFieldType(field.field_type_handle);

                return (
                    <>
                        <div className="flex-1 flex flex-col py-1 truncate">
                            <div className="flex items-center gap-2">
                                <span className={`text-sm truncate dark:text-gray-200/80`} style={{ color: formEditRecordId === field.id ? 'white' : accent_color }}>
                                    {field.label}
                                </span>
                                {field.is_required && (
                                    <span className="text-red-500 dark:text-red-400">*</span>
                                )}
                                {field.is_unique && (
                                    <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded">
                                        Unique
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="truncate">{field.handle}</span>
                                <span>•</span>
                                <span className="truncate">{fieldType?.label || field.field_type_handle}</span>
                            </div>
                        </div>
                        <div className="flex gap-0 mr-2">
                            <button
                                onClick={() => openForm(FormType.EditSectionField, field.id)}
                                type="button"
                                className="p-2 rounded focus:outline-none active:text-zinc-200 group"
                                title="Edit field"
                            >
                                <PencilIcon
                                    className={`w-4 h-4 transition-colors duration-200 dark:text-white/70`}
                                    style={{ color: formEditRecordId === field.id ? 'white' : accent_color }}
                                />
                            </button>
                        </div>
                    </>
                );
            }}
            addButtonClick={() => openForm(FormType.AddSectionField)}
        />
    );
}
