import React, { useState, useEffect, useRef } from "react";
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

    const [localValue, setLocalValue] = useState<string | number>("");
    const timeoutRef = useRef<NodeJS.Timeout>();

    const value =
        typeof variable.value === "number"
            ? variable.value
            : typeof variable.value === "string" && !isNaN(parseFloat(variable.value))
                ? parseFloat(variable.value)
                : "";

    // Sync local value when variable.value changes from external source
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const inputValue = e.target.value;
        const newValue = parseFloat(inputValue);

        // Update local state immediately for responsive UI
        setLocalValue(inputValue);

        if (!isNaN(newValue)) {
            // Clear existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Debounce the store update (same pattern as group-name.tsx)
            timeoutRef.current = setTimeout(() => {
                nodeHistoryActions.updateNodeVariableWithHistory(nodeId, variable.handle, newValue);
            }, 300);
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // PERFORMANCE: Convert store subscriptions to getState() pattern
    // These components are rendered for every variable in the dock sidebar
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
                    {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable}/>)}
                    <Field>
                        {variable.dock && variable.dock.select_values ? (
                            <Select
                                disabled={variable?.dock?.enabled === false}
                                onChange={handleChange}
                                defaultValue={value}
                                className={`dark:text-white ${variable.published && inDock ? 'shadow-[0_0_0_2px_rgb(59_130_246)] dark:shadow-[0_0_0_2px_rgb(96_165_250)]' : ''}`}
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
                                value={localValue}
                                disabled={variable?.dock?.enabled === false}
                                onChange={handleChange}
                                placeholder={variable.handle}
                                aria-label={variable.handle}
                                className={`dark:text-white ${variable.published && inDock ? 'shadow-[0_0_0_2px_rgb(59_130_246)] dark:shadow-[0_0_0_2px_rgb(96_165_250)]' : ''}`}
                            />
                        )}
                    </Field>
                </Fieldset>
            )}
        </>
    );
};

// PERFORMANCE: Memoize to prevent unnecessary re-renders
export default React.memo(VariableTypeNumber, (prevProps, nextProps) => {
    return (
        prevProps.variable === nextProps.variable &&
        prevProps.nodeId === nextProps.nodeId &&
        prevProps.publishedButton === nextProps.publishedButton &&
        prevProps.inDock === nextProps.inDock
    );
});
