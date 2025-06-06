import React, {ReactElement} from "react";
import useEditorStore from "@/stores/editorStore";
import useProjectSecretsStore from "@/stores/projectSecretsStore";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import {FormType, Fundamental, Secret} from "@/types/types";
import {PencilIcon, PlusIcon} from "@heroicons/react/24/outline";
import useAvailableNodeStore from "@/stores/availableNodesStore";
import {globalToLocal} from "@/utils/positionUtils";
import useNodesStore from "@/stores/nodesStore";
import {Node} from "@/types/types";
import {v4 as uuidv4} from "uuid";

export default function SecretTree(): ReactElement {
    const secrets = useProjectSecretsStore((state) => state.secrets);
    const openForm = useEditorStore((state) => state.openForm);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeProjectVariableId = useEditorStore((state) => state.activeProjectVariableId);
    const getAvailableNodeByPath = useAvailableNodeStore((state) => state.getAvailableNodeByPath);
    const addNode = useNodesStore((state) => state.addNode);

    const handleEditVariable = (key: string) => {
        openForm(FormType.EditProjectSecret, key);
    };

    const handleAddSecretNode = (mouseX: number, mouseY: number, key: string) => {
        let node: Node | undefined = getAvailableNodeByPath('nodes.nodes.secret.variable_secret.VariableSecret');
        if (!node) return;

        node = JSON.parse(JSON.stringify(node)) as Node;

        const { x, y } = globalToLocal(mouseX, mouseY);
        node.id = uuidv4();
        node.view = {
            x,
            y,
            width: 200,
            height: 200,
            collapsed: false,
            adding: true
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const secretIdVar = node.variables.find((v: any) => v.handle === "true_path");
        if (secretIdVar) {
            secretIdVar.value = key;
        }

        addNode(node, true);
    };

    return (
        <TreeList
            items={secrets}
            title="Secrets"
            activeItem={activeProjectVariableId}
            formEditingItem={formEditRecordId}
            fundamental={Fundamental.Secret}
            dataTourId="add-secret-button"
            renderItem={(secret: Secret) => (
                <div className="flex justify-between items-center w-full">
                    <span className="select-none text-sky-500 dark:text-gray-200/80">{secret.key}</span>
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
                            <PencilIcon className="w-4 h-4 transition-colors duration-200 text-sky-500 dark:text-white/70"/>
                        </button>
                        <button
                            onClick={(e: React.MouseEvent) => handleAddSecretNode(e.clientX, e.clientY, secret.key)}
                            type="button"
                            className={`pt-2 pb-2 rounded focus:outline-none active:text-zinc-200 group`}
                        >
                            <PlusIcon className="w-4 h-4 transition-colors duration-200 text-sky-500 dark:text-white/70"/>
                        </button>
                    </div>
                </div>
            )}
            addButtonClick={() => openForm(FormType.AddProjectSecret)}
            addDisabled={false}
        />
    );
}