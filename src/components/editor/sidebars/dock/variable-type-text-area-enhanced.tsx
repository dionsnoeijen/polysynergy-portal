import React from "react";
import { VariableTypeProps } from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import { Field, Fieldset } from "@/components/fieldset";
import { TemplateTextarea } from "@/components/template-textarea";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import useConnectionsStore from "@/stores/connectionsStore";
import ValueConnected from "@/components/editor/sidebars/dock/value-connected";

const VariableTypeTextAreaEnhanced: React.FC<VariableTypeProps> = ({
    nodeId,
    variable,
    publishedButton = true,
    inDock = true,
    // categoryBorder = 'border border-sky-200 dark:border-zinc-700',
    // eslint-disable-next-line
    categoryMainTextColor = 'text-sky-500 dark:text-white/70',
    // eslint-disable-next-line
    categorySubTextColor = 'text-sky-800 dark:text-white/70',
    // categoryBackgroundColor = 'bg-white dark:bg-zinc-800 shadow-sm',
    // eslint-disable-next-line
    categoryGradientBackgroundColor = 'bg-gradient-to-r from-sky-100 to-sky-200 dark:from-zinc-800 dark:to-zinc-900',
}) => {
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const handleChange = (newValue: string) => {
        updateNodeVariable(nodeId, variable.handle, newValue);
    };

    const isValueConnected = useConnectionsStore((state) => state.isValueConnectedExcludingGroupBoundary(nodeId, variable.handle));

    return (
        <>
            {isValueConnected ?
                (
                    <ValueConnected variable={variable} />
                ) : (
                    <Fieldset>
                        {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable} />)}
                        <Field>
                            <TemplateTextarea
                                disabled={variable?.dock?.enabled === false || (variable.published && inDock)}
                                onChange={handleChange}
                                placeholder={variable.handle}
                                value={variable.value as string || ""}
                                className="dark:text-white"
                            />
                        </Field>
                    </Fieldset>
                )
            }
        </>
    );
};

export default VariableTypeTextAreaEnhanced;