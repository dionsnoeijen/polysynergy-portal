import React from "react";
import {VariableTypeProps} from "@/types/types";
import {Field, Fieldset} from "@/components/fieldset";
import {Input} from "@/components/input";
import {Select} from "@/components/select";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import useConnectionsStore from "@/stores/connectionsStore";
import ValueConnected from "@/components/editor/sidebars/dock/value-connected";
import { nodeHistoryActions } from "@/stores/history";

const VariableTypeNumber: React.FC<VariableTypeProps> = ({
    nodeId,
    variable,
    publishedButton = true,
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
}): React.ReactElement => {

    const value =
        typeof variable.value === "number"
            ? variable.value
            : typeof variable.value === "string" && !isNaN(parseFloat(variable.value))
                ? parseFloat(variable.value)
                : "";

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        if (!isNaN(newValue)) {
            // Use history-enabled variable update
            nodeHistoryActions.updateNodeVariableWithHistory(nodeId, variable.handle, newValue);
        }
    };

    const isValueConnected = useConnectionsStore((state) => state.isValueConnected(nodeId, variable.handle));

    return (
        <>
            {isValueConnected ? (
                <ValueConnected variable={variable} />
            ) : (
                <Fieldset>
                    {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable}/>)}
                    <Field>
                        {variable.dock && variable.dock.select_values ? (
                            <Select
                                disabled={variable?.dock?.enabled === false || (variable.published && inDock)}
                                onChange={handleChange}
                                defaultValue={value}
                                className="dark:text-white"
                            >
                                {Object.entries(variable.dock.select_values).map(([key, v]) => (
                                    <option key={key} value={key}>
                                        {v}
                                    </option>
                                ))}
                            </Select>
                        ) : (
                            <Input
                                type="number"
                                value={value}
                                disabled={variable?.dock?.enabled === false || (variable.published && inDock)}
                                onChange={handleChange}
                                placeholder={variable.handle}
                                aria-label={variable.handle}
                                className="dark:text-white"
                            />
                        )}
                    </Field>
                </Fieldset>
            )}
        </>
    );
};

export default VariableTypeNumber;
