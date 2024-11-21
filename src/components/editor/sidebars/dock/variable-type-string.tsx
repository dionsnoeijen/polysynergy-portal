import React from "react";

import { NodeVariable } from '@/stores/nodesStore';
import { Input } from "@/components/input";
import { Field, Fieldset, Label } from "@/components/fieldset";

type Props = {
    variable: NodeVariable;
};

const VariableTypeString: React.FC<Props> = ({variable}): React.ReactElement => {
    const isString = typeof variable.value === 'string';

    return (
        <Fieldset>
            <Label>{variable.handle}</Label>
            <Field>
                <Input
                    type="text"
                    value={isString ? variable.value : ''}
                    onChange={(e) => {}}
                    placeholder={variable.handle}
                    aria-label={variable.handle}
                />
            </Field>
        </Fieldset>
    )
};

export default VariableTypeString;
