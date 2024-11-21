import React from "react";

import { NodeVariable } from '@/stores/nodesStore';
import { Field, Fieldset, Label } from "@/components/fieldset";
import { Checkbox, CheckboxField } from "@/components/checkbox";

type Props = {
    variable: NodeVariable;
};

const VariableTypeBoolean: React.FC<Props> = ({variable}): React.ReactElement => {
    return (
        <Fieldset>
            <Label>{variable.handle}</Label>
            <Field>
                <CheckboxField>
                    <Checkbox
                        name={variable.handle}
                        checked={variable.value as boolean}
                        onChange={(e) => {}}
                    />
                </CheckboxField>
            </Field>
        </Fieldset>
    )
};

export default VariableTypeBoolean;
