import React, { useEffect, useState, useRef } from "react";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import {Node} from "@/types/types";
import {Heading} from "@/components/heading";
import {Divider} from "@/components/divider";
import Editor from "@monaco-editor/react";
import {Button} from "@/components/button";
import {XMarkIcon} from "@heroicons/react/24/outline";

const CodeEditorForm: React.FC = () => {
    const getNode = useNodesStore((state) => state.getNode);
    const { closeForm, formEditVariable, formEditRecordId } = useEditorStore();
    const [node, setNode] = useState<Node>();
    const [editorHeight, setEditorHeight] = useState(400);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorRef = useRef<any>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formEditRecordId || !formEditVariable) return;
        // Update je node variabele hier
        closeForm();
    };

    const handleEditorChange = (value: string | undefined) => {
        console.log(value);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEditorDidMount = (editor: unknown) => {
        editorRef.current = editor;

        const updateHeight = () => {
            const contentHeight = editor.getContentHeight();
            setEditorHeight(contentHeight + 20); // Voeg wat padding toe
        };

        updateHeight();

        editor.onDidChangeModelContent(() => {
            updateHeight();
        });
    };

    useEffect(() => {
        if (!formEditRecordId) return;
        setNode(getNode(formEditRecordId as string));
    }, [formEditRecordId, getNode]);

    return (
        <form onSubmit={handleSubmit} method="post">
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>
                    {node && node.name}: {formEditVariable?.handle}
                </Heading>
                <Button type="button" onClick={() => closeForm()} color="sky">
                    <XMarkIcon className="w-5 h-5" />
                </Button>
            </div>
            <Divider className="my-4" soft bleed />

            <section className="grid sm:grid-cols-1">
                <div>
                    <Editor
                        height={`${editorHeight}px`}
                        defaultLanguage="python"
                        defaultValue={
`def execute():
    """
    This method is mandatory
    """

    return True
`}
                        onChange={handleEditorChange}
                        theme="vs-dark"
                        onMount={handleEditorDidMount}
                        options={{
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                        }}
                    />
                </div>
            </section>

            <Divider soft bleed />

            <div className="flex justify-end gap-4 p-10">
                <Button type="button" onClick={() => closeForm()} plain>
                    Cancel
                </Button>
                <Button type="submit">
                    Save
                </Button>
            </div>
        </form>
    );
};

export default CodeEditorForm;