import React, {useState} from "react";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Button} from "@/components/button";
import {FormType} from "@/types/types";
import {Input} from "@/components/input";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import {Text} from "@/components/text";
import SvgSelector from "@/components/editor/forms/service/svg-selector";
import Node from "@/components/editor/nodes/node";
import RichTextEditor from "@/components/rich-text-editor";
import {v4 as uuidv4} from "uuid";
import {makeServiceFromNode} from "@/utils/packageNode";
import useConnectionsStore from "@/stores/connectionsStore";

const ServiceForm: React.FC = () => {
    const {closeForm, formType, selectedNodes} = useEditorStore();
    const {nodes, getNode} = useNodesStore();
    const {connections} = useConnectionsStore();

    const node = getNode(selectedNodes[0]);
    if (!node) return null;

    if (node.service?.id && node.service.id !== "temp-id") {
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

    if (selectedNodes.length > 1) {
        console.log("MULTIPLE NODES SELECTED, MAKE SURE THE FORM DOES NOT LOAD AT ALL");
        return null;
    }

    if (selectedNodes.length === 0) {
        console.log("NO NODES SELECTED, MAKE SURE THE FORM DOES NOT LOAD AT ALL");
        return null;
    }

    const handleCancel = (e: React.FormEvent) => {
        e.preventDefault();

        delete node.service;
        node.icon = undefined;
        closeForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !category.trim()) {
            let e: string = "";
            if (!name.trim()) {
                e += "Name is required. ";
            }
            if (!category.trim()) {
                e += "Category is required. ";
            }
            setError(e);
            return;
        }
        setError(null);

        const defId = uuidv4();

        node.service = {
            ...node.service,
            id: defId,
            description,
            name,
            category,
        };
        node.icon = icon;

        console.log(node);

        makeServiceFromNode(
            node,
            nodes,
            connections,
            name,
            category,
            description,
            icon
        );

        console.log('servicicated', node);

        // await storeService(
        //     defId,
        //     name,
        //     category,
        //     description,
        //     [node],
        // );

        // closeForm();
    };

    const handleNameChange = (newName: string) => {
        setName(newName);
        if (!node.service) return;
        node.service.name = newName;
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
    };

    const handleIconChange = (newIcon: string) => {
        setIcon(newIcon);
        node.icon = newIcon;
    };

    return (
        <form onSubmit={handleSubmit} method="post" className="p-10">
            <Heading>{formType === FormType.AddService ? "Add " : "Edit "} Service</Heading>

            <Divider className="my-10" soft bleed/>

            {error && (
                <div className="mb-4 text-red-500">
                    {error}
                </div>
            )}

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
                    <RichTextEditor value={description}
                                    onChange={(description) => handleDescriptionChange(description)}/>
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
                    <Node node={node} preview={true}/>
                </div>
            </section>

            <Divider className="my-10" soft bleed/>

            <div className="flex justify-end gap-4">
                <Button type="button" onClick={handleCancel} plain>
                    Cancel
                </Button>
                <Button type="submit">
                    {formType === FormType.AddService ? "Create service" : "Update service"}
                </Button>
            </div>
        </form>
    );
};

export default ServiceForm;