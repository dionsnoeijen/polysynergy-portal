import React from "react";

import useNodesStore, { NodeVariable } from "@/stores/nodesStore";
import { Field, Fieldset, Label } from "@/components/fieldset";
import { Input } from "@/components/input";

type Props = {
    nodeId: string;
    variable: NodeVariable;
};

const VariableTypeNumber: React.FC<Props> = ({ nodeId, variable }): React.ReactElement => {
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const value =
        typeof variable.value === "number"
            ? variable.value
            : typeof variable.value === "string" && !isNaN(parseFloat(variable.value))
                ? parseFloat(variable.value)
                : "";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        if (!isNaN(newValue)) {
            updateNodeVariable(nodeId, variable.handle, newValue);
        }
    };

    return (
        <Fieldset>
            <Label>{variable.handle}</Label>
            <Field>
                <Input
                    type="number"
                    value={value}
                    onChange={handleChange}
                    placeholder={variable.handle}
                    aria-label={variable.handle}
                />
            </Field>
        </Fieldset>
    );
};

export default VariableTypeNumber;
