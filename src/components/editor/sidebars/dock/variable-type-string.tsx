import React from "react";
import { NodeVariable } from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import { Input } from "@/components/input";
import { Field, Fieldset, Label } from "@/components/fieldset";

type Props = {
    nodeId: string;
    variable: NodeVariable;
};

const VariableTypeString: React.FC<Props> = ({ nodeId, variable }) => {
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        updateNodeVariable(nodeId, variable.handle, newValue);
    };

    return (
        <Fieldset>
            <Label>{variable.handle}</Label>
            <Field>
                <Input
                    type="text"
                    value={variable.value as string || ""}
                    onChange={handleChange}
                    placeholder={variable.handle}
                    aria-label={variable.handle}
                />
            </Field>
        </Fieldset>
    );
};

export default VariableTypeString;
