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
    // categoryBorder = 'border border-sky-200 dark:border-zinc-700',
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

    const isValueConnected = useConnectionsStore((state) => state.isValueConnectedExcludingGroupBoundary(nodeId, variable.handle));

    return (
        <>
            {isValueConnected ? (
                <ValueConnected variable={variable} />
            ) : (
                <Fieldset>
                    {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable}/>)}
                    <Field>
                        <div className={`relative block w-full rounded-md px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] sm:px-[calc(theme(spacing.3)-1px)] sm:py-[calc(theme(spacing[1.5])-1px)] border border-zinc-950/10 hover:border-zinc-950/20 dark:border-white/10 dark:hover:border-white/20 bg-transparent dark:bg-white/5 flex items-center justify-center min-h-[calc(1.5rem+calc(theme(spacing[2.5])-1px)*2)] sm:min-h-[calc(1.25rem+calc(theme(spacing[1.5])-1px)*2)] ${variable.published && inDock ? 'shadow-[0_0_0_2px_rgb(59_130_246)] dark:shadow-[0_0_0_2px_rgb(96_165_250)]' : ''}`}>
                            <CheckboxField>
                                <Checkbox
                                    disabled={variable?.dock?.enabled === false}
                                    name={variable.handle}
                                    checked={!!displayValue}
                                    onChange={handleChange}
                                    className=""
                                />
                            </CheckboxField>
                        </div>
                    </Field>
                </Fieldset>
            )}
        </>
    );
};

export default VariableTypeBoolean;
