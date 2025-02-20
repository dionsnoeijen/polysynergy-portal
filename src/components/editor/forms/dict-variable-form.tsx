import React, { useEffect, useState } from "react";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";

import { Divider } from "@/components/divider";
import { Button } from "@/components/button";
import { FormType, Node, NodeVariable } from "@/types/types";
import { Heading } from "@/components/heading";

import EditDictVariable from "@/components/editor/forms/variable/edit-dict-variable";

const DictVariableForm: React.FC = () => {
    const getNode = useNodesStore((state) => state.getNode);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);
    const closeForm = useEditorStore((state) => state.closeForm);
    const formEditVariable = useEditorStore((state) => state.formEditVariable);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const formType = useEditorStore((state) => state.formType);

    const [variables, setVariables] = useState<NodeVariable[]>(formEditVariable?.value as NodeVariable[] || []);
    const [node, setNode] = useState<Node>();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formEditRecordId || !formEditVariable) return;
        updateNodeVariable(formEditRecordId, formEditVariable?.handle, variables);
        closeForm();
    };

    useEffect(() => {
        if (!formEditRecordId) return;
        setNode(getNode(formEditRecordId));
    }, [ getNode, formEditRecordId, formType, formEditVariable ]);

    return (
        <form onSubmit={handleSubmit} method={"post"} className={"p-10"}>
            <Heading>{node && node.name}: {formEditVariable?.handle}</Heading>

            <Divider className="my-10" soft bleed />

            <EditDictVariable title="Array values" variables={variables} onChange={setVariables} />

            <Divider className="my-10" soft bleed />

            <div className="flex justify-end gap-4">
                <Button type="button" onClick={() => closeForm()} plain>
                    Cancel
                </Button>
                <Button type="submit">
                    { formType === FormType.EditDict && "Save array" }
                </Button>
            </div>
        </form>
    );
};

export default DictVariableForm;