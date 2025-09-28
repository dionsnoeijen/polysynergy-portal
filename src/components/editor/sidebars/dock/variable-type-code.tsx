import React from "react";
import {FormType, NodeVariable} from "@/types/types";
import {Field, Fieldset, Label} from "@/components/fieldset";
import {PencilIcon} from "@heroicons/react/24/outline";
import useEditorStore from "@/stores/editorStore";
import useConnectionsStore from "@/stores/connectionsStore";
import ValueConnected from "@/components/editor/sidebars/dock/value-connected";

type Props = {
    nodeId: string;
    variable: NodeVariable;
    inDock?: boolean;
    categoryBorder?: string;
    categoryMainTextColor?: string;
    categorySubTextColor?: string;
    categoryBackgroundColor?: string;
    categoryGradientBackgroundColor?: string;
};

const VariableTypeCode: React.FC<Props> = ({
    nodeId,
    variable,
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
    categoryGradientBackgroundColor = 'bg-gradient-to-r from-sky-100 to-sky-200 dark:from-zinc-800 dark:to-zinc-900',
}) => {
    const { openForm } = useEditorStore();

    const onEdit = (nodeId: string) => {
        openForm(FormType.EditCode, nodeId, variable);
    };

    const isValueConnected = useConnectionsStore((state) => state.isValueConnected(nodeId, variable.handle));

    return (
        <div className={'relative'}>
            {variable?.dock?.enabled === false || (variable.published && inDock) && (
                <div className="absolute inset-0 bg-sky-50/60 dark:bg-black/40 rounded-md z-10 pointer-events-none"/>
            )}
            {isValueConnected ? (
                <ValueConnected variable={variable} />
            ) : (
                <Fieldset>
                    <Label>{variable.handle}</Label>
                    <Field>
                        <button
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

export default VariableTypeCode;
