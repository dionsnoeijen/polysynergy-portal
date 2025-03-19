import React, {useCallback, useEffect, useState} from "react";
import useEditorStore from "@/stores/editorStore";
import useConfigsStore from "@/stores/configsStore";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Button} from "@/components/button";
import {Config, FormType} from "@/types/types";
import {Input} from "@/components/input";
import {Text} from "@/components/text";
import SvgSelector from "@/components/editor/forms/service/svg-selector";
import RichTextEditor from "@/components/rich-text-editor";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";

const ConfigForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const formType = useEditorStore((state) => state.formType);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);

    const getConfig = useConfigsStore((state) => state.getConfig);
    const storeConfig = useConfigsStore((state) => state.storeConfig);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState("");
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    useEffect(() => {
        if (formType === FormType.EditConfig && formEditRecordId) {
            const config = getConfig(formEditRecordId);
            if (config) {
                setName(config.name);
                setDescription(config.metadata.description ?? "");
                setIcon(config.metadata.icon ?? "");
            }
        }
    }, [formEditRecordId, formType, getConfig]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (formType === FormType.AddConfig) {
            const newConfig: Config = {
                name: name,
                metadata: {
                    category: 'ps-config',
                    description: description,
                    icon: icon,
                },
            }
            storeConfig(newConfig);
            closeForm("Config created successfully");
        } else {
            closeForm("@todo: IMPLEMENT: Config updated successfully");
        }
    };

    const handleDelete = useCallback(() => {
        closeForm('@todo: IMPLEMENT: Config deleted successfully');
        setShowDeleteAlert(false);
    }, [closeForm]);

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
            <Heading>{formType === FormType.AddConfig ? "Add " : "Edit "} Config</Heading>

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
                    <Subheading>Icon</Subheading>
                    <Text>Select an icon</Text>
                </div>
                <div>
                    <SvgSelector onSelect={(url: string) => setIcon(url)} />
                </div>
            </section>

            <Divider className="my-10" soft bleed/>

            {formType === FormType.EditConfig && (
                <>
                    <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Subheading>Delete</Subheading>
                            <Text>After deletion, the config is not recoverable</Text>
                        </div>
                        <div className="flex justify-end self-center">
                            <Button color="red" type="button" onClick={() => setShowDeleteAlert(true)}>
                                Delete config
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
                    {formType === FormType.AddConfig ? "Create config" : "Update config"}
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

export default ConfigForm;