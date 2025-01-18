import React from "react";
import {FormType, NodeVariable} from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import {Input} from "@/components/input";
import {Field, Fieldset, Label} from "@/components/fieldset";
import {PencilIcon} from "@heroicons/react/16/solid";
import useEditorStore from "@/stores/editorStore";

type Props = {
    nodeId: string;
    variable: NodeVariable;
};

const VariableTypeCode: React.FC<Props> = ({nodeId, variable}) => {
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const { openForm } = useEditorStore();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        updateNodeVariable(nodeId, variable.handle, newValue);
    };

    const onEdit = (nodeId: string) => {
        openForm(FormType.EditCode, nodeId, variable);
    };

    return (
        <Fieldset>
            <Label>{variable.handle}</Label>
            <Field>
                <Input
                    disabled={variable.dock_field_enabled === false}
                    type="text"
                    value={variable.value as string || ""}
                    onChange={handleChange}
                    placeholder={variable.handle}
                    aria-label={variable.handle}
                />
                <button
                    className="text-slate-500 hover:text-slate-600 w-full pb-1"
                    onClick={() => onEdit(nodeId)}
                >
                    <PencilIcon className="w-4 h-4 inline text-slate-300"/>
                </button>
            </Field>
        </Fieldset>
    );
};

export default VariableTypeCode;
