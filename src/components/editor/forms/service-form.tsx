import React, {useCallback, useEffect, useState} from "react";

import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useServicesStore from "@/stores/servicesStore";

import { Heading, Subheading } from "@/components/heading";
import { Divider } from "@/components/divider";
import { Button } from "@/components/button";
import {FormType, NodeType, NodeVariable} from "@/types/types";
import { Input } from "@/components/input";
import { Text } from "@/components/text";
import { makeServiceFromNodeForStorage, promoteNodeInStateToService } from "@/utils/packageGroupNode";
import { storeService } from "@/api/servicesApi";
import { Alert, AlertActions, AlertDescription, AlertTitle } from "@/components/alert";

import Node from "@/components/editor/nodes/node";
import RichTextEditor from "@/components/rich-text-editor";
import SvgSelector from "@/components/editor/forms/service/svg-selector";
import findPublishedVariables from "@/utils/findPublishedVariables";

const ServiceForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const formType = useEditorStore((state) => state.formType);
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);

    const nodes = useNodesStore((state) => state.nodes);
    const getNodesInGroup = useNodesStore((state) => state.getNodesInGroup);
    const getNode = useNodesStore((state) => state.getNode);
    const updateNodeVariablePublishedDescription = useNodesStore((state) => state.updateNodeVariablePublishedDescription);
    const updateNodeVariablePublishedTitle = useNodesStore((state) => state.updateNodeVariablePublishedTitle);
    const getNodesByIds = useNodesStore((state) => state.getNodesByIds);

    const connections = useConnectionsStore((state) => state.connections);
    const getService = useServicesStore((state) => state.getService);
    const fetchServices = useServicesStore((state) => state.fetchServices);

    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [icon, setIcon] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [nameError, setNameError] = useState<boolean>(false);
    const [categoryError, setCategoryError] = useState<boolean>(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [publishedVariables, setPublishedVariables] = useState<{ [handle: string]: { variables: NodeVariable[]; nodeIds: string[] } }>({});
    const [nodeNames, setNodeNames] = useState<{[nodeId: string]: string}>({});

    let node = undefined;

    if (formType === FormType.AddService) {
        node = getNode(selectedNodes[0]);
    }

    if (formType === FormType.EditService && formEditRecordId) {
        node = getService(formEditRecordId);
        if (node) {
            node = node.node_setup.versions[0].content.nodes[0];
        }
    }

    const handleDelete = useCallback(() => {
        closeForm('Service deleted successfully');
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

    useEffect(() => {
        if (!node) return;
        setName(node.service?.name || "");
        setCategory(node.service?.category || "");
        setIcon(node.icon || "");
        setDescription(node.service?.description || "");
        setNodeNames({ [node.handle]: node.name });
        if (node.type === NodeType.Group) {
            const nodesInGroup = getNodesInGroup(node.id);
            const nodesByIds = getNodesByIds(nodesInGroup);
            nodesByIds.map((n) => {
                setNodeNames((prev) => ({ ...prev, [n.id]: n.name }));
            });
            const { variablesByHandle } = findPublishedVariables(nodesByIds);
            setPublishedVariables(variablesByHandle);
        } else {
            const { variablesByHandle } = findPublishedVariables([node]);
            setPublishedVariables(variablesByHandle);
        }
    }, [getNodesByIds, getNodesInGroup, node]);

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

        const nodeForStorage = makeServiceFromNodeForStorage(
            node,
            nodes,
            connections,
        );

        if (!nodeForStorage.id) return;

        await storeService(
            nodeForStorage.id,
            name,
            category,
            description,
            nodeForStorage,
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
                        <p className="mt-1 text-sm text-red-500">Name is required</p>
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
                    <Subheading>Published Variables</Subheading>
                    <Text>
                        Give a good description on what is expected in the published variable. Creating the service, will empty the value, so dont worry about accidentally sharing your keys.
                    </Text>
                </div>
                <div>
                    {Object.entries(publishedVariables).map(([nodeHandle, data], index) => (
                        data.variables.map((variable) => (
                            <div key={`node-pv-${nodeHandle}-${index}-${variable.handle}`}>
                                {index > 0 && <Divider className={'mt-5 mb-5'} />}
                                <div>
                                    <Subheading className={'mb-1'}>{`${nodeNames[nodeHandle]} - ${variable.name}`}</Subheading>
                                    <Input
                                        className={'mb-2'}
                                        placeholder={'Variable title'}
                                        value={variable.published_title as string}
                                        onChange={(e) => {
                                            const title: string = e.target.value;
                                            updateNodeVariablePublishedTitle(nodeHandle, variable.handle, title);
                                        }}
                                    />
                                    <RichTextEditor
                                        value={variable.published_description || ""}
                                        onChange={(description) => {
                                            updateNodeVariablePublishedDescription(nodeHandle, variable.handle, description);
                                        }}
                                    />
                                </div>
                            </div>
                        ))
                    ))}
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