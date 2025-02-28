import React, {ReactElement, useEffect} from "react";
import useEditorStore from "@/stores/editorStore";
import useProjectSecretsStore from "@/stores/projectSecretsStore";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import {FormType, Secret} from "@/types/types";
import {PencilIcon, PlusIcon} from "@heroicons/react/24/outline";
import useAvailableNodeStore from "@/stores/availableNodesStore";
import {globalToLocal} from "@/utils/positionUtils";
import useNodesStore from "@/stores/nodesStore";

export default function SecretTree(): ReactElement {
    const secrets = useProjectSecretsStore((state) => state.secrets);
    const fetchSecrets = useProjectSecretsStore((state) => state.fetchSecrets);
    const openForm = useEditorStore((state) => state.openForm);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeProjectVariableId = useEditorStore((state) => state.activeProjectVariableId);
    const getAvailableNodeByPath = useAvailableNodeStore((state) => state.getAvailableNodeByPath);
    const addNode = useNodesStore((state) => state.addNode);

    useEffect(() => {
        fetchSecrets();
    }, [fetchSecrets]);

    const handleEditVariable = (key: string) => {
        openForm(FormType.EditProjectSecret, key);
    };

    const handleAddSecretNode = (mouseX: number, mouseY: number, id: string) => {
        const node = getAvailableNodeByPath('nodes.nodes.secret.variable_secret.VariableSecret');
        if (!node) return;

        const { x, y } = globalToLocal(mouseX, mouseY);
        node.view = {
            x,
            y,
            width: 200,
            height: 200,
            collapsed: false,
            adding: true
        };

        const secretIdVar = node.variables.find((v: any) => v.handle === "secret_id");
        if (secretIdVar) {
            secretIdVar.value = id;
        }

        addNode(node);
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
                        <button
                            onClick={(e: React.MouseEvent) => handleAddSecretNode(e.clientX, e.clientY, secret.id)}
                            type="button"
                            className={`pt-2 pb-2 rounded focus:outline-none active:text-zinc-200 group`}
                        >
                            <PlusIcon className="w-4 h-4 transition-colors duration-200"/>
                        </button>
                    </div>
                </div>
            )}
            addButtonClick={() => openForm(FormType.AddProjectSecret)}
            addDisabled={false}
        />
    );
}