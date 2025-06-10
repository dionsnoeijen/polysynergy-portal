import React, {ReactElement} from "react";
import useEditorStore from "@/stores/editorStore";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import {FormType, Fundamental, NodeVariableWithId} from "@/types/types";
import {PencilIcon} from "@heroicons/react/24/outline";
import useProjectVariablesStore from "@/stores/projectVariablesStore";

export default function ProjectVariableTree(): ReactElement {
    const projectVariables = useProjectVariablesStore((state) => state.projectVariables);
    const openForm = useEditorStore((state) => state.openForm);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeProjectVariableId = useEditorStore((state) => state.activeProjectVariableId);

    const variableItems = Object.entries(projectVariables).map(([key, value]) => ({
        key,
        ...value,
    }));

    const handleEditVariable = (id: string) => {
        openForm(FormType.EditProjectVariable, id);
    };

    return (
        <TreeList
            items={variableItems}
            title="Project Variables"
            activeItem={activeProjectVariableId}
            formEditingItem={formEditRecordId as string}
            fundamental={Fundamental.Variable}
            dataTourId={"add-environment-variable-button"}
            renderItem={(variable: NodeVariableWithId) => (
                <div className="flex justify-between items-center w-full">
                    <span className="select-none dark:text-gray-200/80">
                        {variable.name || variable.handle || variable.id}
                    </span>
                    <div className="flex gap-2 mr-2">
                        <button
                            onClick={() => handleEditVariable(variable.id as string)}
                            type="button"
                            className={`pt-2 pb-2 rounded focus:outline-none active:text-zinc-200 group ${
                                activeProjectVariableId === variable.id || formEditRecordId === variable.id
                                    ? "text-white"
                                    : "text-zinc-500"
                            }`}
                        >
                            <PencilIcon className="w-4 h-4 transition-colors duration-200" />
                        </button>
                    </div>
                </div>
            )}
            addButtonClick={() => openForm(FormType.AddProjectVariable)}
            addDisabled={false}
        />
    );
}