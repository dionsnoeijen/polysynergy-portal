import React from "react";
import useNodesStore from "@/stores/nodesStore";
import {VariableTypeProps} from "@/types/types";
import {Field, Fieldset} from "@/components/fieldset";
import {Textarea} from "@/components/textarea";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import useConnectionsStore from "@/stores/connectionsStore";
import ValueConnected from "@/components/editor/sidebars/dock/value-connected";

const VariableTypeBytes: React.FC<VariableTypeProps> = ({
    nodeId,
    variable,
    publishedButton = true,
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
}) => {
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        updateNodeVariable(nodeId, variable.handle, newValue);
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
                    {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable}/>)}
                    <Field>
                        <Textarea
                            onChange={handleChange}
                            placeholder={variable.handle}
                            aria-label={variable.handle}
                            defaultValue={variable.value as string || ""}
                            className=""
                        />
                    </Field>
                </Fieldset>
            )}
        </div>
    );
};

export default VariableTypeBytes;
