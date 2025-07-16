import React, {useEffect, useState, useRef} from "react";
import {Divider} from "@/components/divider";
import {Button} from "@/components/button";
import {Heading} from "@/components/heading";
import {Node} from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import Editor from "@monaco-editor/react";
import {XMarkIcon} from "@heroicons/react/24/outline";
import {useTheme} from "next-themes";

const JsonEditorForm: React.FC = () => {
    const getNode = useNodesStore((state) => state.getNode);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);
    const {theme} = useTheme();

    const closeForm = useEditorStore((state) => state.closeForm);
    const formEditVariable = useEditorStore((state) => state.formEditVariable);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);

    const [node, setNode] = useState<Node>();
    // const [editorHeight, setEditorHeight] = useState(400);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorRef = useRef<any>(null);
    const [json, setJson] = useState<string | undefined>();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formEditRecordId || !formEditVariable) return;
        updateNodeVariable(formEditRecordId as string, formEditVariable.handle, json as string);
        closeForm();
    };

    const handleEditorChange = (value: string | undefined) => {
        setJson(value);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;

        const updateHeight = () => {
            // const contentHeight = editor.getContentHeight();
            // setEditorHeight(contentHeight + 20); // Voeg wat padding toe
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


    useEffect(() => {
        if (formEditVariable?.value) {
            setJson(formEditVariable.value as string);
        }
    }, [formEditVariable]);

    return (
        <form onSubmit={handleSubmit} method="post" className="p-10">
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>{node && node.name}: {formEditVariable?.handle}</Heading>
                <Button type="button" onClick={() => closeForm()} color="sky">
                    <XMarkIcon className="w-5 h-5" />
                </Button>
            </div>
            <Divider className="my-4" soft bleed />

            <section className="grid sm:grid-cols-1">
                <div className="h-[500px] overflow-hidden -ml-10 -mr-10">
                    <Editor
                        height={`100%`}
                        defaultLanguage="handlebars"
                        defaultValue={json}
                        onChange={handleEditorChange}
                        theme={theme === "dark" ? "vs-dark" : "rjv-default"}
                        onMount={handleEditorDidMount}
                        options={{
                            minimap: {enabled: false},
                            scrollBeyondLastLine: false,
                            scrollbar: {
                                alwaysConsumeMouseWheel: false
                            },
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