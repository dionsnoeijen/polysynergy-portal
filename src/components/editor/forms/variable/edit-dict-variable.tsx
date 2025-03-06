import React, { useState } from "react";
import { Subheading } from "@/components/heading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Switch } from "@/components/switch";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import { Button } from "@/components/button";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { NodeVariable, NodeVariableType } from "@/types/types";

type Props = {
    title: string;
    variables: NodeVariable[];
    onChange: (updatedVariables: NodeVariable[], handle?: string) => void; // Handle optioneel meegeven
    onlyValues?: boolean;
    handle?: string;
};

const EditDictVariable: React.FC<Props> = ({ title, variables, onChange, onlyValues = false, handle }) => {
    const [newVariable, setNewVariable] = useState<NodeVariable>({
        handle: "",
        type: NodeVariableType.String,
        value: "",
        has_in: false,
        has_out: false,
        published: false,
    });

    const updateVariable = (
        index: number,
        key: keyof NodeVariable,
        value: string | boolean | NodeVariableType
    ) => {
        const updatedVariables = [...variables];
        updatedVariables[index] = { ...updatedVariables[index], [key]: value };
        onChange(updatedVariables, handle);
    };

    const addVariable = () => {
        setNewVariable({
            handle: "",
            type: NodeVariableType.String,
            value: "",
            has_in: false,
            has_out: false,
            published: false,
        });
        onChange([...variables, newVariable], handle); // Stuur handle mee
    };

    const removeVariable = (index: number) => {
        onChange(variables.filter((_, i) => i !== index), handle); // Stuur handle mee
    };

    return (
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-1">
            {!onlyValues && (
                <div className="space-y-1">
                    <Subheading>{title}</Subheading>
                </div>
            )}
            <div>
                <Table dense bleed grid>
                    <TableHead>
                        <TableRow>
                            <TableHeader>In</TableHeader>
                            <TableHeader>Key</TableHeader>
                            <TableHeader>Type</TableHeader>
                            <TableHeader>Value</TableHeader>
                            <TableHeader>Out</TableHeader>
                            <TableHeader>Actions</TableHeader>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {variables.map((variable, index) => (
                            <TableRow key={`row-${index}`}>
                                <TableCell>
                                    <Switch
                                        checked={variable.has_in}
                                        onChange={(checked) => updateVariable(index, "has_in", checked)}
                                        disabled={onlyValues}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={variable.handle}
                                        onChange={(e) => updateVariable(index, "handle", e.target.value)}
                                        disabled={onlyValues}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Select
                                        value={variable.type}
                                        onChange={(e) =>
                                            updateVariable(index, "type", e.target.value as NodeVariableType)
                                        }
                                        disabled={onlyValues}
                                    >
                                        <option value={NodeVariableType.String}>String</option>
                                        <option value={NodeVariableType.Number}>Number</option>
                                        <option value={NodeVariableType.Boolean}>Boolean</option>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={String(variable.value)}
                                        onChange={(e) => updateVariable(index, "value", e.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Switch
                                        checked={variable.has_out}
                                        onChange={(checked) => updateVariable(index, "has_out", checked)}
                                        disabled={onlyValues}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button plain onClick={() => removeVariable(index)}>
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!onlyValues && (
                            <TableRow key="new-variable">
                                <TableCell colSpan={6} className="text-center">
                                    <Button plain onClick={addVariable}>
                                        <PlusIcon className="w-4 h-4" /> Add Row
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </section>
    );
};

export default EditDictVariable;