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
    // PERFORMANCE: Convert store subscriptions to getState() pattern
    // These components are rendered for every variable in the dock sidebar
    const handleChange = React.useCallback((value: string) => {
        useNodesStore.getState().updateNodeVariable(nodeId, variable.handle, value);
    }, [nodeId, variable.handle]);

    const isValueConnected = React.useMemo(() =>
        useConnectionsStore.getState().isValueConnectedExcludingGroupBoundary(nodeId, variable.handle),
        [nodeId, variable.handle]
    );

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
                        <div className={`${variable.published && inDock ? 'shadow-[0_0_0_2px_rgb(59_130_246)] dark:shadow-[0_0_0_2px_rgb(96_165_250)] rounded-md' : ''}`}>
                            <TemplateRichTextEditor
                                disabled={variable?.dock?.enabled === false}
                                onChange={(value: string) => handleChange(value)}
                                value={variable.value as string || ""}
                                categoryBorder={categoryBorder}
                                categoryMainTextColor={categoryMainTextColor}
                                categorySubTextColor={categorySubTextColor}
                                categoryBackgroundColor={categoryBackgroundColor}
                                categoryGradientBackgroundColor={categoryGradientBackgroundColor}
                            />
                        </div>
                    </Field>
                </Fieldset>
            )}
        </>
    );
};

// PERFORMANCE: Memoize to prevent unnecessary re-renders
export default React.memo(VariableTypeRichTextArea, (prevProps, nextProps) => {
    return (
        prevProps.variable === nextProps.variable &&
        prevProps.nodeId === nextProps.nodeId &&
        prevProps.publishedButton === nextProps.publishedButton &&
        prevProps.inDock === nextProps.inDock
    );
});
