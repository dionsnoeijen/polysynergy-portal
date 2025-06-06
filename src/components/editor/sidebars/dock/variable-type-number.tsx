import React from "react";
import useNodesStore from "@/stores/nodesStore";
import {VariableTypeProps} from "@/types/types";
import {Field, Fieldset} from "@/components/fieldset";
import {Input} from "@/components/input";
import {Select} from "@/components/select";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import useConnectionsStore from "@/stores/connectionsStore";
import ValueConnected from "@/components/editor/sidebars/dock/value-connected";

const VariableTypeNumber: React.FC<VariableTypeProps> = ({
    nodeId,
    variable,
    publishedButton = true,
    inDock = true
}): React.ReactElement => {
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const value =
        typeof variable.value === "number"
            ? variable.value
            : typeof variable.value === "string" && !isNaN(parseFloat(variable.value))
                ? parseFloat(variable.value)
                : "";

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        if (!isNaN(newValue)) {
            updateNodeVariable(nodeId, variable.handle, newValue);
        }
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
                        {variable.dock && variable.dock.select_values ? (
                            <Select
                                disabled={variable?.dock?.enabled === false || (variable.published && inDock)}
                                onChange={handleChange}
                                defaultValue={value}
                            >
                                {Object.entries(variable.dock.select_values).map(([key, v]) => (
                                    <option key={key} value={key}>
                                        {v}
                                    </option>
                                ))}
                            </Select>
                        ) : (
                            <Input
                                type="number"
                                value={value}
                                disabled={variable?.dock?.enabled === false || (variable.published && inDock)}
                                onChange={handleChange}
                                placeholder={variable.handle}
                                aria-label={variable.handle}
                            />
                        )}
                    </Field>
                </Fieldset>
            )}
        </>
    );
};

export default VariableTypeNumber;
