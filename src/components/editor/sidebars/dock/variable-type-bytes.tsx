import React from "react";
import useNodesStore from "@/stores/nodesStore";
import {VariableTypeProps} from "@/types/types";
import {Field, Fieldset} from "@/components/fieldset";
import {Textarea} from "@/components/textarea";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import useConnectionsStore from "@/stores/connectionsStore";
import ValueConnected from "@/components/editor/sidebars/dock/value-connected";

const VariableTypeBytes: React.FC<VariableTypeProps> = ({nodeId, variable, publishedButton = true}) => {
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        updateNodeVariable(nodeId, variable.handle, newValue);
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
                        <Textarea
                            onChange={handleChange}
                            placeholder={variable.handle}
                            aria-label={variable.handle}
                            defaultValue={variable.value as string || ""}
                        />
                    </Field>
                </Fieldset>
            )}
        </>
    );
};

export default VariableTypeBytes;
