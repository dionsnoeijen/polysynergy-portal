import React, { useState } from "react";
import { Heading, Subheading } from "@/components/heading";
import { Divider } from "@/components/divider";
import { Button } from "@/components/button";
import { FormType } from "@/types/types";
import { Input } from "@/components/input";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import { Text } from "@/components/text";
import SvgSelector from "@/components/editor/forms/service/svg-selector";
import Node from "@/components/editor/nodes/node";
import RichTextEditor from "@/components/rich-text-editor";
import {makeServiceFromNodeForStorage, promoteNodeInStateToService} from "@/utils/packageNode";
import useConnectionsStore from "@/stores/connectionsStore";
import useServicesStore from "@/stores/servicesStore";
import {storeService} from "@/api/servicesApi";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";

const ServiceForm: React.FC = () => {
    const { closeForm, formType, selectedNodes, formEditRecordId } = useEditorStore();
    const { nodes, getNode } = useNodesStore();
    const { connections } = useConnectionsStore();
    const { getService, fetchServices } = useServicesStore();

    let node = undefined;

    if (formType === FormType.AddService) {
        if (selectedNodes.length > 1) {
            console.log("MULTIPLE NODES SELECTED, MAKE SURE THE FORM DOES NOT LOAD AT ALL");
            return null;
        }

        if (selectedNodes.length === 0) {
            console.log("NO NODES SELECTED, MAKE SURE THE FORM DOES NOT LOAD AT ALL");
            return null;
        }
    }

    if (formType === FormType.EditService && formEditRecordId) {
        node = getService(formEditRecordId);
        if (!node) {
            console.log('THERE IS NO NODE SERVICE IN THE SERVICE STORE WITH THAT ID');
            return null;
        }
        node = node.node_setup.versions[0].content.nodes[0];
        console.log('SERVICE LOADED FROM STORE', node);
    }

    if (formType === FormType.AddService) {
        node = getNode(selectedNodes[0]);
    }

    if (!node) {
        console.log('THERE IS NO NODE');
        return null;
    }

    if (formType === FormType.AddService &&
        node.service?.id &&
        node.service.id !== "temp-id"
    ) {
        console.log("CANNOT MAKE A SERVICE FROM A SERVICE, MAKE SURE THE FORM DOES NOT LOAD AT ALL");
        return null;
    }

    if (!node.service) {
        node.service = {
            id: "temp-id",
            name: "",
            description: "",
            category: "",
        };
    }

    const [name, setName] = useState(node.service.name || "");
    const [category, setCategory] = useState(node.service.category || "");
    const [icon, setIcon] = useState(node.icon || "");
    const [description, setDescription] = useState(node.service.description || "");
    const [error, setError] = useState<string | null>(null);
    const [nameError, setNameError] = useState<boolean>(false);
    const [categoryError, setCategoryError] = useState<boolean>(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    const handleCancel = (e: React.FormEvent) => {
        e.preventDefault();
        if (formType === FormType.AddService) {
            delete node.service;
            node.icon = undefined;
        }
        closeForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let hasError = false;
        let errorMessage = "";

        if (!name.trim()) {
            setNameError(true);
            errorMessage += "Name is required. ";
            hasError = true;
        } else {
            setNameError(false);
        }

        if (!category.trim()) {
            setCategoryError(true);
            errorMessage += "Category is required. ";
            hasError = true;
        } else {
            setCategoryError(false);
        }

        if (hasError) {
            setError(errorMessage);
            return;
        }

        setError(null);

        promoteNodeInStateToService(
            node,
            name,
            description,
            category,
            icon
        );

        console.log(node);

        const nodeForStorage = makeServiceFromNodeForStorage(
            node,
            nodes,
            connections,
        );

        console.log(nodeForStorage);

        if (!nodeForStorage?.service?.id) {
            console.log("CANNOT MAKE A SERVICE FROM A SERVICE, MAKE SURE THE FORM DOES NOT LOAD AT ALL");
            return;
        }

        await storeService(
            nodeForStorage?.service?.id,
            name,
            category,
            description,
            [nodeForStorage],
        );

        closeForm();
        await fetchServices();
    };

    const handleNameChange = (newName: string) => {
        setName(newName);
        if (!node.service) return;
        node.service.name = newName;

        if (newName.trim()) {
            setNameError(false);
        }
    };

    const handleDescriptionChange = (newDescription: string) => {
        setDescription(newDescription);
        if (!node.service) return;
        node.service.description = newDescription;
    };

    const handleCategoryChange = (newCategory: string) => {
        setCategory(newCategory);
        if (!node.service) return;
        node.service.category = newCategory;

        if (newCategory.trim()) {
            setCategoryError(false);
        }
    };

    const handleIconChange = (newIcon: string) => {
        setIcon(newIcon);
        node.icon = newIcon;
    };

    const handleDelete = () => {
        closeForm('Service deleted successfully');
        // @todo: Implement deletion
        setShowDeleteAlert(false);
    };

    return (
        <form onSubmit={handleSubmit} method="post" className="p-10">
            <Heading>{formType === FormType.AddService ? "Add " : "Edit "} Service</Heading>

            <Divider className="my-10" soft bleed />

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
                        onChange={(e) => handleNameChange(e.target.value)}
                        className={`${
                            nameError ? "border-red-500" : ""
                        }`}
                    />
                    {nameError && (
                        <p className="mt-1 text-sm text-red-500">Name is required.</p>
                    )}
                </div>
            </section>

            <Divider className="my-10" soft bleed />

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Description</Subheading>
                    <Text>What is it for, and how to use</Text>
                </div>
                <div>
                    <RichTextEditor
                        value={description}
                        onChange={(description) => handleDescriptionChange(description)}
                    />
                </div>
            </section>

            <Divider className="my-10" soft bleed />

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Category</Subheading>
                    <Text>Give a category so your service can be found</Text>
                </div>
                <div>
                    <Input
                        aria-label="Category"
                        name="category"
                        value={category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className={`${
                            categoryError ? "border-red-500" : ""
                        }`}
                    />
                    {categoryError && (
                        <p className="mt-1 text-sm text-red-500">Category is required.</p>
                    )}
                </div>
            </section>

            <Divider className="my-10" soft bleed />

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Icon</Subheading>
                    <Text>Select an icon</Text>
                </div>
                <div>
                    <SvgSelector onSelect={(url: string) => handleIconChange(url)} />
                </div>
            </section>

            <Divider className="my-10" soft bleed />

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Node</Subheading>
                    <Text>Service preview</Text>
                </div>
                <div className="flex justify-end">
                    <Node node={node} preview={true} />
                </div>
            </section>

            <Divider className="my-10" soft bleed />

            {formType === FormType.EditService && (
                <>
                    <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Subheading>Delete</Subheading>
                            <Text>After deletion, the service is not recoverable</Text>
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
                {error && (
                    <div className="text-red-500">
                        {error}
                    </div>
                )}
                <Button type="button" onClick={handleCancel} plain>
                    Cancel
                </Button>
                <Button type="submit">
                    {formType === FormType.AddService ? "Create service" : "Update service"}
                </Button>
            </div>

            {showDeleteAlert && (
                <Alert size="md" className="text-center" open={showDeleteAlert} onClose={() => setShowDeleteAlert(false)}>
                    <AlertTitle>Are you sure you want to delete this service?</AlertTitle>
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
};

export default ServiceForm;