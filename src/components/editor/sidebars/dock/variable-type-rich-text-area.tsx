import React from "react";
import { NodeVariable } from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import { Field, Fieldset, Label } from "@/components/fieldset";
import {Textarea} from "@/components/textarea";

type Props = {
    nodeId: string;
    variable: NodeVariable;
};

const VariableTypeRichTextArea: React.FC<Props> = ({ nodeId, variable }) => {
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        updateNodeVariable(nodeId, variable.handle, newValue);
    };

    return (
        <Fieldset>
            <Label>{variable.handle}</Label>
            <Field>
                <Textarea
                    onChange={handleChange}
                    placeholder={variable.handle}
                    aria-label={variable.handle}
                    defaultValue={variable.value as string || ""}
                />
            </Field>
        </Fieldset>
    );
};

export default VariableTypeRichTextArea;
