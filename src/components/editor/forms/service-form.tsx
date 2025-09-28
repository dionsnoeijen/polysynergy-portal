import React, {useCallback, useEffect, useState} from "react";

import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useServicesStore from "@/stores/servicesStore";

import {adjectives, animals, colors, uniqueNamesGenerator} from 'unique-names-generator';

import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Button} from "@/components/button";
import {FormType, NodeType, NodeVariable} from "@/types/types";
import {Input} from "@/components/input";
import {Text} from "@/components/text";
import {makeServiceFromNodeForStorage, promoteNodeInStateToService} from "@/utils/packageGroupNode";
import {updateService} from "@/api/servicesApi";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";

import RichTextEditor from "@/components/rich-text-editor";
import SvgSelector from "@/components/editor/forms/service/svg-selector";
import findPublishedVariables from "@/utils/findPublishedVariables";
import Node from "@/components/editor/nodes/node";
import {XMarkIcon} from "@heroicons/react/24/outline";
import Info from "@/components/info";

const ServiceForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const formType = useEditorStore((state) => state.formType);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const setSelectedNodes = useEditorStore((state) => state.setSelectedNodes);

    const nodes = useNodesStore((state) => state.nodes);
    const getNodesInGroup = useNodesStore((state) => state.getNodesInGroup);
    const getNode = useNodesStore((state) => state.getNode);
    const updateNodeVariablePublishedDescription = useNodesStore((state) => state.updateNodeVariablePublishedDescription);
    const updateNodeVariablePublishedTitle = useNodesStore((state) => state.updateNodeVariablePublishedTitle);
    const getNodesByIds = useNodesStore((state) => state.getNodesByIds);

    const clearTempNodes = useNodesStore((state) => state.clearTempNodes);
    const clearTempConnections = useConnectionsStore((state) => state.clearTempConnections);

    const connections = useConnectionsStore((state) => state.connections);
    const fetchServices = useServicesStore((state) => state.fetchServices);
    const deleteService = useServicesStore((state) => state.deleteService);
    const storeService = useServicesStore((state) => state.storeService);

    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [icon, setIcon] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [nameError, setNameError] = useState<boolean>(false);
    const [categoryError, setCategoryError] = useState<boolean>(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [publishedVariables, setPublishedVariables] = useState<{
        [handle: string]: { variables: NodeVariable[]; nodeIds: string[] }
    }>({});
    const [nodeNames, setNodeNames] = useState<{ [nodeId: string]: string }>({});
    const [tempService, setTempService] = useState<{
        id: string;
        handle: string;
        variant: number;
        name: string;
        description: string;
        category: string;
    } | null>(null);

    let node = undefined;

    if (formType === FormType.AddService || formType === FormType.EditService) {
        node = getNode(selectedNodes[0]);
    }

    const handleDelete = useCallback(() => {
        deleteService(formEditRecordId as string);
        closeForm('Service deleted successfully');
        setShowDeleteAlert(false);
    }, [closeForm, deleteService, formEditRecordId]);

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

    // Initialize form values only once when component mounts or formType changes
    useEffect(() => {
        if (!node) return;

        // Only set initial values, not on every node update
        setName(prev => prev || node.service?.name || "");
        setCategory(prev => prev || node.service?.category || "");
        setIcon(prev => prev || node.icon || "");
        setDescription(prev => prev || node.service?.description || "");
        setNodeNames({[node.id]: node.name});

        // Als we een nieuwe service aanmaken, maak een tijdelijke service object
        if (formType === FormType.AddService && !node.service && !tempService) {
            setTempService({
                id: "temp-id",
                handle: uniqueNamesGenerator({dictionaries: [adjectives, animals, colors]}),
                variant: 1,
                name: "",
                description: "",
                category: "",
            });
        }
    }, [formType, node?.id]); // Only depend on formType and node id, not the entire node object

    // Separate effect for published variables that need to update when nodes change
    useEffect(() => {
        if (!node) return;

        if (node.type === NodeType.Group) {
            const nodesInGroup = getNodesInGroup(node.id);
            const nodesByIds = getNodesByIds(nodesInGroup);
            nodesByIds.map((n) => {
                setNodeNames(
                    (prev) => ({...prev, [n.id]: n.name})
                );
            });
            const {variablesByHandle} = findPublishedVariables(nodesByIds);
            setPublishedVariables(variablesByHandle);
        } else {
            const {variablesByHandle} = findPublishedVariables([node]);
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

    // Gebruik tempService voor nieuwe services (geen directe node mutatie)
    const currentService = node.service || tempService;

    const handleCancel = (e: React.FormEvent) => {
        e.preventDefault();

        // Reset icon bij cancel van nieuwe service
        if (formType === FormType.AddService) {
            node.icon = undefined;
        }

        setSelectedNodes([]);
        clearTempNodes();
        clearTempConnections();
        setTempService(null); // Reset lokale temp service state
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

        if (formType === FormType.EditService) {
            if (!node.service || !formEditRecordId) return;

            node.service.name = name;
            node.service.category = category;
            node.service.description = description;

            const nodeForStorage = makeServiceFromNodeForStorage(
                node,
                nodes,
                connections,
            );

            await updateService(
                formEditRecordId as string,
                name,
                category,
                description,
                nodeForStorage
            );
        } else {
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
        }

        setSelectedNodes([]);
        clearTempNodes();
        clearTempConnections();
        closeForm();

        await fetchServices();
    };

    const handleNameChange = (newName: string) => {
        setName(newName);

        // Update tempService als we een nieuwe service maken
        if (formType === FormType.AddService && tempService) {
            setTempService(prev => prev ? {...prev, name: newName} : null);
        }

        if (newName.trim()) {
            setNameError(false);
        }
    };

    const handleDescriptionChange = (newDescription: string) => {
        setDescription(newDescription);

        // Update tempService als we een nieuwe service maken
        if (formType === FormType.AddService && tempService) {
            setTempService(prev => prev ? {...prev, description: newDescription} : null);
        }
    };

    const handleCategoryChange = (newCategory: string) => {
        setCategory(newCategory);

        // Update tempService als we een nieuwe service maken
        if (formType === FormType.AddService && tempService) {
            setTempService(prev => prev ? {...prev, category: newCategory} : null);
        }

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
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>{formType === FormType.AddService ? "Add " : "Edit "} Service</Heading>
                <Button type="button" onClick={() => closeForm()} color="sky">
                    <XMarkIcon className="w-5 h-5"/>
                </Button>
            </div>
            <Divider className="my-4" soft bleed/>

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

            <Divider className="my-10" soft bleed/>

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

            <Divider className="my-10" soft bleed/>

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

            <Divider className="my-10" soft bleed/>

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Published Variables</Subheading>
                    <Text>
                        Give a good description on what is expected in the published variable. Creating the service,
                        will empty the value, so dont worry about accidentally sharing your keys.
                    </Text>
                </div>
                <div>
                    {Object.entries(publishedVariables).map(([nodeId, data], index) => (
                        data.variables.map((variable) => (
                            <div key={`node-pv-${nodeId}-${index}-${variable.handle}`}>
                                {index > 0 && <Divider className={'mt-5 mb-5'}/>}
                                <div>
                                    <Subheading
                                        className={'mb-1'}>{`${nodeNames[data.nodeIds[0]]} - ${variable.name}`}</Subheading>
                                    <Input
                                        className={'mb-2'}
                                        placeholder={'Variable title'}
                                        value={variable.published_title ?? ''}
                                        onChange={(e) => {
                                            const title: string = e.target.value;
                                            updateNodeVariablePublishedTitle(data.nodeIds[0], variable.handle, title);
                                        }}
                                    />
                                    <RichTextEditor
                                        value={variable.published_description ?? ""}
                                        onChange={(description) => {
                                            updateNodeVariablePublishedDescription(data.nodeIds[0], variable.handle, description);
                                        }}
                                    />
                                </div>
                            </div>
                        ))
                    ))}
                </div>
            </section>

            <Divider className="my-10" soft bleed/>

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Icon</Subheading>
                    <Text>Select an icon</Text>
                </div>
                <div>
                    <SvgSelector onSelect={(url: string) => handleIconChange(url)}/>
                </div>
            </section>

            <Divider className="my-10" soft bleed/>

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Node</Subheading>
                    <Text>Service preview</Text>
                </div>
                <div className="flex justify-end">
                    <Node node={{
                        ...node,
                        service: currentService || undefined,
                        icon: icon || node.icon
                    }} preview={true}/>
                </div>
            </section>

            <Divider className="my-10" soft bleed/>

            {formType === FormType.EditService && (
                <>
                    <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Subheading>Delete</Subheading>
                            <Text>After deletion, the service is not recoverable</Text>
                        </div>
                        <div className="flex justify-end self-center">
                            <Button color="red" type="button" onClick={() => setShowDeleteAlert(true)}>
                                Delete service
                            </Button>
                        </div>
                    </section>
                    <Divider className="my-10" soft bleed/>
                </>
            )}

            {formType === FormType.EditService && (
                <>
                    <Info title="About updating a service">
                        When you update a service, existing nodes that already use this service <b>will not be
                        affected</b>.<br/>
                        They continue to use the original version to maintain flow stability.<br/>
                        Only services added <b>after</b> the update will use the new version.
                    </Info>
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
                <Button type="submit" color={'sky'}>
                    {formType === FormType.AddService ? "Create service" : "Update service"}
                </Button>
            </div>

            {showDeleteAlert && (
                <Alert size="md" className="text-center" open={showDeleteAlert}
                       onClose={() => setShowDeleteAlert(false)}>
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