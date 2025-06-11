import React from "react";
import { VariableTypeProps } from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import { Input } from "@/components/input";
import { Field, FieldGroup, Fieldset } from "@/components/fieldset";
import { Text } from "@/components/text";
import { Select } from "@/components/select";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import useConnectionsStore from "@/stores/connectionsStore";
import {BoltIcon} from "@heroicons/react/24/outline";

const VariableTypeString: React.FC<VariableTypeProps> = ({
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
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
        const newValue = e.target.value;
        if (onChange) {
            onChange(newValue);
        } else {
            updateNodeVariable(nodeId, variable.handle, newValue);
        }
    };

    const isValueConnected = useConnectionsStore((state) => state.isValueConnected(nodeId, variable.handle));

    return (
        <>
        {
            isValueConnected ? (
                <div className={'border border-orange-800 dark:border-white/20 flex items-center justify-between rounded-md w-full relative mt-3 pl-3 pr-1 pb-1 pt-1 bg-white/5'}>
                    <Text className={'!text-orange-800 !dark:text-yellow-300'}>{variable.name} <span className="text-zinc-500 dark:text-zinc-400 text-xs">{'{'}{variable.handle}{'}'}</span></Text>
                    <BoltIcon className={'w-5 h-5 text-orange-800 dark:text-yellow-300'} />
                </div>
            ) : (
                <Fieldset className={'w-full'}>
                    {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable} />)}
                    <Field>
                        <FieldGroup>
                        {variable.dock && variable.dock.select_values ? (
                            <Select
                                disabled={variable?.dock?.enabled === false || (variable.published && inDock)}
                                onChange={handleChange}
                                defaultValue={variable.value as string}
                                className={`${categoryBackgroundColor} rounded-md dark:text-white ${categoryBorder}`}
                            >
                                {Object.entries(variable.dock.select_values).map(([key, v]) => (
                                <option key={key} value={key}>{v}</option>
                                ))}
                            </Select>
                        ) : (
                            <Input
                                disabled={variable?.dock?.enabled === false || (variable.published && inDock)}
                                type="text"
                                value={variable.value as string || ""}
                                onChange={handleChange}
                                placeholder={variable.handle}
                                aria-label={variable.handle}
                                className={`${categoryBackgroundColor} rounded-md dark:text-white ${categoryBorder}`}
                            />
                        )}
                        </FieldGroup>
                    </Field>
                </Fieldset>
            )}
        </>
    );
};

export default VariableTypeString;
