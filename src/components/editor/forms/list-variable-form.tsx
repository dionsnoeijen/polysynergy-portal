import React, {useEffect, useState} from "react";
import useEditorStore from "@/stores/editorStore";
import {Divider} from "@/components/divider";
import {Button} from "@/components/button";
import {FormType, Node, NodeVariable, NodeVariableType} from "@/types/types";
import {Heading, Subheading} from "@/components/heading";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/table";
import {Select} from "@/components/select";
import {Input} from "@/components/input";
import {Switch} from "@/components/switch";
import {CheckCircleIcon, PencilIcon, PlusIcon, TrashIcon, XMarkIcon} from "@heroicons/react/16/solid";
import useNodesStore from "@/stores/nodesStore";

const ListVariableForm: React.FC = () => {

    const {getNode, updateNodeVariable} = useNodesStore();
    const {closeForm, formEditVariable, formEditRecordId, formType} = useEditorStore();

    const [ node, setNode ] = useState<Node>();
    const [ newVariable, setNewVariable ] = useState<NodeVariable>({
        type: NodeVariableType.String,
        value: "",
        has_in: false,
        has_out: false,
    });
    const [ variables, setVariables ] = useState<NodeVariable[]>([]);
    const [ errors, setErrors ] = useState<{ [key: string]: string }>({});
    const [ editingIndex, setEditingIndex ] = useState<number | null>(null);
    const [ editingVariable, setEditingVariable ] = useState<NodeVariable | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formEditRecordId || !formEditVariable) return;
        updateNodeVariable(formEditRecordId, formEditVariable?.handle, variables);
        closeForm();
    };

    const addVariable = () => {
        if (!isValidVariable(newVariable)) return;
        setVariables([...variables, newVariable]);
        setNewVariable({
            type: NodeVariableType.String,
            value: "",
            has_in: false,
            has_out: false,
        });
    }

    const editVariable = (index: number) => {
        setEditingIndex(index);
        setEditingVariable(variables[index]);
    };

    const saveEditedVariable = () => {
        if (editingIndex === null || !editingVariable) return;

        const updatedVariables = [...variables];
        updatedVariables[editingIndex] = editingVariable;

        setVariables(updatedVariables);
        setEditingIndex(null);
        setEditingVariable(null);
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditingVariable(null);
    };

    const removeVariable = (index: number) => {
        setVariables((prevVariables) => prevVariables.filter((_, i) => i !== index));
    };

    const isValidVariable = (variable: NodeVariable): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!variable.handle.trim()) {
            newErrors.handle = "Handle is required.";
        }

        if (variable.type === NodeVariableType.String && typeof variable.value !== "string") {
            newErrors.value = "Value must be a string for type String.";
        }
        if (variable.type === NodeVariableType.Number && typeof variable.value !== "number") {
            newErrors.value = "Value must be a number for type Number.";
        }
        if (variable.type === NodeVariableType.Boolean && typeof variable.value !== "boolean") {
            newErrors.value = "Value must be a boolean for type Boolean.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        if (!formEditVariable?.value) return;
        setVariables(formEditVariable?.value as NodeVariable[]);
    // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (!formEditRecordId) return;
        setNode(getNode(formEditRecordId));
    }, [getNode, formEditRecordId, formType, formEditVariable]);

    return (
        <form onSubmit={handleSubmit} method={"post"} className={"p-10"}>
            <Heading>{node && node.name}: {formEditVariable?.handle}</Heading>

            <Divider className="my-10" soft bleed/>

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-1">
                <div className="space-y-1">
                    <Subheading>Array values</Subheading>
                </div>
                <div>
                    <Table className="mt-4 [--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]" dense bleed
                           grid>
                        <TableHead>
                            <TableRow>
                                <TableHeader>In</TableHeader>
                                <TableHeader>Type</TableHeader>
                                <TableHeader>Value</TableHeader>
                                <TableHeader>Out</TableHeader>
                                <TableHeader>Actions</TableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {variables === null && (
                                <TableRow>
                                    <TableCell colSpan={6}>... empty array</TableCell>
                                </TableRow>
                            )}
                            {variables &&
                                variables.map((variable, index) =>
                                    editingIndex === index ? (
                                        <TableRow key={`edit-${index}`}>
                                            <TableCell>
                                                <Switch
                                                    name="has_in"
                                                    checked={editingVariable?.has_in || false}
                                                    onChange={(checked) =>
                                                        setEditingVariable((prev) =>
                                                            prev ? {...prev, has_in: checked} : null
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    name="type"
                                                    value={editingVariable?.type || NodeVariableType.String}
                                                    onChange={(event) => {
                                                        const value = event.target.value as NodeVariableType;
                                                        setEditingVariable((prev) =>
                                                            prev ? {...prev, type: value} : null
                                                        );
                                                    }}
                                                >
                                                    <option
                                                        value={NodeVariableType.String}>{NodeVariableType.String}</option>
                                                    <option
                                                        value={NodeVariableType.Number}>{NodeVariableType.Number}</option>
                                                    <option
                                                        value={NodeVariableType.Boolean}>{NodeVariableType.Boolean}</option>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                {editingVariable?.type === NodeVariableType.String && (
                                                    <Input
                                                        name="value"
                                                        value={editingVariable.value as string}
                                                        onChange={(event) =>
                                                            setEditingVariable((prev) =>
                                                                prev
                                                                    ? {...prev, value: event.target.value}
                                                                    : null
                                                            )
                                                        }
                                                    />
                                                )}
                                                {editingVariable?.type === NodeVariableType.Boolean && (
                                                    <Switch
                                                        name="value"
                                                        checked={editingVariable.value as boolean}
                                                        onChange={(checked) =>
                                                            setEditingVariable((prev) =>
                                                                prev ? {...prev, value: checked} : null
                                                            )
                                                        }
                                                    />
                                                )}
                                                {editingVariable?.type === NodeVariableType.Number && (
                                                    <Input
                                                        name="value"
                                                        type="number"
                                                        value={editingVariable.value as number}
                                                        onChange={(event) =>
                                                            setEditingVariable((prev) =>
                                                                prev
                                                                    ? {
                                                                        ...prev,
                                                                        value: parseFloat(event.target.value) || 0
                                                                    }
                                                                    : null
                                                            )
                                                        }
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Switch
                                                    name="has_out"
                                                    checked={editingVariable?.has_out || false}
                                                    onChange={(checked) =>
                                                        setEditingVariable((prev) =>
                                                            prev ? {...prev, has_out: checked} : null
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button type="button" plain onClick={saveEditedVariable}>
                                                    Save
                                                </Button>
                                                <Button type="button" plain onClick={cancelEdit}>
                                                    Cancel
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <TableRow key={`view-${index}`}>
                                            <TableCell>{variable.has_in ? <CheckCircleIcon className="w-4 h-4"/> :
                                                <XMarkIcon className="w-4 h-4"/>}</TableCell>
                                            <TableCell>{variable.handle}</TableCell>
                                            <TableCell>{variable.type}</TableCell>
                                            <TableCell>{variable.value as string}</TableCell>
                                            <TableCell>{variable.has_out ? <CheckCircleIcon className="w-4 h-4"/> :
                                                <XMarkIcon className="w-4 h-4"/>}</TableCell>
                                            <TableCell>
                                                <Button type="button" plain onClick={() => editVariable(index)}>
                                                    <PencilIcon className="w-4 h-4"/>
                                                </Button>
                                                <Button type="button" plain onClick={() => removeVariable(index)}>
                                                    <TrashIcon className="w-4 h-4"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                )}
                            <TableRow key={`key - new`}>
                                <TableCell>
                                    <Switch
                                        name={'has_in'}
                                        disabled={editingIndex !== null}
                                        checked={newVariable.has_in}
                                        onChange={(checked) => {
                                            setNewVariable((prev) => ({
                                                ...prev,
                                                has_in: checked,
                                            }));
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        name={'handle'}
                                        invalid={!!errors.handle}
                                        disabled={editingIndex !== null}
                                        value={newVariable?.handle || ""}
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                            const value = event.target.value;
                                            setNewVariable((prev) => ({
                                                ...prev,
                                                handle: value,
                                            }));
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Select
                                        name={'type'}
                                        disabled={editingIndex !== null}
                                        defaultValue={NodeVariableType.String}
                                        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                                            const value = event.target.value as NodeVariableType;
                                            setNewVariable((prev) => ({
                                                ...prev,
                                                type: value,
                                            }));
                                        }}
                                    >
                                        <option value={NodeVariableType.String}>{NodeVariableType.String}</option>
                                        <option value={NodeVariableType.Number}>{NodeVariableType.Number}</option>
                                        <option value={NodeVariableType.Boolean}>{NodeVariableType.Boolean}</option>
                                    </Select>
                                    {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
                                </TableCell>
                                <TableCell>
                                    {newVariable.type === NodeVariableType.String && (
                                        <Input
                                            name={'value'}
                                            disabled={editingIndex !== null}
                                            value={newVariable.value as string}
                                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                                const value = event.target.value;
                                                setNewVariable((prev) => ({
                                                    ...prev,
                                                    value: value,
                                                }));
                                            }}
                                        />
                                    )}
                                    {newVariable.type === NodeVariableType.Boolean && (
                                        <Switch
                                            name={'value'}
                                            disabled={editingIndex !== null}
                                            checked={newVariable.value as boolean}
                                            onChange={(checked) => {
                                                setNewVariable((prev) => ({
                                                    ...prev,
                                                    value: checked,
                                                }));
                                            }}
                                        />
                                    )}
                                    {newVariable.type === NodeVariableType.Number && (
                                        <Input
                                            name={'value'}
                                            type={'number'}
                                            disabled={editingIndex !== null}
                                            invalid={!!errors.value}
                                            value={newVariable.value as number}
                                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                                const value = event.target.value;
                                                setNewVariable((prev) => ({
                                                    ...prev,
                                                    value: parseFloat(value) || 0,
                                                }));
                                            }}
                                        />
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Switch
                                        name={'has_out'}
                                        disabled={editingIndex !== null}
                                        checked={newVariable.has_out}
                                        onChange={(checked) => {
                                            setNewVariable((prev) => ({
                                                ...prev,
                                                has_out: checked,
                                            }));
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button type="button" plain onClick={addVariable}><PlusIcon className={'w-4 h-4'}/></Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>

                    {/*<div className="flex justify-end">*/}
                    {/*    <Button type="button" plain onClick={addRow}>Add Row</Button>*/}
                    {/*</div>*/}
                </div>
            </section>

            <Divider className="my-10" soft bleed/>

            <div className="flex justify-end gap-4">
                <Button type="button" onClick={() => closeForm()} plain>
                    Cancel
                </Button>
                <Button type="submit">
                    {formType === FormType.EditList && "Save list"}
                </Button>
            </div>
        </form>
    );
}

export default ListVariableForm;