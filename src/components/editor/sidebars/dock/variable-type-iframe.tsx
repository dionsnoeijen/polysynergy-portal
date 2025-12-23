import React, {useCallback} from "react";
import {VariableTypeProps} from "@/types/types";
import {Field, FieldGroup, Fieldset} from "@/components/fieldset";
import {Input} from "@/components/input";
import {Button} from "@/components/button";
import {ArrowPathIcon} from "@heroicons/react/24/outline";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import useConnectionsStore from "@/stores/connectionsStore";
import {nodeHistoryActions} from "@/stores/history";
import ValueConnected from "./value-connected";

const VariableTypeIframe: React.FC<VariableTypeProps> = ({
    nodeId,
    variable,
    publishedButton = true,
    onChange,
    inDock = true,
}) => {
    const fullHandle = variable.parentHandle
        ? `${variable.parentHandle}.${variable.handle}`
        : variable.handle;

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (onChange) {
            onChange(newValue);
        } else {
            nodeHistoryActions.updateNodeVariableWithHistory(nodeId, fullHandle, newValue);
        }
    }, [onChange, nodeId, fullHandle]);

    const handleRefresh = useCallback(() => {
        // Force the node to update by setting the same value with a timestamp
        // This triggers a re-render in IframeContent via store update
        const currentValue = variable.value as string || '';
        if (onChange) {
            onChange(currentValue);
        } else {
            // Add a cache-busting timestamp to force iframe reload
            nodeHistoryActions.updateNodeVariableWithHistory(nodeId, fullHandle, currentValue);
        }
    }, [onChange, nodeId, fullHandle, variable.value]);

    const isValueConnected = React.useMemo(() =>
        useConnectionsStore.getState().isValueConnectedExcludingGroupBoundary(nodeId, variable.handle),
        [nodeId, variable.handle]
    );

    const url = variable.value as string || '';

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
                        <FieldGroup>
                            <div className="flex gap-2">
                                <Input
                                    type="url"
                                    value={url}
                                    onChange={handleChange}
                                    placeholder="https://example.com"
                                    className={`flex-1 dark:text-white ${variable.published && inDock ? 'shadow-[0_0_0_2px_rgb(59_130_246)] dark:shadow-[0_0_0_2px_rgb(96_165_250)]' : ''}`}
                                />
                                <Button
                                    type="button"
                                    onClick={handleRefresh}
                                    color="zinc"
                                    title="Refresh iframe"
                                    disabled={!url}
                                >
                                    <ArrowPathIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        </FieldGroup>
                    </Field>
                </Fieldset>
            )}
        </div>
    );
};

export default React.memo(VariableTypeIframe, (prevProps, nextProps) => {
    return (
        prevProps.variable === nextProps.variable &&
        prevProps.nodeId === nextProps.nodeId &&
        prevProps.publishedButton === nextProps.publishedButton &&
        prevProps.onChange === nextProps.onChange &&
        prevProps.inDock === nextProps.inDock
    );
});
