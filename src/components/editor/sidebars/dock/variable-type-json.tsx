import React from "react";
import {FormType, VariableTypeProps} from "@/types/types";
import {Field, Fieldset} from "@/components/fieldset";
import {PencilIcon} from "@heroicons/react/24/outline";
import useEditorStore from "@/stores/editorStore";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";

const VariableTypeJson: React.FC<VariableTypeProps> = ({nodeId, variable, publishedButton = true}) => {
    const { openForm } = useEditorStore();

    const onEdit = (nodeId: string) => {
        openForm(FormType.EditJson, nodeId, variable);
    };

    return (
        <Fieldset>
            {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable} />)}
            <Field>
                <button
                    className="text-slate-500 hover:text-slate-600 w-full pb-1 ring-1 ring-white/20 rounded-md"
                    onClick={() => onEdit(nodeId)}
                >
                    <PencilIcon className="w-4 h-4 inline text-slate-300"/>
                </button>
            </Field>
        </Fieldset>
    );
};

export default VariableTypeJson;
