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
    const { openForm } = useEditorStore();

    const onEdit = (nodeId: string) => {
        openForm(FormType.EditTemplate, nodeId, variable);
    };

    const isValueConnected = useConnectionsStore((state) => state.isValueConnected(nodeId, variable.handle));

    return (
        <div className={'relative'}>
            {variable?.dock?.enabled === false || (variable.published && inDock) && (
                <div className="absolute inset-0 bg-black/40 rounded-md z-10 pointer-events-none"/>
            )}
             {isValueConnected ? (
                 <ValueConnected variable={variable} />
             ) : (
                 <Fieldset>
                    {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable} />)}
                    <Field>
                        <button
                            disabled={variable?.dock?.enabled === false || (variable.published && inDock)}
                            className="text-slate-500 hover:text-slate-600 w-full pb-1 ring-1 ring-white/20 rounded-md"
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

export default VariableTypeTemplate;
