import React from "react";
import { VariableTypeProps } from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import { Field, Fieldset } from "@/components/fieldset";
import { Textarea } from "@/components/textarea";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";

const VariableTypeTextArea: React.FC<VariableTypeProps> = ({ nodeId, variable, publishedButton = true }) => {
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        updateNodeVariable(nodeId, variable.handle, newValue);
    };

    return (
        <Fieldset>
            {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable} />)}
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

export default VariableTypeTextArea;
