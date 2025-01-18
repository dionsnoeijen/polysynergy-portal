import React, { useEffect, useState, useRef } from "react";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import { Node } from "@/types/types";
import { Heading } from "@/components/heading";
import { Divider } from "@/components/divider";
import Editor, { Monaco } from "@monaco-editor/react";

const CodeEditorForm: React.FC = () => {
    const { getNode, updateNodeVariable } = useNodesStore();
    const { closeForm, formEditVariable, formEditRecordId } = useEditorStore();
    const [node, setNode] = useState<Node>();
    const [editorHeight, setEditorHeight] = useState(400); // Start met een standaard hoogte
    const editorRef = useRef<any>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formEditRecordId || !formEditVariable) return;
        // Update je node variabele hier
        closeForm();
    };

    const handleEditorChange = (value: string | undefined) => {
        console.log(value); // Hier kun je de code opslaan of verwerken
    };

    const handleEditorDidMount = (editor: any, monaco: Monaco) => {
        editorRef.current = editor;

        const updateHeight = () => {
            const contentHeight = editor.getContentHeight();
            setEditorHeight(contentHeight + 20); // Voeg wat padding toe
        };

        // Stel de hoogte direct in
        updateHeight();

        // Herbereken hoogte bij inhoudswijzigingen
        editor.onDidChangeModelContent(() => {
            updateHeight();
        });
    };

    useEffect(() => {
        if (!formEditRecordId) return;
        setNode(getNode(formEditRecordId));
    }, [formEditRecordId, getNode]);

    return (
        <form onSubmit={handleSubmit} method="post">
            <Heading className="p-10">
                {node && node.name}: {formEditVariable?.handle}
            </Heading>

            <Divider className="my-0" soft bleed />

            <section className="grid sm:grid-cols-1">
                <div>
                    <Editor
                        height={`${editorHeight}px`}
                        defaultLanguage="python"
                        defaultValue="# Write Python-code here"
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
        </form>
    );
};

export default CodeEditorForm;