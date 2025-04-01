import React from "react";
import {FormType, NodeVariable} from "@/types/types";
import {Field, Fieldset, Label} from "@/components/fieldset";
import {PencilIcon} from "@heroicons/react/24/outline";
import useEditorStore from "@/stores/editorStore";
import useConnectionsStore from "@/stores/connectionsStore";
import ValueConnected from "@/components/editor/sidebars/dock/value-connected";

type Props = {
    nodeId: string;
    variable: NodeVariable;
};

const VariableTypeCode: React.FC<Props> = ({nodeId, variable}) => {
    const { openForm } = useEditorStore();

    const onEdit = (nodeId: string) => {
        openForm(FormType.EditCode, nodeId, variable);
    };

    const isValueConnected = useConnectionsStore((state) => state.isValueConnected(nodeId, variable.handle));

    return (
        <>
            {isValueConnected ? (
                <ValueConnected variable={variable} />
            ) : (
                <Fieldset>
                    <Label>{variable.handle}</Label>
                    <Field>
                        <button
                            className="text-slate-500 hover:text-slate-600 w-full pb-1 ring-1 ring-white/20 rounded-md"
                            onClick={() => onEdit(nodeId)}
                        >
                            <PencilIcon className="w-4 h-4 inline text-slate-300"/>
                        </button>
                    </Field>
                </Fieldset>
            )}
        </>
    );
};

export default VariableTypeCode;
