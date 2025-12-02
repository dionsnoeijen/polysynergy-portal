import React, {ReactElement} from "react";
import useEditorStore from "@/stores/editorStore";
import useEnvVarsStore from "@/stores/envVarsStore"; // nieuwe store voor env vars
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import {FormType, Fundamental, EnvVar} from "@/types/types";
import {PencilIcon, PlusIcon} from "@heroicons/react/24/outline";
import useAvailableNodeStore from "@/stores/availableNodesStore";
import {globalToLocal} from "@/utils/positionUtils";
import useNodesStore from "@/stores/nodesStore";
import {Node} from "@/types/types";
import {v4 as uuidv4} from "uuid";
import { useBranding } from "@/contexts/branding-context";

export default function ProjectEnvVarTree(): ReactElement {
    const { accent_color } = useBranding();
    const envVars = useEnvVarsStore((state) => state.envVars);
    const openForm = useEditorStore((state) => state.openForm);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeProjectVariableId = useEditorStore((state) => state.activeProjectVariableId);
    const getAvailableNodeByPath = useAvailableNodeStore((state) => state.getAvailableNodeByPath);
    const addNode = useNodesStore((state) => state.addNode);

    const handleEditVariable = (key: string) => {
        openForm(FormType.EditProjectEnvVar, key);
    };

    const handleAddEnvVarNode = (mouseX: number, mouseY: number, key: string) => {
        let node: Node | undefined = getAvailableNodeByPath('polysynergy_nodes.environment.variable_environment.VariableEnvironment');
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

        const keyVar = node.variables.find((v) => v.handle === "true_path");
        if (keyVar) {
            keyVar.value = key;
        }

        addNode(node, true);
    };

    return (
        <TreeList
            items={envVars}
            title="Environment Variables"
            activeItem={activeProjectVariableId}
            formEditingItem={formEditRecordId as string}
            fundamental={Fundamental.EnvVar}
            dataTourId={"add-environment-variable-button"}
            renderItem={(envVar: EnvVar) => (
                <div className="flex justify-between items-center w-full">
                    <span className="select-none dark:text-gray-200/80" style={{ color: (activeProjectVariableId === envVar.key || formEditRecordId === envVar.key) ? 'white' : accent_color }}>{envVar.key}</span>
                    <div className="flex gap-2 mr-2">
                        <button
                            onClick={() => handleEditVariable(envVar.key)}
                            type="button"
                            className={`pt-2 pb-2 rounded focus:outline-none active:text-zinc-200 ${
                                activeProjectVariableId === envVar.key || formEditRecordId === envVar.key
                                    ? "text-white"
                                    : "text-zinc-500"
                            }`}
                        >
                            <PencilIcon className="w-4 h-4 transition-colors duration-200 dark:text-white/70" style={{ color: (activeProjectVariableId === envVar.key || formEditRecordId === envVar.key) ? 'white' : accent_color }}/>
                        </button>
                        <button
                            onClick={(e: React.MouseEvent) => handleAddEnvVarNode(e.clientX, e.clientY, envVar.key)}
                            type="button"
                            className="pt-2 pb-2 rounded focus:outline-none active:text-zinc-200 group"
                        >
                            <PlusIcon className="w-4 h-4 transition-colors duration-200 dark:text-white/70" style={{ color: (activeProjectVariableId === envVar.key || formEditRecordId === envVar.key) ? 'white' : accent_color }}/>
                        </button>
                    </div>
                </div>
            )}
            addButtonClick={() => openForm(FormType.AddProjectEnvVar)}
            addDisabled={false}
        />
    );
}