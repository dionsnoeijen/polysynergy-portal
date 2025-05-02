'use client';

import React, {ReactElement} from "react";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import {FormType, Blueprint, Fundamental} from "@/types/types";
import {PencilIcon, PlusIcon} from "@heroicons/react/24/outline";
import useBlueprintsStore from "@/stores/blueprintsStore";
import useEditorStore from "@/stores/editorStore";
import Link from "next/link";

export default function BlueprintTree(): ReactElement {
    const blueprints = useBlueprintsStore((state) => state.blueprints);
    const openForm = useEditorStore((state) => state.openForm);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeBlueprintId = useEditorStore((state) => state.activeBlueprintId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const setIsExecuting = useEditorStore((state) => state.setIsExecuting);

    return (
        <TreeList
            items={blueprints}
            title={`Blueprints`}
            activeItem={activeBlueprintId}
            formEditingItem={formEditRecordId}
            fundamental={Fundamental.Blueprint}
            renderItem={(blueprint: Blueprint) => (
                <>
                    <Link
                        href={`/project/${activeProjectId}/blueprint/${blueprint.id}`}
                        title={`${blueprint.name} - ${blueprint.id}`}
                        onClick={() => {
                            setIsExecuting('Loading Blueprint')
                        }}
                        className={`block flex-1 truncate  dark:text-gray-200/80 dark:hover:text-white pt-1 pb-1 ${(activeBlueprintId === blueprint.id || formEditRecordId === blueprint.id) ? 'dark:text-white' : 'dark:text-zinc-500'}`}
                    >
                        {blueprint.name}
                    </Link>
                    <div className="flex gap-2 mr-2">
                        <button
                            onClick={() => openForm(FormType.EditBlueprint, blueprint.id)}
                            type="button"
                            className={`p-2 rounded focus:outline-none active:text-zinc-200 group ${activeBlueprintId === blueprint.id || formEditRecordId === blueprint.id ? 'text-white' : 'text-zinc-500 '}`}
                        >
                            <PencilIcon className="w-4 h-4 transition-colors duration-200"/>
                        </button>
                        <button
                            onClick={() => openForm(FormType.PlaceBlueprint, blueprint.id)}
                            type="button"
                            className={`pt-2 pb-2 rounded focus:outline-none active:text-zinc-200 group ${activeBlueprintId === blueprint.id || formEditRecordId === blueprint.id ? 'text-white' : 'text-zinc-500 '}`}
                        >
                            <PlusIcon className="w-4 h-4 transition-colors duration-200"/>
                        </button>
                    </div>
                </>
            )}
            addButtonClick={() =>
                openForm(FormType.AddBlueprint)
            }
        />
    )
}