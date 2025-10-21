import React, { useEffect, useState, useRef } from "react";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import {Node} from "@/types/types";
import {Heading} from "@/components/heading";
import {Divider} from "@/components/divider";
import Editor from "@monaco-editor/react";
import {Button} from "@/components/button";
import {XMarkIcon, CodeBracketIcon} from "@heroicons/react/24/outline";
import {useTheme} from "next-themes";

const CodeEditorForm: React.FC = () => {
    const { getNode, updateNodeVariable } = useNodesStore();
    const { closeForm, formEditVariable, formEditRecordId } = useEditorStore();
    const { resolvedTheme } = useTheme();
    const [node, setNode] = useState<Node>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorRef = useRef<any>(null);
    const [code, setCode] = useState<string | undefined>();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formEditRecordId || !formEditVariable) return;
        updateNodeVariable(formEditRecordId as string, formEditVariable.handle, code as string);
        closeForm();
    };

    const handleEditorChange = (value: string | undefined) => {
        setCode(value);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEditorDidMount = (editor: unknown) => {
        editorRef.current = editor;

        const updateHeight = () => {
            // Height management can be added here if needed
        };

        updateHeight();

        const typedEditor = editor as { onDidChangeModelContent: (callback: () => void) => void };
        typedEditor.onDidChangeModelContent(() => {
            updateHeight();
        });
    };

    useEffect(() => {
        if (!formEditRecordId) return;
        setNode(getNode(formEditRecordId as string));
    }, [formEditRecordId, getNode]);

    useEffect(() => {
        if (formEditVariable?.value) {
            setCode(formEditVariable.value as string);
        }
    }, [formEditVariable]);

    // Get language from metadata, default to "python"
    const language = (formEditVariable?.dock?.metadata?.language as string) || "python";

    // Capitalize language name for display
    const languageDisplay = language.charAt(0).toUpperCase() + language.slice(1);

    return (
        <form onSubmit={handleSubmit} method="post">
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <Heading>
                        {node && node.name}: {formEditVariable?.handle}
                    </Heading>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-sm font-medium">
                        <CodeBracketIcon className="w-4 h-4" />
                        {languageDisplay}
                    </span>
                </div>
                <Button type="button" onClick={() => closeForm()} color="sky">
                    <XMarkIcon className="w-5 h-5" />
                </Button>
            </div>
            <Divider className="my-4" soft bleed />

            <section className="grid sm:grid-cols-1">
                <div className="h-[500px] overflow-hidden">
                    <Editor
                        height="100%"
                        defaultLanguage={language}
                        defaultValue={code}
                        onChange={handleEditorChange}
                        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light'}
                        onMount={handleEditorDidMount}
                        options={{
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            scrollbar: {
                                alwaysConsumeMouseWheel: false
                            },
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
                    Save Code
                </Button>
            </div>
        </form>
    );
};

export default CodeEditorForm;