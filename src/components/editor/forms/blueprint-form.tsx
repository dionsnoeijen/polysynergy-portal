import React, {useEffect, useState} from "react";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Button} from "@/components/button";
import {Blueprint, FormType} from "@/types/types";
import {Input} from "@/components/input";
import useEditorStore from "@/stores/editorStore";
import useBlueprintsStore from "@/stores/blueprintsStore";
import {Text} from "@/components/text";
import SvgSelector from "@/components/editor/forms/service/svg-selector";
import RichTextEditor from "@/components/rich-text-editor";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";

const BlueprintForm: React.FC = () => {
    const { closeForm, formType, formEditRecordId } = useEditorStore();
    const { getBlueprint, storeBlueprint } = useBlueprintsStore();

    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState("");
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    useEffect(() => {
        if (formType === FormType.EditBlueprint && formEditRecordId) {
            const blueprint = getBlueprint(formEditRecordId);
            if (blueprint) {
                setName(blueprint.name);
                setCategory(blueprint.metadata.category);
                setDescription(blueprint.metadata.description ?? "");
                setIcon(blueprint.metadata.icon ?? "");
            }
        }
    }, []);

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
                id: formEditRecordId,
                name: name,
                metadata: {
                    category: category,
                    description: description,
                    icon: icon,
                },
            };
            // @todo: update blueprint
            closeForm("Blueprint updated successfully");
        }
    };

    const handleDelete = () => {
        closeForm('Blueprint deleted successfully');
        // @todo: Implement deletion
        setShowDeleteAlert(false);
    };

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
            <Heading>{formType === FormType.AddBlueprint ? "Add " : "Edit "} Blueprint</Heading>

            <Divider className="my-10" soft bleed/>

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
                        onChange={(description) => setDescription(description)}
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