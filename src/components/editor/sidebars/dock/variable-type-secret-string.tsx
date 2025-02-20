import React, { useState } from "react";
import { VariableTypeProps } from "@/types/types";
import { Input } from "@/components/input";
import { Field, FieldGroup, Fieldset } from "@/components/fieldset";
import { Button } from "@/components/button";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import useNodesStore from "@/stores/nodesStore";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";

type ExtendedVariableTypeProps = VariableTypeProps & {
    onChange?: (value: string) => void;
    currentValue?: string; // Optionele prop voor de huidige waarde
};

const VariableTypeSecretString: React.FC<ExtendedVariableTypeProps> = ({
    nodeId,
    variable,
    publishedButton = true,
    onChange,
    currentValue,
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

    // Gebruik currentValue als die is meegegeven, anders val terug op variable.value
    const displayValue = currentValue !== undefined ? currentValue : (variable.value as string) || "";

    return (
        <Fieldset>
            {publishedButton && <LabelPublish nodeId={nodeId} variable={variable} />}
            <Field>
                <FieldGroup
                    actions={
                        <Button
                            plain
                            onClick={togglePasswordVisibility}
                            className="!p-1"
                            title={isPasswordVisible ? "Hide password" : "Show password"}
                        >
                            {isPasswordVisible ? (
                                <EyeSlashIcon className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                            ) : (
                                <EyeIcon className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                            )}
                        </Button>
                    }
                >
                    <Input
                        type={isPasswordVisible ? "text" : "password"}
                        value={displayValue}
                        onChange={handleChange}
                        placeholder={variable.handle}
                        aria-label={variable.handle}
                    />
                </FieldGroup>
            </Field>
        </Fieldset>
    );
};

export default VariableTypeSecretString;