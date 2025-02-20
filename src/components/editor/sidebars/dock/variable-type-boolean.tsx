import React from "react";

import { VariableTypeProps } from "@/types/types";
import { Field, Fieldset } from "@/components/fieldset";
import { Checkbox, CheckboxField } from "@/components/checkbox";
import useNodesStore from "@/stores/nodesStore";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";

const VariableTypeBoolean: React.FC<VariableTypeProps> = ({ nodeId, variable, publishedButton = true }): React.ReactElement => {
    const { updateNodeVariable } = useNodesStore();

    const handleChange = (checked: boolean) => {
        updateNodeVariable(nodeId, variable.handle, checked);
    };

    return (
        <Fieldset>
            {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable} />)}
            <Field>
                <CheckboxField>
                    <Checkbox
                        name={variable.handle}
                        checked={!!variable.value}
                        onChange={handleChange}
                    />
                </CheckboxField>
            </Field>
        </Fieldset>
    );
};

export default VariableTypeBoolean;
