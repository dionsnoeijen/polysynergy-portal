import React from "react";
import { VariableTypeProps } from "@/types/types";
import { TemplateInput } from "@/components/template-input";
import { Field, FieldGroup, Fieldset } from "@/components/fieldset";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import useConnectionsStore from "@/stores/connectionsStore";
import { nodeHistoryActions } from "@/stores/history";
import ValueConnected from "./value-connected";

const VariableTypeAny: React.FC<VariableTypeProps> = ({
    nodeId,
    variable,
    publishedButton = true,
    onChange,
    inDock = true,
    // eslint-disable-next-line
    categoryBorder = 'border border-sky-200 dark:border-zinc-700',
    // eslint-disable-next-line
    categoryMainTextColor = 'text-sky-500 dark:text-white/70',
    // eslint-disable-next-line
    categorySubTextColor = 'text-sky-800 dark:text-white/70',
    // eslint-disable-next-line
    categoryBackgroundColor = 'bg-white dark:bg-zinc-800 shadow-sm',
    // eslint-disable-next-line
    categoryGradientBackgroundColor = 'bg-gradient-to-r from-sky-100 to-sky-200 dark:from-zinc-800 dark:to-zinc-900'
}) => {
    // Get the full handle (including parent if it's a sub-variable)
    const fullHandle = variable.parentHandle
        ? `${variable.parentHandle}.${variable.handle}`
        : variable.handle;

    const handleChange = (newValue: string) => {
        if (onChange) {
            onChange(newValue);
        } else {
            // Use history-enabled variable update with full handle
            nodeHistoryActions.updateNodeVariableWithHistory(nodeId, fullHandle, newValue);
        }
    };

    const isValueConnected = useConnectionsStore((state) => state.isValueConnectedExcludingGroupBoundary(nodeId, variable.handle));

    return (
        <>
        {
            isValueConnected ? (
                <ValueConnected variable={variable} />
            ) : (
                <Fieldset className={'w-full'}>
                    {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable} />)}
                    <Field>
                        <FieldGroup>
                            <TemplateInput
                                disabled={variable?.dock?.enabled === false}
                                type="text"
                                value={variable.value as string || ""}
                                onChange={handleChange}
                                placeholder={variable.handle}
                                className={`dark:text-white ${variable.published && inDock ? 'shadow-[0_0_0_2px_rgb(59_130_246)] dark:shadow-[0_0_0_2px_rgb(96_165_250)]' : ''}`}
                            />
                        </FieldGroup>
                    </Field>
                </Fieldset>
            )}
        </>
    );
};

export default VariableTypeAny;
