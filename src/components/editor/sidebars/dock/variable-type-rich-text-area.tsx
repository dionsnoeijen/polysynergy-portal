import React from "react";
import useNodesStore from "@/stores/nodesStore";
import { VariableTypeProps } from "@/types/types";
import { Field, Fieldset } from "@/components/fieldset";
import RichTextEditor from "@/components/rich-text-editor";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";

const VariableTypeRichTextArea: React.FC<VariableTypeProps> = ({ nodeId, variable, publishedButton = true }) => {
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const handleChange = (value: string) => {
        updateNodeVariable(nodeId, variable.handle, value);
    };

    return (
        <Fieldset>
            {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable} />)}
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
