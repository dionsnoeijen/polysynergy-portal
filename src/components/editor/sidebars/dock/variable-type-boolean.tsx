import React from "react";

import {VariableTypeProps} from "@/types/types";
import {Field, Fieldset} from "@/components/fieldset";
import {Checkbox, CheckboxField} from "@/components/checkbox";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import ValueConnected from "@/components/editor/sidebars/dock/value-connected";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";

const VariableTypeBoolean: React.FC<VariableTypeProps> = ({
    nodeId,
    variable,
    publishedButton = true,
    onChange,
    currentValue,
    inDock = true,
    categoryBorder = 'border border-sky-200 dark:border-zinc-700',
    // eslint-disable-next-line
    categoryMainTextColor = 'text-sky-500 dark:text-white/70',
    // eslint-disable-next-line
    categorySubTextColor = 'text-sky-800 dark:text-white/70',
    // eslint-disable-next-line
    categoryBackgroundColor = 'bg-white dark:bg-zinc-800 shadow-sm',
    // eslint-disable-next-line
    categoryGradientBackgroundColor = 'bg-gradient-to-r from-sky-100 to-sky-200 dark:from-zinc-800 dark:to-zinc-900',
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
                                disabled={variable?.dock?.enabled === false || (variable.published && inDock)}
                                name={variable.handle}
                                checked={!!displayValue}
                                onChange={handleChange}
                                className={`${categoryBorder}`}
                            />
                        </CheckboxField>
                    </Field>
                </Fieldset>
            )}
        </>
    );
};

export default VariableTypeBoolean;
