import React, {useState} from "react";
import {Button} from "@/components/button";
import {Heading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Select} from "@/components/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/table";
import {PlusIcon} from "@heroicons/react/24/outline";
import {NodeVariable, NodeVariableType} from "@/types/types";

import VariableTypeString from "@/components/editor/sidebars/dock/variable-type-string";
import VariableTypeNumber from "@/components/editor/sidebars/dock/variable-type-number";
import VariableTypeDict from "@/components/editor/sidebars/dock/variable-type-dict";
import VariableTypeBoolean from "@/components/editor/sidebars/dock/variable-type-boolean";
import VariableTypeList from "@/components/editor/sidebars/dock/variable-type-list";
import VariableTypeBytes from "@/components/editor/sidebars/dock/variable-type-bytes";
import VariableTypeRichTextArea from "@/components/editor/sidebars/dock/variable-type-rich-text-area";
import VariableTypeSecretString from "@/components/editor/sidebars/dock/variable-type-secret-string";
import VariableTypeTextArea from "@/components/editor/sidebars/dock/variable-type-text-area";
import VariableTypeCode from "@/components/editor/sidebars/dock/variable-type-code";
import VariableTypeJson from "@/components/editor/sidebars/dock/variable-type-json";
import useEditorStore from "@/stores/editorStore";

const getDefaultValueForType = (type: NodeVariableType): any => {
    switch (type) {
        case NodeVariableType.String:
            return "";
        case NodeVariableType.Number:
            return 0;
        case NodeVariableType.Boolean:
            return false;
        case NodeVariableType.Dict:
            return [];
        case NodeVariableType.List:
            return [];
        case NodeVariableType.Json:
            return "{}";
        case NodeVariableType.Bytes:
            return "";
        case NodeVariableType.DateTime:
            return new Date().toISOString();
        case NodeVariableType.TextArea:
            return "";
        case NodeVariableType.RichTextArea:
            return "";
        case NodeVariableType.SecretString:
            return "";
        default:
            return "";
    }
};

// Render het juiste input-component op basis van het type met de dock componenten.
const getVariableInputComponent = (
    type: NodeVariableType,
    value: string,
    onChange: (value: string | number | boolean | string[] | NodeVariable[] | null) => void,
    variableHandle: string
) => {
    const commonProps = {
        nodeId: '',
        variable: {
            handle: variableHandle,
            value,
            published: false,
            type
        },
        onChange,
        publishedButton: false
    };
    switch (type) {
        case NodeVariableType.Dict:
            return <VariableTypeDict {...commonProps} />;
        case NodeVariableType.List:
            return <VariableTypeList {...commonProps} />;
        case NodeVariableType.String:
            return <VariableTypeString {...commonProps} />;
        case NodeVariableType.Json:
            return <VariableTypeJson {...commonProps} />;
        case NodeVariableType.Bytes:
            return <VariableTypeBytes {...commonProps} />;
        case NodeVariableType.Number:
            return <VariableTypeNumber {...commonProps} />;
        case NodeVariableType.DateTime:
            // Gebruik hier de String variant, tenzij je een apart component hebt.
            return <VariableTypeString {...commonProps} />;
        case NodeVariableType.SecretString:
            return <VariableTypeSecretString {...commonProps} />;
        case NodeVariableType.TextArea:
            return <VariableTypeTextArea {...commonProps} />;
        case NodeVariableType.RichTextArea:
            return <VariableTypeRichTextArea {...commonProps} />;
        case NodeVariableType.Boolean:
            return <VariableTypeBoolean {...commonProps} />;
        case NodeVariableType.Code:
            return <VariableTypeCode {...commonProps} />;
        default:
            return null;
    }
};

type ProjectVariable = {
    id: string;
    handle: string;
    type: NodeVariableType;
    value: any;
};

const ProjectVariablesForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);

    // State voor de lijst met variabelen en de geselecteerde type voor nieuwe variabele
    const [projectVariables, setProjectVariables] = useState<ProjectVariable[]>([]);
    const [newVariableType, setNewVariableType] = useState<NodeVariableType>(NodeVariableType.String);
    const [newVariableHandle, setNewVariableHandle] = useState("");

    // Voeg een nieuwe variabele toe aan de state.
    const handleAddVariable = () => {
        if (!newVariableHandle.trim()) return;
        const newVar: ProjectVariable = {
            id: Date.now().toString(),
            handle: newVariableHandle,
            type: newVariableType,
            value: getDefaultValueForType(newVariableType),
        };
        setProjectVariables([...projectVariables, newVar]);
        setNewVariableHandle("");
    };

    const updateVariableValue = (id: string, newValue: any) => {
        setProjectVariables((prev) =>
            prev.map((variable) =>
                variable.id === id ? {...variable, value: newValue} : variable
            )
        );
    };

    return (
        <div className="p-10">
            <Heading>Project Variables Form</Heading>
            <Divider className="my-10" soft bleed/>

            <Table className="mt-4" dense bleed grid>
                <TableHead>
                    <TableRow>
                        <TableHeader>Handle</TableHeader>
                        <TableHeader>Type</TableHeader>
                        <TableHeader>Value</TableHeader>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {projectVariables.map((variable) => (
                        <TableRow key={variable.id}>
                            <TableCell>{variable.handle}</TableCell>
                            <TableCell>{variable.type}</TableCell>
                            <TableCell>
                                {getVariableInputComponent(
                                    variable.type,
                                    variable.value,
                                    (newVal) => updateVariableValue(variable.id, newVal),
                                    variable.handle
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <div className="flex justify-end items-center mt-4 gap-2">
                <Select
                    className="!w-auto max-w-fit"
                    value={newVariableType}
                    onChange={(e) =>
                        setNewVariableType(e.currentTarget.value as NodeVariableType)
                    }
                >
                    <option value={NodeVariableType.String}>String</option>
                    <option value={NodeVariableType.Number}>Number</option>
                    <option value={NodeVariableType.Boolean}>Boolean</option>
                    <option value={NodeVariableType.Dict}>Dict</option>
                    <option value={NodeVariableType.List}>List</option>
                    <option value={NodeVariableType.Json}>Json</option>
                    <option value={NodeVariableType.Bytes}>Bytes</option>
                    <option value={NodeVariableType.DateTime}>DateTime</option>
                    <option value={NodeVariableType.TextArea}>TextArea</option>
                    <option value={NodeVariableType.RichTextArea}>RichTextArea</option>
                    <option value={NodeVariableType.SecretString}>SecretString</option>
                    <option value={NodeVariableType.Code}>Code</option>
                </Select>
                <input
                    type="text"
                    placeholder="Handle"
                    value={newVariableHandle}
                    onChange={(e) => setNewVariableHandle(e.target.value)}
                    className="border rounded p-1"
                />
                <Button type="button" plain onClick={handleAddVariable} className="ml-2">
                    <PlusIcon/>
                </Button>
            </div>

            <Divider className="my-10" soft bleed/>
            <div className="flex justify-end gap-4">
                <Button type="button" onClick={() => closeForm()} plain>
                    Close form
                </Button>
            </div>
        </div>
    );
};

export default ProjectVariablesForm;