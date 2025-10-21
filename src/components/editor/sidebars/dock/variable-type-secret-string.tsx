import React, {useState} from "react";
import useNodesStore from "@/stores/nodesStore";
import {Input} from "@/components/input";
import {Field, FieldGroup, Fieldset} from "@/components/fieldset";
import {Button} from "@/components/button";
import {EyeIcon, EyeSlashIcon} from "@heroicons/react/24/outline";
import {VariableTypeProps} from "@/types/types";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import useConnectionsStore from "@/stores/connectionsStore";
import ValueConnected from "@/components/editor/sidebars/dock/value-connected";

const VariableTypeSecretString: React.FC<VariableTypeProps> = ({
    nodeId,
    variable,
    publishedButton = true,
    onChange,
    currentValue,
    inDock = true
}) => {
    // PERFORMANCE: Convert store subscriptions to getState() pattern
    // These components are rendered for every variable in the dock sidebar
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (onChange) {
            onChange(newValue);
        } else {
            useNodesStore.getState().updateNodeVariable(nodeId, variable.handle, newValue);
        }
    }, [onChange, nodeId, variable.handle]);

    const togglePasswordVisibility = React.useCallback(() => {
        setIsPasswordVisible((prev) => !prev);
    }, []);

    const displayValue = currentValue !== undefined ? currentValue : (variable.value as string) || "";

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
                    {publishedButton && <LabelPublish nodeId={nodeId} variable={variable}/>}
                    <Field>
                        <FieldGroup
                            actions={
                                <Button
                                    plain
                                    disabled={variable?.dock?.enabled === false}
                                    onClick={togglePasswordVisibility}
                                    className="!p-1"
                                    title={isPasswordVisible ? "Hide password" : "Show password"}
                                >
                                    {isPasswordVisible ? (
                                        <EyeSlashIcon className="w-4 h-4 text-gray-500 hover:text-gray-700"/>
                                    ) : (
                                        <EyeIcon className="w-4 h-4 text-gray-500 hover:text-gray-700"/>
                                    )}
                                </Button>
                            }
                        >
                            <Input
                                type={isPasswordVisible ? "text" : "password"}
                                disabled={variable?.dock?.enabled === false}
                                value={displayValue}
                                onChange={handleChange}
                                placeholder={'******'}
                                aria-label={variable.handle}
                                className={`${variable.published && inDock ? 'shadow-[0_0_0_2px_rgb(59_130_246)] dark:shadow-[0_0_0_2px_rgb(96_165_250)]' : ''}`}
                            />
                        </FieldGroup>
                    </Field>
                </Fieldset>
            )}
        </>
    );
};

// PERFORMANCE: Memoize to prevent unnecessary re-renders
export default React.memo(VariableTypeSecretString, (prevProps, nextProps) => {
    return (
        prevProps.variable === nextProps.variable &&
        prevProps.nodeId === nextProps.nodeId &&
        prevProps.publishedButton === nextProps.publishedButton &&
        prevProps.onChange === nextProps.onChange &&
        prevProps.currentValue === nextProps.currentValue &&
        prevProps.inDock === nextProps.inDock
    );
});