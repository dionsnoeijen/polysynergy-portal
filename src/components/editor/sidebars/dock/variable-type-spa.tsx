import React from "react";
import {FormType, VariableTypeProps} from "@/types/types";
import {Field, Fieldset} from "@/components/fieldset";
import {CodeBracketSquareIcon} from "@heroicons/react/24/outline";
import useEditorStore from "@/stores/editorStore";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import useConnectionsStore from "@/stores/connectionsStore";
import ValueConnected from "@/components/editor/sidebars/dock/value-connected";

const VariableTypeSPA: React.FC<VariableTypeProps> = ({
    nodeId,
    variable,
    publishedButton = true,
    inDock = true,
}) => {
    const onEdit = React.useCallback((nodeId: string) => {
        useEditorStore.getState().openForm(FormType.EditSPA, nodeId, variable);
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
                 <ValueConnected
                     variable={variable}
                 />
             ) : (
                 <Fieldset>
                    {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable} />)}
                    <Field>
                        <button
                            className={`w-full pb-1 ring-1 rounded-md text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 ${variable.published && inDock ? 'shadow-[0_0_0_2px_rgb(59_130_246)] dark:shadow-[0_0_0_2px_rgb(96_165_250)]' : ''}`}
                            onClick={() => onEdit(nodeId)}
                        >
                            <CodeBracketSquareIcon className="w-4 h-4 inline text-purple-700/80 dark:text-purple-400/80"/>
                        </button>
                    </Field>
                </Fieldset>
             )}
        </div>
    );
};

export default React.memo(VariableTypeSPA, (prevProps, nextProps) => {
    return (
        prevProps.variable === nextProps.variable &&
        prevProps.nodeId === nextProps.nodeId &&
        prevProps.publishedButton === nextProps.publishedButton &&
        prevProps.inDock === nextProps.inDock
    );
});
