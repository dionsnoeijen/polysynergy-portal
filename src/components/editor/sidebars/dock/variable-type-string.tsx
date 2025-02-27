import React from "react";
import { VariableTypeProps } from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import { Input } from "@/components/input";
import { Field, FieldGroup, Fieldset } from "@/components/fieldset";
import { Select } from "@/components/select";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";


const VariableTypeString: React.FC<VariableTypeProps> = ({nodeId, variable, publishedButton = true}) => {
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
        const newValue = e.target.value;
        updateNodeVariable(nodeId, variable.handle, newValue);
    };

    return (
        <Fieldset className={'w-full'}>
            {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable} />)}
            <Field>
                <FieldGroup>
                {variable.dock && variable.dock.select_values ? (
                    <Select
                        disabled={variable.dock.field_enabled === false}
                        onChange={handleChange}
                        defaultValue={variable.value as string}
                    >
                        {Object.entries(variable.dock.select_values).map(([key, v]) => (
                        <option key={key} value={key}>{v}</option>
                        ))}
                    </Select>
                ) : (
                    <Input
                        disabled={variable.dock && variable.dock.field_enabled === false}
                        type="text"
                        value={variable.value as string || ""}
                        onChange={handleChange}
                        placeholder={variable.handle}
                        aria-label={variable.handle}
                    />
                )}
                </FieldGroup>
            </Field>
        </Fieldset>
    );
};

export default VariableTypeString;
