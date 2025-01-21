import React, {ReactElement, useEffect} from "react";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import {FormType, Blueprint} from "@/types/types";
import {PencilIcon} from "@heroicons/react/24/outline";
import useBlueprintsStore from "@/stores/blueprintsStore";
import useEditorStore from "@/stores/editorStore";

export default function BlueprintTree(): ReactElement {
    const { blueprints } = useBlueprintsStore();
    const { openForm, formEditRecordId, activeBlueprintId } = useEditorStore();

    useEffect(() => {
        // Fetch blueprints
    }, []);

    return (
        <TreeList
            items={blueprints}
            title={`Blueprints`}
            activeItem={activeBlueprintId}
            formEditingItem={formEditRecordId}
            renderItem={(blueprint: Blueprint) => (
                <>
                    {blueprint.name}
                    <button
                        onClick={() => openForm(FormType.EditBlueprint, blueprint.id)}
                        type="button"
                        className={`p-2 rounded focus:outline-none active:text-zinc-200 group ${activeBlueprintId === blueprint.id || formEditRecordId === blueprint.id ? 'text-white' : 'text-zinc-500 '}`}
                    >
                        <PencilIcon className="w-4 h-4 transition-colors duration-200"/>
                    </button>
                </>
            )}
            addButtonClick={() => openForm(FormType.AddBlueprint)}
        />
    )
}