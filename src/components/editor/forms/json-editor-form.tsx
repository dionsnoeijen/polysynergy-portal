import React, {useEffect, useState, useRef} from "react";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import {Heading} from "@/components/heading";
import {Divider} from "@/components/divider";
import Editor, {Monaco} from "@monaco-editor/react";
import {Button} from "@/components/button";
import {Node} from "@/types/types";

const JsonEditorForm: React.FC = () => {
    const {getNode, updateNodeVariable} = useNodesStore();
    const {closeForm, formEditVariable, formEditRecordId} = useEditorStore();
    const [node, setNode] = useState<Node>();
    const [editorHeight, setEditorHeight] = useState(400);
    const editorRef = useRef<any>(null);
    const [json, setJson] = useState<string | undefined>();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formEditRecordId || !formEditVariable) return;
        updateNodeVariable(formEditRecordId, formEditVariable.handle, json as string);
        closeForm();
    };

    const handleEditorChange = (value: string | undefined) => {
        setJson(value);
    };

    const handleEditorDidMount = (editor: any, monaco: Monaco) => {
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
        setNode(getNode(formEditRecordId));
    }, [formEditRecordId, getNode]);


    useEffect(() => {
        if (formEditVariable?.value) {
            setJson(formEditVariable.value as string);
        }
    }, [formEditVariable]);

    return (
        <form onSubmit={handleSubmit} method="post">
            <Heading className="p-10">
                {node && node.name}: {formEditVariable?.handle}
            </Heading>

            <Divider className="my-0" soft bleed/>

            <section className="grid sm:grid-cols-1">
                <div>
                    <Editor
                        height={`${editorHeight}px`}
                        defaultLanguage="json"
                        defaultValue={json}
                        onChange={handleEditorChange}
                        theme="vs-dark"
                        onMount={handleEditorDidMount}
                        options={{
                            minimap: {enabled: false},
                            scrollBeyondLastLine: false,
                        }}
                    />
                </div>
            </section>

            <Divider soft bleed/>

            <div className="flex justify-end gap-4 p-10">
                <Button type="button" onClick={() => closeForm()} plain>
                    Cancel
                </Button>
                <Button type="submit">
                    Save Json
                </Button>
            </div>
        </form>
    );
};

export default JsonEditorForm;