import React, {useState} from "react";
import {Dock, NodeVariable, NodeVariableType} from "@/types/types";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/table";
import {Fieldset, Label} from "@/components/fieldset";
import {Subheading} from "@/components/heading";
import {Button} from "@/components/button";
import {PlusIcon, TrashIcon} from "@heroicons/react/24/outline";
import { uploadFileMultipart, uploadFileBase64 } from "@/api/fileUploadApi";
import useEditorStore from "@/stores/editorStore";

type Props = {
    title: string;
    files: NodeVariable[];
    onChange: (updatedVariables: NodeVariable[], handle?: string) => void;
    handle?: string;
    dock?: Dock;
};

const EditFileVariable: React.FC<Props> = ({
    title,
    files,
    onChange,
    handle,
    dock
}) => {

    const activeProjectId = useEditorStore((state) => state.activeProjectId);

    const [newFile, setNewFile] = useState<NodeVariable>({
        handle: "",
        type: NodeVariableType.String,
        value: "",
        has_in: false,
        has_out: false,
        published: false,
    });

    const updateFile = (
        index: number,
        key: keyof NodeVariable,
        value: string | boolean | NodeVariableType
    ) => {
        const updatedVariables = [...files];
        if (key === "handle") {
            // @todo: Make optional
            // const validValue = (value as string).replace(/[^a-z-_]/g, '');
            updatedVariables[index] = {...updatedVariables[index], [key]: value as string};
        } else {
            updatedVariables[index] = {...updatedVariables[index], [key]: value};
        }
        onChange(updatedVariables, handle);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
        if (!event.target.files || event.target.files.length === 0) return;

        const file = event.target.files[0];
        const projectId = activeProjectId;
        const visibility: "public" | "private" = "private";

        try {
            let response;

            const useBase64 = true;

            if (useBase64) {
                response = await uploadFileBase64(file, projectId, visibility);
            } else {
                response = await uploadFileMultipart(file, projectId, visibility);
            }

            if ("error" in response) {
                console.error("Upload failed:", response.error);
            } else {
                const updatedFiles = files.map((f, i) =>
                    i === index ? { ...f, value: response.file, handle: file.name } : f
                );
                onChange(updatedFiles, handle);
            }
        } catch (error) {
            console.error("Upload error:", error);
        }
    };

    const addFile = () => {
        setNewFile({
            handle: "",
            type: NodeVariableType.String,
            value: "",
            has_in: false,
            has_out: false,
            published: false,
        });
        onChange([...files, newFile], handle);
    };

    const removeFile = (index: number) => {
        onChange(files.filter((_, i) => i !== index), handle);
    };

    return (
        <section className={"grid gap-x-8 gap-y-6 sm:grid-cols-1"}>
            <div className="space-y-1">
                <Subheading>{title}</Subheading>
            </div>
            <div>
                <Table dense bleed grid>
                    <TableHead>
                        <TableRow>
                            <TableHeader>{dock?.key_label || "Filename"}</TableHeader>
                            <TableHeader>Filename</TableHeader>
                            <TableHeader>Actions</TableHeader>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {files.map((file, index) => (
                        <TableRow key={`row-${index}`}>
                            <TableCell>
                                <Fieldset>
                                    <input
                                        type="file"
                                        id={`file-upload-${index}`}
                                        className="hidden"
                                        onChange={(event) => handleFileUpload(event, index)}
                                    />
                                    <Button
                                        plain
                                        onClick={() => document.getElementById(`file-upload-${index}`)?.click()}
                                    >
                                        Upload
                                    </Button>
                                </Fieldset>
                            </TableCell>
                            <TableCell>
                                {file.value as string}
                            </TableCell>
                            <TableCell>
                                <Button plain onClick={() => removeFile(index)}>
                                    <TrashIcon className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                        <TableRow key="new-file">
                            <TableCell colSpan={6} className="text-center">
                                <Button plain onClick={addFile}>
                                    <PlusIcon className="w-4 h-4" /> Add Row
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </section>
    )
}

export default EditFileVariable;