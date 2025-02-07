import React from "react";
import { NodeVariable } from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import { Field, Fieldset, Label } from "@/components/fieldset";
import RichTextEditor from "@/components/rich-text-editor";

type Props = {
    nodeId: string;
    variable: NodeVariable;
};

const VariableTypeRichTextArea: React.FC<Props> = ({ nodeId, variable }) => {
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const handleChange = (value: string) => {
        updateNodeVariable(nodeId, variable.handle, value);
    };

    return (
        <Fieldset>
            <Label>{variable.handle}</Label>
            <Field>
                <RichTextEditor
                    onChange={(value: string) => handleChange(value)}
                    value={variable.value as string || ""}
                />
            </Field>
        </Fieldset>
    );
};

export default VariableTypeRichTextArea;
