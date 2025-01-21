import React, {useEffect, useState} from "react";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Button} from "@/components/button";
import {FormType} from "@/types/types";
import {Input} from "@/components/input";
import useEditorStore from "@/stores/editorStore";
import {Text} from "@/components/text";
import SvgSelector from "@/components/editor/forms/service/svg-selector";

const BlueprintForm: React.FC = () => {
    const { closeForm, formType, formEditRecordId, selectedNodes } = useEditorStore();

    const [name, setName] = useState("");
    const [icon, setIcon] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

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
                    <Subheading>Category</Subheading>
                    <Text>Give a category so your blueprint can be found</Text>
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

            <div className="flex justify-end gap-4">
                <Button type="button" onClick={() => closeForm()} plain>
                    Cancel
                </Button>
                <Button type="submit">
                    {formType === FormType.AddBlueprint ? "Create blueprint" : "Update blueprint"}
                </Button>
            </div>
        </form>
    );
}

export default BlueprintForm;