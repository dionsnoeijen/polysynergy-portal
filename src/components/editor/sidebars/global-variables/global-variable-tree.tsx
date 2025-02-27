import React, { ReactElement } from "react";
import useGlobalVariablesStore from "@/stores/globalVariablesStore";
import useEditorStore from "@/stores/editorStore";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import {FormType } from "@/types/types";
import {PencilIcon, TrashIcon} from "@heroicons/react/24/outline";

export default function GlobalVariableTree(): ReactElement {
    const globalVariables = useGlobalVariablesStore((state) => state.globalVariables);
    const removeGlobalVariable = useGlobalVariablesStore((state) => state.removeGlobalVariable);
    const openForm = useEditorStore((state) => state.openForm);

    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeGlobalVariableId = useEditorStore((state) => state.activeGlobalVariableId);

    const variableItems = Object.entries(globalVariables).map(([key, value]) => ({
        key,
        ...value,
    }));

    const handleEditVariable = (key: string) => {
        openForm(FormType.EditGlobalVariable, key);
    };

    const handleRemoveVariable = (key: string) => {
        removeGlobalVariable(key);
    };

    return (
        <TreeList
            items={variableItems}
            title="Global Variables"
            activeItem={activeGlobalVariableId}
            formEditingItem={formEditRecordId}
            renderItem={(variable: { key: string; name?: string; handle: string; value: any; published: boolean; type: string }) => (
                <div className="flex justify-between items-center w-full">
                    <span className="select-none">
                        {variable.name || variable.handle || variable.key} {/* Toon naam, handle of key */}
                    </span>
                    <div className="flex gap-2 mr-2">
                        <button
                            onClick={() => handleEditVariable(variable.key)}
                            type="button"
                            className={`pt-2 pb-2 rounded focus:outline-none active:text-zinc-200 group ${
                                activeGlobalVariableId === variable.key || formEditRecordId === variable.key
                                    ? "text-white"
                                    : "text-zinc-500"
                            }`}
                        >
                            <PencilIcon className="w-4 h-4 transition-colors duration-200" />
                        </button>
                        <button
                            onClick={() => handleRemoveVariable(variable.key)}
                            type="button"
                            className={`pt-2 pb-2 rounded focus:outline-none active:text-zinc-200 group ${
                                activeGlobalVariableId === variable.key || formEditRecordId === variable.key
                                    ? "text-white"
                                    : "text-zinc-500"
                            }`}
                        >
                            <TrashIcon className="w-4 h-4 transition-colors duration-200" />
                        </button>
                    </div>
                </div>
            )}
            addButtonClick={() => openForm(FormType.AddGlobalVariable)}
            addDisabled={false}
        />
    );
}