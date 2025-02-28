import React, {ReactElement, useEffect} from "react";
import useEditorStore from "@/stores/editorStore";
import useProjectSecretsStore from "@/stores/projectSecretsStore";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import {FormType, Secret} from "@/types/types";
import {PencilIcon} from "@heroicons/react/24/outline";

export default function SecretTree(): ReactElement {
    const secrets = useProjectSecretsStore((state) => state.secrets);
    const fetchSecrets = useProjectSecretsStore((state) => state.fetchSecrets);
    const openForm = useEditorStore((state) => state.openForm);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeProjectVariableId = useEditorStore((state) => state.activeProjectVariableId);

    useEffect(() => {
        fetchSecrets();
    }, [fetchSecrets]);

    const handleEditVariable = (key: string) => {
        openForm(FormType.EditProjectSecret, key);
    };

    return (
        <TreeList
            items={secrets}
            title="Project Secrets"
            activeItem={activeProjectVariableId}
            formEditingItem={formEditRecordId}
            renderItem={(secret: Secret) => (
                <div className="flex justify-between items-center w-full">
                    <span className="select-none">{secret.key}</span>
                    <div className="flex gap-2 mr-2">
                        <button
                            onClick={() => handleEditVariable(secret.key)}
                            type="button"
                            className={`pt-2 pb-2 rounded focus:outline-none active:text-zinc-200 ${
                                activeProjectVariableId === secret.key || formEditRecordId === secret.key
                                    ? "text-white"
                                    : "text-zinc-500"
                            }`}
                        >
                            <PencilIcon className="w-4 h-4 transition-colors duration-200"/>
                        </button>
                    </div>
                </div>
            )}
            addButtonClick={() => openForm(FormType.AddProjectSecret)}
            addDisabled={false}
        />
    );
}