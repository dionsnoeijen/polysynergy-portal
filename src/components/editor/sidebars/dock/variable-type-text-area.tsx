import React from "react";
import { VariableTypeProps } from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import { Field, Fieldset } from "@/components/fieldset";
import { Textarea } from "@/components/textarea";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import useConnectionsStore from "@/stores/connectionsStore";
import {Text} from "@/components/text";
import {BoltIcon} from "@heroicons/react/24/outline";

const VariableTypeTextArea: React.FC<VariableTypeProps> = ({ nodeId, variable, publishedButton = true }) => {
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        updateNodeVariable(nodeId, variable.handle, newValue);
    };

    const isValueConnected = useConnectionsStore((state) => state.isValueConnected(nodeId, variable.handle));

    return (
        <>
            {isValueConnected ?
                (
                    <div className={'border border-white/20 flex items-center justify-between rounded-md w-full relative mt-3 pl-3 pr-1 pb-1 pt-1 bg-white/5'}>
                        <Text className={'!text-yellow-300'}>{variable.name} <span className="text-zinc-500 dark:text-zinc-400 text-xs">{'{'}{variable.handle}{'}'}</span></Text>
                        <BoltIcon className={'w-5 h-5 text-yellow-300'} />
                    </div>
                ) : (
                    <Fieldset>
                        {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable} />)}
                        <Field>
                            <Textarea
                                onChange={handleChange}
                                placeholder={variable.handle}
                                aria-label={variable.handle}
                                defaultValue={variable.value as string || ""}
                            />
                        </Field>
                    </Fieldset>
                )
            }
        </>
    );
};

export default VariableTypeTextArea;
