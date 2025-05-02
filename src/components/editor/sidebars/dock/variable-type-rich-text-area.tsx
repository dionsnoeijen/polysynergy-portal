import React from "react";
import useNodesStore from "@/stores/nodesStore";
import {VariableTypeProps} from "@/types/types";
import {Field, Fieldset} from "@/components/fieldset";
import RichTextEditor from "@/components/rich-text-editor";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import useConnectionsStore from "@/stores/connectionsStore";
import ValueConnected from "@/components/editor/sidebars/dock/value-connected";

const VariableTypeRichTextArea: React.FC<VariableTypeProps> = ({nodeId, variable, publishedButton = true}) => {
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const handleChange = (value: string) => {
        updateNodeVariable(nodeId, variable.handle, value);
    };

    const isValueConnected = useConnectionsStore((state) => state.isValueConnected(nodeId, variable.handle));

    return (
        <>
            {isValueConnected ? (
                <ValueConnected variable={variable} />
            ) : (
                <Fieldset>
                    {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable}/>)}
                    <Field>
                        <RichTextEditor
                            disabled={variable?.dock?.enabled === false || variable.published}
                            onChange={(value: string) => handleChange(value)}
                            value={variable.value as string || ""}
                        />
                    </Field>
                </Fieldset>
            )}
        </>
    );
};

export default VariableTypeRichTextArea;
