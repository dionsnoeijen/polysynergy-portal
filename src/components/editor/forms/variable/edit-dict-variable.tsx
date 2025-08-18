
import React, { useMemo } from 'react';
import {Subheading} from "@/components/heading";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/table";
import {Switch} from "@/components/switch";
import {Input} from "@/components/input";
import {Select} from "@/components/select";
import {Button} from "@/components/button";
import {PlusIcon, TrashIcon, BoltIcon, ArrowRightCircleIcon} from "@heroicons/react/24/outline";
import {Node, Dock, FormType, NodeVariable, NodeVariableType} from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import useConnectionsStore from "@/stores/connectionsStore";

type Props = {
    title: string;
    variables: NodeVariable[];
    onChange: (updatedVariables: NodeVariable[], handle?: string) => void; // Handle optioneel meegeven
    onlyValues?: boolean;
    handle?: string;
    dock?: Dock;
    published?: boolean;
    node?: Node;
};

const EditDictVariable: React.FC<Props> = ({
                                               title,
                                               variables,
                                               onChange,
                                               onlyValues = false,
                                               handle,
                                               dock,
                                               published = false,
                                               node,
                                           }) => {

    const formType = useEditorStore((state) => state.formType);
    const isValueConnected = useConnectionsStore((state) => state.isValueConnected);

    const editableKeys = useMemo(() => {
        if (formType !== FormType.PublishedVariableForm) return new Set<string>();
        if (published) return new Set(variables.map((v) => v.handle));
        return new Set(variables.filter((v) => v.published).map((v) => v.handle));
    }, [variables, published, formType]);

    const updateVariable = (
        index: number,
        key: keyof NodeVariable,
        value: string | boolean | NodeVariableType
    ) => {
        const updatedVariables = [...variables];
        if (key === "handle") {
            // @todo: Make optional
            //    const validValue = (value as string).replace(/[^a-z-_]/g, '');
            updatedVariables[index] = {...updatedVariables[index], [key]: value as string};
        } else {
            updatedVariables[index] = {...updatedVariables[index], [key]: value};
        }
        onChange(updatedVariables, handle);
    };

    const addVariable = () => {
        const newVariable = {
            handle: "",
            type: NodeVariableType.String,
            value: "",
            has_in: dock?.in_switch_default ?? false,
            has_out: dock?.out_switch_default ?? false,
            published: published,
        };
        onChange([...variables, newVariable], handle);
    };

    const removeVariable = (index: number) => {
        onChange(variables.filter((_, i) => i !== index), handle); // Stuur handle mee
    };

    const togglePublish = (index: number) => {
        const updatedVariables = [...variables];
        updatedVariables[index] = {...updatedVariables[index], published: !updatedVariables[index].published};
        onChange(updatedVariables, handle);
    };

    return (
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-1">
            {!onlyValues && (
                <div className="space-y-1">
                    <Subheading>{title}</Subheading>
                </div>
            )}
            <div>
                <Table dense bleed>
                    <TableHead>
                        <TableRow>
                            {!(dock && dock.in_switch === false) && <TableHeader>In</TableHeader>}
                            {!(dock && dock.key_field === false) &&
                                <TableHeader>{dock?.key_label || "Key"}</TableHeader>}
                            {!(dock && dock.type_field === false) &&
                                <TableHeader>{dock?.type_label || "Type"}</TableHeader>}
                            {!(dock && dock.value_field === false) &&
                                <TableHeader>{dock?.value_label || "Value"}</TableHeader>}
                            {!(dock && dock.out_switch === false) && <TableHeader>Out</TableHeader>}
                            <TableHeader>Actions</TableHeader>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {variables.map((variable, index) => {
                            const isConnected = isValueConnected(node?.id || '', `${handle}.${variable.handle}`);

                            const rowDisabled = onlyValues || (!onlyValues && variable.published);
                            const valueDisabled = onlyValues
                                ? !variable.published || isConnected
                                : rowDisabled || isConnected;

                            return (
                                <TableRow key={`row-${index}`}>
                                    {!(dock && dock.in_switch === false) && <TableCell>
                                        <Switch
                                            checked={variable.has_in}
                                            onChange={(checked) => updateVariable(index, "has_in", checked)}
                                            disabled={rowDisabled || dock?.in_switch_enabled === false}
                                        />
                                    </TableCell>}
                                    {!(dock && dock.key_field === false) && <TableCell>
                                        <Input
                                            value={variable.handle}
                                            onChange={(e) => updateVariable(index, "handle", e.target.value)}
                                            disabled={rowDisabled}
                                        />
                                    </TableCell>}
                                    {!(dock && dock.type_field === false) && <TableCell>
                                        <Select
                                            value={variable.type}
                                            onChange={(e) =>
                                                updateVariable(index, "type", e.target.value as NodeVariableType)
                                            }
                                            disabled={rowDisabled || (formType === FormType.PublishedVariableForm && !editableKeys.has(variable.handle))}
                                        >
                                            <option value={NodeVariableType.String}>String</option>
                                            <option value={NodeVariableType.Int}>Int</option>
                                            <option value={NodeVariableType.Float}>Float</option>
                                            <option value={NodeVariableType.Boolean}>Boolean</option>
                                            <option value={NodeVariableType.List}>List</option>
                                            <option value={NodeVariableType.Dict}>Dict</option>
                                        </Select>
                                    </TableCell>}
                                    {!(dock && dock.value_field === false) && <TableCell>
                                        {isConnected ? (
                                            <div
                                                className="border border-orange-800 dark:border-yellow-300 rounded-md px-3 py-2 text-sm text-orange-800 dark:text-yellow-300 flex items-center gap-2 bg-black/10"
                                                title="Connected to another node"
                                            >
                                                <BoltIcon className="w-4 h-4"/>
                                                connected
                                            </div>
                                        ) : (
                                            <Input
                                                value={String(variable.value)}
                                                onChange={(e) => updateVariable(index, "value", e.target.value)}
                                                disabled={valueDisabled}
                                            />
                                        )}
                                    </TableCell>}
                                    {!(dock && dock.out_switch === false) && <TableCell>
                                        <Switch
                                            checked={variable.has_out}
                                            onChange={(checked) => updateVariable(index, "has_out", checked)}
                                            disabled={rowDisabled || dock?.out_switch_enabled === false}
                                        />
                                    </TableCell>}
                                    <TableCell>
                                        {formType !== FormType.PublishedVariableForm && (
                                            <div className="flex gap-1">
                                                <Button 
                                                    plain 
                                                    onClick={() => togglePublish(index)}
                                                    disabled={rowDisabled}
                                                    title={variable.published ? "Unpublish variable" : "Publish variable"}
                                                    className={variable.published ? 'text-sky-600 hover:text-sky-700' : ''}
                                                >
                                                    <ArrowRightCircleIcon className="w-4 h-4"/>
                                                </Button>
                                                <Button plain onClick={() => removeVariable(index)}
                                                        disabled={rowDisabled}>
                                                    <TrashIcon className="w-4 h-4"/>
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {!onlyValues && (
                            <TableRow key="new-variable">
                                <TableCell colSpan={6} className="text-center">
                                    <Button plain onClick={addVariable}>
                                        <PlusIcon className="w-4 h-4"/> Add Row
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