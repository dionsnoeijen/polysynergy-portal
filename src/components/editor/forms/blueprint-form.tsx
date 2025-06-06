import React, {useCallback, useEffect, useState} from "react";
import useEditorStore from "@/stores/editorStore";
import useBlueprintsStore from "@/stores/blueprintsStore";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Button} from "@/components/button";
import {Blueprint, FormType} from "@/types/types";
import {Input} from "@/components/input";
import {Text} from "@/components/text";
import SvgSelector from "@/components/editor/forms/service/svg-selector";
import RichTextEditor from "@/components/rich-text-editor";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";
import {XMarkIcon} from "@heroicons/react/24/outline";

const BlueprintForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const formType = useEditorStore((state) => state.formType);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);

    const getBlueprint = useBlueprintsStore((state) => state.getBlueprint);
    const storeBlueprint = useBlueprintsStore((state) => state.storeBlueprint);
    const updateBlueprint = useBlueprintsStore((state) => state.updateBlueprint);
    const deleteBlueprint = useBlueprintsStore((state) => state.deleteBlueprint);

    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState("");
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    useEffect(() => {
        if (formType === FormType.EditBlueprint && formEditRecordId) {
            const blueprint = getBlueprint(formEditRecordId as string);
            if (blueprint) {
                setName(blueprint.name);
                setCategory(blueprint.metadata.category);
                setDescription(blueprint.metadata.description ?? "");
                setIcon(blueprint.metadata.icon ?? "");
            }
        }
    }, [formEditRecordId, formType, getBlueprint]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (formType === FormType.AddBlueprint) {
            const newBlueprint: Blueprint = {
                name: name,
                metadata: {
                    category: category,
                    description: description,
                    icon: icon,
                },
            }
            storeBlueprint(newBlueprint);
            closeForm("Blueprint created successfully");
        } else {
            const updatedBlueprint: Blueprint = {
                id: formEditRecordId as string,
                name: name,
                metadata: {
                    category: category,
                    description: description,
                    icon: icon,
                },
            };
            updateBlueprint(updatedBlueprint)
            closeForm("Blueprint updated successfully");
        }
    };

    const handleDelete = useCallback(() => {
        deleteBlueprint(formEditRecordId as string);
        closeForm('Blueprint deleted successfully');
        setShowDeleteAlert(false);
    }, [closeForm, deleteBlueprint, formEditRecordId]);

    useEffect(() => {
        if (!showDeleteAlert) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Enter") {
                handleDelete();
            }
            if (event.key === "Escape") {
                setShowDeleteAlert(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [showDeleteAlert, handleDelete, setShowDeleteAlert]);

    return (
        <form onSubmit={handleSubmit} method={'post'} className={'p-10'}>
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>
                    {formType === FormType.AddBlueprint ? "Add " : "Edit "} Blueprint
                </Heading>
                <Button type="button" onClick={() => closeForm()} color="sky">
                    <XMarkIcon className="w-5 h-5" />
                </Button>
            </div>
            <Divider className="my-4" soft bleed />

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Name</Subheading>
                    <Text>Give a meaningful, descriptive name</Text>
                </div>
                <div>
                    <Input
                        aria-label="Name"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
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
                        onChange={(description: string) => setDescription(description)}
                    />
                </div>
            </section>

            <Divider className="my-10" soft bleed/>

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Category</Subheading>
                    <Text>Give a category so your blueprint can be found</Text>
                </div>
                <div>
                    <Input
                        aria-label="Category"
                        name="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    />
                </div>
            </section>

            <Divider className="my-10" soft bleed/>

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Icon</Subheading>
                    <Text>Select an icon</Text>
                </div>
                <div>
                    <SvgSelector onSelect={(url: string) => setIcon(url)} />
                </div>
            </section>

            <Divider className="my-10" soft bleed/>

            {formType === FormType.EditBlueprint && (
                <>
                    <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Subheading>Delete</Subheading>
                            <Text>After deletion, the blueprint is not recoverable</Text>
                        </div>
                        <div className="flex justify-end self-center">
                            <Button color="red" type="button" onClick={() => setShowDeleteAlert(true)}>
                                Delete blueprint
                            </Button>
                        </div>
                    </section>
                    <Divider className="my-10" soft bleed/>
                </>
            )}

            <div className="flex justify-end gap-4">
                <Button type="button" onClick={() => closeForm()} plain>
                    Cancel
                </Button>
                <Button type="submit">
                    {formType === FormType.AddBlueprint ? "Create blueprint" : "Update blueprint"}
                </Button>
            </div>

            {showDeleteAlert && (
                <Alert size="md" className="text-center" open={showDeleteAlert} onClose={() => setShowDeleteAlert(false)}>
                    <AlertTitle>Are you sure you want to delete this route?</AlertTitle>
                    <AlertDescription>This action cannot be undone.</AlertDescription>
                    <AlertActions>
                        <Button onClick={() => setShowDeleteAlert(false)} plain>
                            Cancel
                        </Button>
                        <Button color="red" onClick={handleDelete}>
                            Yes, delete
                        </Button>
                    </AlertActions>
                </Alert>
            )}
        </form>
    );
}

export default BlueprintForm;