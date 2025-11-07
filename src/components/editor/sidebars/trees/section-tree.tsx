'use client';

import React, {ReactElement, useEffect} from "react";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import {FormType, Fundamental, Section} from "@/types/types";
import {PencilIcon} from "@heroicons/react/24/outline";
import useSectionsStore from "@/stores/sectionsStore";
import useEditorStore from "@/stores/editorStore";

export default function SectionTree(): ReactElement {
    const sections = useSectionsStore((state) => state.sections);
    const fetchSections = useSectionsStore((state) => state.fetchSections);

    const openForm = useEditorStore((state) => state.openForm);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);

    useEffect(() => {
        fetchSections();
    }, [fetchSections]);

    return (
        <TreeList
            items={sections}
            title="Sections"
            activeItem={null}
            formEditingItem={formEditRecordId as string}
            fundamental={Fundamental.Section}
            dataTourId="add-section-button"
            renderItem={(section: Section) => {
                return (
                    <>
                        <div className="flex-1 flex flex-col py-1 truncate">
                            <div className="flex items-center gap-2">
                                <span className={`text-sm truncate ${formEditRecordId === section.id ? 'text-white' : 'text-sky-500 dark:text-gray-200/80'}`}>
                                    {section.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="truncate">{section.handle}</span>
                            </div>
                        </div>
                        <div className="flex gap-0 mr-2">
                            <button
                                onClick={() => openForm(FormType.EditSection, section.id)}
                                type="button"
                                className="p-2 rounded focus:outline-none active:text-zinc-200 group"
                                title="Edit section"
                            >
                                <PencilIcon
                                    className={`w-4 h-4 transition-colors duration-200 ${formEditRecordId === section.id ? 'text-white' : 'text-sky-500 dark:text-white/70'}`}
                                />
                            </button>
                        </div>
                    </>
                );
            }}
            addButtonClick={() => openForm(FormType.AddSection)}
        />
    );
}
