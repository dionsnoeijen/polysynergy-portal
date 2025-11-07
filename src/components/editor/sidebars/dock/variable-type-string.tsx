import React from "react";
import { VariableTypeProps } from "@/types/types";
import { TemplateInput } from "@/components/template-input";
import { Field, FieldGroup, Fieldset } from "@/components/fieldset";
import { Select } from "@/components/select";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import useConnectionsStore from "@/stores/connectionsStore";
import { nodeHistoryActions } from "@/stores/history";
import ValueConnected from "./value-connected";
import useSectionsStore from "@/stores/sectionsStore";

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
    // Get the full handle (including parent if it's a sub-variable)
    const fullHandle = variable.parentHandle
        ? `${variable.parentHandle}.${variable.handle}`
        : variable.handle;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
        const newValue = e.target.value;
        if (onChange) {
            onChange(newValue);
        } else {
            // Use history-enabled variable update with full handle
            nodeHistoryActions.updateNodeVariableWithHistory(nodeId, fullHandle, newValue);
        }
    };

    const handleTemplateChange = (newValue: string) => {
        if (onChange) {
            onChange(newValue);
        } else {
            // Use history-enabled variable update with full handle
            nodeHistoryActions.updateNodeVariableWithHistory(nodeId, fullHandle, newValue);
        }
    };

    // PERFORMANCE: Convert store subscriptions to getState() pattern
    // These components are rendered for every variable in the dock sidebar
    const isValueConnected = React.useMemo(() =>
        useConnectionsStore.getState().isValueConnectedExcludingGroupBoundary(nodeId, variable.handle),
        [nodeId, variable.handle]
    );

    // Check if this field should show portal sections dropdown
    const isPortalSectionsField = variable.dock?.metadata &&
        typeof variable.dock.metadata === 'object' &&
        'source' in variable.dock.metadata &&
        variable.dock.metadata.source === 'portal_sections';

    // Get sections from store if needed
    const sections = useSectionsStore((state) => state.sections);

    return (
        <>
        {
            isValueConnected ? (
                <ValueConnected variable={variable} />
            ) : (
                <Fieldset className={'w-full'}>
                    {publishedButton && (<LabelPublish nodeId={nodeId} variable={variable} />)}
                    <Field>
                        <FieldGroup>
                        {isPortalSectionsField ? (
                            <Select
                                disabled={variable?.dock?.enabled === false}
                                onChange={handleChange}
                                value={variable.value as string || ""}
                                className={`dark:text-white ${variable.published && inDock ? 'shadow-[0_0_0_2px_rgb(59_130_246)] dark:shadow-[0_0_0_2px_rgb(96_165_250)]' : ''}`}
                            >
                                <option value="">{variable.dock?.placeholder || "Select a section..."}</option>
                                {sections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.label} ({section.handle})
                                    </option>
                                ))}
                            </Select>
                        ) : variable.dock && variable.dock.select_values ? (
                            <Select
                                disabled={variable?.dock?.enabled === false}
                                onChange={handleChange}
                                defaultValue={variable.value as string}
                                className={`dark:text-white ${variable.published && inDock ? 'shadow-[0_0_0_2px_rgb(59_130_246)] dark:shadow-[0_0_0_2px_rgb(96_165_250)]' : ''}`}
                            >
                                {Object.entries(variable.dock.select_values).map(([key, v]) => (
                                <option key={key} value={key}>{v}</option>
                                ))}
                            </Select>
                        ) : (
                            <TemplateInput
                                disabled={variable?.dock?.enabled === false}
                                type="text"
                                value={variable.value as string || ""}
                                onChange={handleTemplateChange}
                                placeholder={variable.handle}
                                className={`dark:text-white ${variable.published && inDock ? 'shadow-[0_0_0_2px_rgb(59_130_246)] dark:shadow-[0_0_0_2px_rgb(96_165_250)]' : ''}`}
                            />
                        )}
                        </FieldGroup>
                    </Field>
                </Fieldset>
            )}
        </>
    );
};

// PERFORMANCE: Memoize to prevent unnecessary re-renders
export default React.memo(VariableTypeString, (prevProps, nextProps) => {
    return (
        prevProps.variable === nextProps.variable &&
        prevProps.nodeId === nextProps.nodeId &&
        prevProps.publishedButton === nextProps.publishedButton &&
        prevProps.onChange === nextProps.onChange &&
        prevProps.inDock === nextProps.inDock
    );
});
