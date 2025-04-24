/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {useEffect, useState} from "react";
import useEditorStore from "@/stores/editorStore";
import {Divider} from "@/components/divider";
import {Button} from "@/components/button";
import {FormType, Node} from "@/types/types";
import {Heading} from "@/components/heading";
import useNodesStore from "@/stores/nodesStore";
import EditListVariable from "@/components/editor/forms/variable/edit-list-variable";
import {XMarkIcon} from "@heroicons/react/24/outline";

const ListVariableForm: React.FC = () => {
    const getNode = useNodesStore((state) => state.getNode);

    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);
    const formEditVariable = useEditorStore((state) => state.formEditVariable);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const closeForm = useEditorStore((state) => state.closeForm);
    const formType = useEditorStore((state) => state.formType);

    const [items, setItems] = useState<any[]>(formEditVariable?.value as any[] || []);
    const [node, setNode] = useState<Node>();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formEditRecordId || !formEditVariable) return;
        updateNodeVariable(formEditRecordId, formEditVariable?.handle, items);
        closeForm();
    };

    useEffect(() => {
        if (!formEditRecordId) return;
        setNode(getNode(formEditRecordId));
    }, [getNode, formEditRecordId, formType, formEditVariable]);

    return (
        <form onSubmit={handleSubmit} method={"post"} className={"p-10"}>
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>{node && node.name}: {formEditVariable?.handle}</Heading>
                <Button type="button" onClick={() => closeForm()} plain>
                    <XMarkIcon className="w-5 h-5" />
                </Button>
            </div>
            <Divider className="my-4" soft bleed />

            <EditListVariable title={'Files'} items={items} onChange={setItems} dock={formEditVariable?.dock}/>

            <Divider className="my-10" soft bleed/>

            <div className="flex justify-end gap-4">
                <Button type="button" onClick={() => closeForm()} plain>
                    Cancel
                </Button>
                <Button type="submit">
                    {formType === FormType.EditList && "Save items"}
                </Button>
            </div>
        </form>
    );
}

export default ListVariableForm;