import React from "react";

import { NodeVariable } from '@/stores/nodesStore';
import { Field, Fieldset, Label } from "@/components/fieldset";
import { Input } from "@/components/input";

type Props = {
    variable: NodeVariable;
};

const VariableTypeNumber: React.FC<Props> = ({ variable }): React.ReactElement => {
    const value =
        typeof variable.value === 'number' ? variable.value :
            typeof variable.value === 'string' && !isNaN(parseFloat(variable.value)) ? parseFloat(variable.value) :
                '';

    return (
        <Fieldset>
            <Label>{variable.handle}</Label>
            <Field>
                <Input
                    type="number"
                    value={value}
                    onChange={(e) => {
                        const parsedValue = parseFloat(e.target.value);
                        if (!isNaN(parsedValue)) {
                            console.log(`Nieuwe waarde: ${parsedValue}`);
                        }
                    }}
                    placeholder={variable.handle}
                    aria-label={variable.handle}
                />
            </Field>
        </Fieldset>
    );
};

export default VariableTypeNumber;
