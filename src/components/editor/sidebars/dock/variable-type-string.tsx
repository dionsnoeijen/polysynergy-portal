import React from "react";
import {NodeVariable} from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import {Input} from "@/components/input";
import {Field, Fieldset, Label} from "@/components/fieldset";
import {Select} from "@/components/select";

type Props = {
    nodeId: string;
    variable: NodeVariable;
};

const VariableTypeString: React.FC<Props> = ({nodeId, variable}) => {
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
        const newValue = e.target.value;
        updateNodeVariable(nodeId, variable.handle, newValue);
    };

    return (
        <Fieldset>
            <Label>{variable.handle}</Label>
            <Field>
                {variable.dock.select_values ? (
                    <Select
                        disabled={variable.dock.field_enabled === false}
                        onChange={handleChange} defaultValue={variable.value as string}>
                        {Object.entries(variable.dock.select_values).map(([key, v]) => (
                            <option key={key} value={key}>
                                {v}
                            </option>
                        ))}
                    </Select>
                ) : (
                    <Input
                        disabled={variable.dock.field_enabled === false}
                        type="text"
                        value={variable.value as string || ""}
                        onChange={handleChange}
                        placeholder={variable.handle}
                        aria-label={variable.handle}
                    />
                )}
            </Field>
        </Fieldset>
    );
};

export default VariableTypeString;
