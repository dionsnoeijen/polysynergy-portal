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

const ServiceForm: React.FC = () => {
    const { closeForm, formType, formEditRecordId, selectedNodes } = useEditorStore();
    const { getNode } = useNodesStore();

    const [name, setName] = useState("");
    const [icon, setIcon] = useState("");

    if (selectedNodes.length > 1) {
        console.log('MULTIPLE NODES SELECTED, MAKE SURE THE FORM DOES NOT LOAD AT ALL');
        return null;
    }

    if (selectedNodes.length === 0) {
        console.log('NO NODES SELECTED, MAKE SURE THE FORM DOES NOT LOAD AT ALL');
        return null;
    }

    const node = getNode(selectedNodes[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <form onSubmit={handleSubmit} method={'post'} className={'p-10'}>
            <Heading>{formType === FormType.AddService ? "Add " : "Edit "} Service</Heading>

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
                    <Subheading>Icon</Subheading>
                    <Text>Select an icon</Text>
                </div>
                <div>
                    <SvgSelector onSelect={(url) => setIcon(url)} selectedIcon={icon}/>
                </div>
            </section>

            <Divider className="my-10" soft bleed/>

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Node</Subheading>
                    <Text>Service preview</Text>
                </div>
                <div>
                    <Node node={node} preview={true} />
                </div>
            </section>

            <Divider className="my-10" soft bleed/>

            <div className="flex justify-end gap-4">
                <Button type="button" onClick={() => closeForm()} plain>
                    Cancel
                </Button>
                <Button type="submit">
                    {formType === FormType.AddService ? "Create service" : "Update service"}
                </Button>
            </div>
        </form>
    );
}

export default ServiceForm;