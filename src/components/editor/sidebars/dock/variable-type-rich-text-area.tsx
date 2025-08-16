import React from "react";
import useNodesStore from "@/stores/nodesStore";
import {VariableTypeProps} from "@/types/types";
import {Field, Fieldset} from "@/components/fieldset";
import TemplateRichTextEditor from "@/components/template-rich-text-editor";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import useConnectionsStore from "@/stores/connectionsStore";
import ValueConnected from "@/components/editor/sidebars/dock/value-connected";

const VariableTypeRichTextArea: React.FC<VariableTypeProps> = ({
    nodeId,
    variable,
    publishedButton = true,
    inDock = true,
    categoryBorder = 'border border-sky-200 dark:border-zinc-700',
    categoryMainTextColor = 'text-sky-500 dark:text-white/70',
    categorySubTextColor = 'text-sky-800 dark:text-white/70',
    categoryBackgroundColor = 'bg-white dark:bg-zinc-800 shadow-sm',
    categoryGradientBackgroundColor = 'bg-gradient-to-r from-sky-100 to-sky-200 dark:from-zinc-800 dark:to-zinc-900',
}) => {
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const handleChange = (value: string) => {
        updateNodeVariable(nodeId, variable.handle, value);
    };

    const isValueConnected = useConnectionsStore((state) => state.isValueConnected(nodeId, variable.handle));

    return (
        <>
            {isValueConnected ? (
                <ValueConnected variable={variable} />
            ) : (
                <Fieldset>
                    {publishedButton && (<LabelPublish
                        nodeId={nodeId}
                        variable={variable}
                        categoryMainTextColor={categoryMainTextColor}
                        categorySubTextColor={categorySubTextColor}
                        categoryBackgroundColor={categoryBackgroundColor}
                        categoryGradientBackgroundColor={categoryGradientBackgroundColor}
                    />)}
                    <Field>
                        <TemplateRichTextEditor
                            disabled={variable?.dock?.enabled === false || (variable.published && inDock)}
                            onChange={(value: string) => handleChange(value)}
                            value={variable.value as string || ""}
                            categoryBorder={categoryBorder}
                            categoryMainTextColor={categoryMainTextColor}
                            categorySubTextColor={categorySubTextColor}
                            categoryBackgroundColor={categoryBackgroundColor}
                            categoryGradientBackgroundColor={categoryGradientBackgroundColor}
                        />
                    </Field>
                </Fieldset>
            )}
        </>
    );
};

export default VariableTypeRichTextArea;
