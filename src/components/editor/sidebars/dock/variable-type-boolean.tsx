import React from "react";

import useNodesStore from "@/stores/nodesStore";

import {VariableTypeProps} from "@/types/types";
import {Field, Fieldset} from "@/components/fieldset";
import {Checkbox, CheckboxField} from "@/components/checkbox";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import useConnectionsStore from "@/stores/connectionsStore";
import ValueConnected from "@/components/editor/sidebars/dock/value-connected";

const VariableTypeBoolean: React.FC<VariableTypeProps> = ({
    nodeId,
    variable,
    publishedButton = true,
    onChange,
    currentValue,
}): React.ReactElement => {
    const updateNodeVariable =
        useNodesStore((state) => state.updateNodeVariable);

    const handleChange =
        (checked: boolean) => {
            if (onChange) {
                onChange(checked);
            } else {
                updateNodeVariable(nodeId, variable.handle, checked);
            }
        };

    const displayValue = currentValue !== undefined ? currentValue : (variable.value as boolean) || false;

    const isValueConnected = useConnectionsStore((state) => state.isValueConnected(nodeId, variable.handle));

    return (
        <>
            {isValueConnected ? (
                <ValueConnected variable={variable} />
            ) : (
                <Fieldset>
                    {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable}/>)}
                    <Field>
                        <CheckboxField>
                            <Checkbox
                                disabled={variable?.dock?.enabled === false || variable.published}
                                name={variable.handle}
                                checked={!!displayValue}
                                onChange={handleChange}
                            />
                        </CheckboxField>
                    </Field>
                </Fieldset>
            )}
        </>
    );
};

export default VariableTypeBoolean;
