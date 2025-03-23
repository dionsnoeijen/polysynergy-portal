import React, {useEffect, useState} from "react";
import EditFileVariable from "@/components/editor/forms/variable/edit-file-variable";
import {FormType, Node} from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import {Button} from "@/components/button";
import {Heading} from "@/components/heading";
import {Divider} from "@/components/divider";

const FileEditorForm: React.FC = () => {
    const getNode = useNodesStore((state) => state.getNode);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);
    const formEditVariable = useEditorStore((state) => state.formEditVariable);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const closeForm = useEditorStore((state) => state.closeForm);
    const formType = useEditorStore((state) => state.formType);

    const [files, setFiles] = useState<string[]>(formEditVariable?.value as string[] || []);
    const [node, setNode] = useState<Node>();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formEditRecordId || !formEditVariable) return;
        updateNodeVariable(formEditRecordId, formEditVariable?.handle, files);
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

            <EditFileVariable title={'Files'} files={files} onChange={setFiles} dock={formEditVariable?.dock} />

            <Divider className="my-10" soft bleed />

            <div className="flex justify-end gap-4">
                <Button type="button" onClick={() => closeForm()} plain>
                    Cancel
                </Button>
                <Button type="submit">
                    { formType === FormType.EditFiles && "Save files" }
                </Button>
            </div>
        </form>
    );
}

export default FileEditorForm;