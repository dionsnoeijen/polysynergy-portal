import React from "react";
import {FormType, VariableTypeProps} from "@/types/types";
import {Field, Fieldset} from "@/components/fieldset";
import {PencilIcon} from "@heroicons/react/24/outline";
import useEditorStore from "@/stores/editorStore";
import useConnectionsStore from "@/stores/connectionsStore";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import ValueConnected from "@/components/editor/sidebars/dock/value-connected";

const VariableTypeTemplate: React.FC<VariableTypeProps> = ({
    nodeId,
    variable,
    publishedButton = true,
    inDock = true
}) => {
    // PERFORMANCE: Convert store subscriptions to getState() pattern
    // These components are rendered for every variable in the dock sidebar
    const onEdit = React.useCallback((nodeId: string) => {
        useEditorStore.getState().openForm(FormType.EditTemplate, nodeId, variable);
    }, [variable]);

    const isValueConnected = React.useMemo(() =>
        useConnectionsStore.getState().isValueConnectedExcludingGroupBoundary(nodeId, variable.handle),
        [nodeId, variable.handle]
    );

    return (
        <div className={'relative'}>
            {variable?.dock?.enabled === false && (
                <div className="absolute inset-0 bg-sky-50/60 dark:bg-black/40 rounded-md z-10 pointer-events-none"/>
            )}
             {isValueConnected ? (
                 <ValueConnected variable={variable} />
             ) : (
                 <Fieldset>
                    {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable} />)}
                    <Field>
                        <button
                            disabled={variable?.dock?.enabled === false}
                            className={`text-slate-500 hover:text-slate-600 w-full pb-1 ring-1 ring-white/20 rounded-md ${variable.published && inDock ? 'shadow-[0_0_0_2px_rgb(59_130_246)] dark:shadow-[0_0_0_2px_rgb(96_165_250)]' : ''}`}
                            onClick={() => onEdit(nodeId)}
                        >
                            <PencilIcon className="w-4 h-4 inline text-zinc-600 dark:text-slate-300"/>
                        </button>
                    </Field>
                </Fieldset>
             )}
        </div>
    );
};

// PERFORMANCE: Memoize to prevent unnecessary re-renders
export default React.memo(VariableTypeTemplate, (prevProps, nextProps) => {
    return (
        prevProps.variable === nextProps.variable &&
        prevProps.nodeId === nextProps.nodeId &&
        prevProps.publishedButton === nextProps.publishedButton &&
        prevProps.inDock === nextProps.inDock
    );
});
