import React from "react";

import { NodeVariable } from "@/stores/nodesStore";
import { Field, Fieldset, Label } from "@/components/fieldset";
import { Checkbox, CheckboxField } from "@/components/checkbox";
import useNodesStore from "@/stores/nodesStore";

type Props = {
    nodeId: string;
    variable: NodeVariable;
};

const VariableTypeBoolean: React.FC<Props> = ({ nodeId, variable }): React.ReactElement => {
    const { updateNodeVariable } = useNodesStore();

    const handleChange = (checked: boolean) => {
        updateNodeVariable(nodeId, variable.handle, checked);
    };

    return (
        <Fieldset>
            <Label>{variable.handle}</Label>
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
