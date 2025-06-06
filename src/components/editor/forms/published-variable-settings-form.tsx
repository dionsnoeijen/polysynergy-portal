import React, {useEffect, useState} from "react";
import {Heading, Subheading} from "@/components/heading";
import {FormType, Node, NodeVariable, NodeVariableType} from "@/types/types";
import {Button} from "@/components/button";
import {ArrowRightCircleIcon, XMarkIcon} from "@heroicons/react/24/outline";
import {Divider} from "@/components/divider";
import useEditorStore from "@/stores/editorStore";
import {Text} from "@/components/text";
import {Input} from "@/components/input";
import RichTextEditor from "@/components/rich-text-editor";
import useNodesStore from "@/stores/nodesStore";
import {Switch} from "@/components/switch";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/table";

const PublishedVariableSettingsForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const formEditRecordId = useEditorStore<{ nodeId: string, variable: NodeVariable }>(
        (state) => state.formEditRecordId as { nodeId: string, variable: NodeVariable }
    );

    const getNode = useNodesStore((state) => state.getNode);
    const toggleNodeVariablePublished = useNodesStore((state) => state.toggleNodeVariablePublished);
    const updateNodeVariablePublishedTitle = useNodesStore((state) => state.updateNodeVariablePublishedTitle);
    const updateNodeVariablePublishedDescription = useNodesStore((state) => state.updateNodeVariablePublishedDescription);

    const node = getNode(formEditRecordId.nodeId) as Node;
    const currentVariable = node.variables.find(v => v.handle === formEditRecordId.variable.handle);

    const [title, setTitle] = useState(currentVariable?.published_title || "");
    const [description, setDescription] = useState(currentVariable?.published_description || "");
    const [published, setPublished] = useState(currentVariable?.published || false);

    const [subPublished, setSubPublished] = useState<Record<string, boolean>>(() => {
        if (currentVariable?.type === NodeVariableType.Dict && Array.isArray(currentVariable.value)) {
            return Object.fromEntries(
                currentVariable.value.map((subVar: NodeVariable) => [subVar.handle, subVar.published || false])
            );
        }
        return {};
    });

    useEffect(() => {
        if (
            currentVariable?.type === NodeVariableType.Dict &&
            Array.isArray(currentVariable.value)
        ) {
            const hasAnySubPublished = currentVariable.value.some((subVar: NodeVariable) => subVar.published);
            if (published && !hasAnySubPublished) {
                const updatedSubs = Object.fromEntries(
                    currentVariable.value.map((subVar: NodeVariable) => [subVar.handle, true])
                );
                setSubPublished(updatedSubs);
            }
        }
    }, []);

    const toggleLocalSubPublished = (handle: string) => {
        setSubPublished((prev) => ({
            ...prev,
            [handle]: !prev[handle],
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        updateNodeVariablePublishedTitle(formEditRecordId.nodeId, formEditRecordId.variable.handle, title);
        updateNodeVariablePublishedDescription(formEditRecordId.nodeId, formEditRecordId.variable.handle, description);

        if (published !== currentVariable?.published) {
            toggleNodeVariablePublished(formEditRecordId.nodeId, formEditRecordId.variable.handle);
        }

        if (currentVariable?.type === NodeVariableType.Dict && Array.isArray(currentVariable.value)) {
            for (const subVar of currentVariable.value) {
                const fullHandle = `${currentVariable.handle}.${subVar.handle}`;
                const wasPublished = subVar.published || false;
                const nowPublished = subPublished[subVar.handle] || false;
                if (wasPublished !== nowPublished) {
                    toggleNodeVariablePublished(formEditRecordId.nodeId, fullHandle);
                }
            }
        }

        closeForm();
    };

    return (
        <form onSubmit={handleSubmit} method={'post'} className={'p-10'}>
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>
                    Publish variable: {formEditRecordId.variable.type}: {formEditRecordId.variable.name} <span
                    className={'text-xs text-zinc-600 dark:text-white'}>{"{"}{formEditRecordId.variable.handle}{"}"}</span>
                </Heading>
                <Button type="button" onClick={() => closeForm()} color="sky">
                    <XMarkIcon className="w-5 h-5"/>
                </Button>
            </div>
            <Subheading>
                Node: {node.name} <span
                className={'text-xs text-zinc-600 dark:text-white'}>{"{"}{node.handle}{"}"}</span>
            </Subheading>

            <Divider className="my-10" soft bleed/>
            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Published</Subheading>
                    <Text>Make this variable visible in published variables form</Text>
                </div>
                <div>
                    <Switch
                        color={'sky'}
                        onClick={() => {
                            const newPublished = !published;
                            setPublished(newPublished);

                            if (currentVariable?.type === NodeVariableType.Dict && Array.isArray(currentVariable.value)) {
                                const updatedSubs = Object.fromEntries(
                                    currentVariable.value.map((subVar: NodeVariable) => [subVar.handle, newPublished])
                                );
                                setSubPublished(updatedSubs);
                            }
                        }}
                        checked={published}
                    />
                </div>
            </section>

            <Divider className="my-10" soft bleed/>
            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Title</Subheading>
                    <Text>This title will be displayed in the published variables form</Text>
                </div>
                <div>
                    <Input
                        name="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
            </section>

            <Divider className="my-10" soft bleed/>
            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Description</Subheading>
                    <Text>What is it for, and how to use</Text>
                </div>
                <div>
                    <RichTextEditor
                        value={description}
                        onChange={setDescription}
                    />
                </div>
            </section>

            {currentVariable?.type === NodeVariableType.Dict && Array.isArray(currentVariable.value) && (
                <>
                    <Divider className="my-10" soft bleed/>
                    <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Subheading>Sub Values</Subheading>
                            <Text>What specific values do you want exposed?</Text>
                        </div>
                        <div>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableHeader>Key</TableHeader>
                                        <TableHeader>Publish</TableHeader>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {currentVariable.value.map((subVar: NodeVariable, index: number) => (
                                        <TableRow key={subVar.handle + index}>
                                            <TableCell>{subVar.handle}</TableCell>
                                            <TableCell>
                                                <Switch
                                                    color="sky"
                                                    checked={!!subPublished[subVar.handle]}
                                                    onClick={() => toggleLocalSubPublished(subVar.handle)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </section>
                </>
            )}

            <Divider className="my-10" soft bleed/>
            <div className="flex justify-end gap-4">
                <Button type="button" onClick={closeForm} plain>
                    Cancel
                </Button>
                <Button color="sky" type="submit">
                    Save title and description
                </Button>
            </div>
        </form>
    );
};

export default PublishedVariableSettingsForm;