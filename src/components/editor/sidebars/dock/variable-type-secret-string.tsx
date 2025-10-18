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
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (onChange) {
            onChange(newValue);
        } else {
            updateNodeVariable(nodeId, variable.handle, newValue);
        }
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible((prev) => !prev);
    };

    const displayValue = currentValue !== undefined ? currentValue : (variable.value as string) || "";

    const isValueConnected = useConnectionsStore((state) => state.isValueConnectedExcludingGroupBoundary(nodeId, variable.handle));

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
                                    disabled={variable?.dock?.enabled === false || (variable.published && inDock)}
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
                                disabled={variable?.dock?.enabled === false || (variable.published && inDock)}
                                value={displayValue}
                                onChange={handleChange}
                                placeholder={'******'}
                                aria-label={variable.handle}
                            />
                        </FieldGroup>
                    </Field>
                </Fieldset>
            )}
        </>
    );
};

export default VariableTypeSecretString;