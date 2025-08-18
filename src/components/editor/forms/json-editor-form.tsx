import React, {useEffect, useState, useRef} from "react";
import {Divider} from "@/components/divider";
import {Button} from "@/components/button";
import {Heading} from "@/components/heading";
import {Node} from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import Editor from "@monaco-editor/react";
import {XMarkIcon, CodeBracketIcon, CubeIcon} from "@heroicons/react/24/outline";
import {useTheme} from "next-themes";
import VisualJsonEditor from "./visual-json-editor";

const JsonEditorForm: React.FC = () => {
    const getNode = useNodesStore((state) => state.getNode);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);
    const {theme} = useTheme();

    const closeForm = useEditorStore((state) => state.closeForm);
    const formEditVariable = useEditorStore((state) => state.formEditVariable);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);

    const [node, setNode] = useState<Node>();
    const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
    const [parsedJson, setParsedJson] = useState<unknown>(null);
    const [jsonError, setJsonError] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorRef = useRef<unknown>(null);
    const [json, setJson] = useState<string | undefined>();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formEditRecordId || !formEditVariable) return;
        
        // Use the current JSON string, prioritizing visual changes
        const jsonToSave = json || JSON.stringify(parsedJson || {}, null, 2);
        updateNodeVariable(formEditRecordId as string, formEditVariable.handle, jsonToSave);
        closeForm();
    };

    const handleEditorChange = (value: string | undefined) => {
        setJson(value);
        
        // Parse JSON and update visual representation
        if (value) {
            try {
                const parsed = JSON.parse(value);
                setParsedJson(parsed);
                setJsonError(null);
            } catch (error) {
                setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
            }
        } else {
            setParsedJson(null);
            setJsonError(null);
        }
    };

    const handleVisualChange = (newValue: unknown) => {
        setParsedJson(newValue);
        setJsonError(null);
        // Update the text editor
        const jsonString = JSON.stringify(newValue, null, 2);
        setJson(jsonString);
        // Also update Monaco editor if it's mounted
        if (editorRef.current) {
            const typedEditor = editorRef.current as { setValue: (value: string) => void };
            typedEditor.setValue(jsonString);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEditorDidMount = (editor: unknown) => {
        editorRef.current = editor;

        const updateHeight = () => {
            // const contentHeight = editor.getContentHeight();
            // setEditorHeight(contentHeight + 20); // Voeg wat padding toe
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
            const jsonValue = formEditVariable.value as string;
            setJson(jsonValue);
            
            // Parse initial JSON
            if (jsonValue) {
                try {
                    const parsed = JSON.parse(jsonValue);
                    setParsedJson(parsed);
                    setJsonError(null);
                } catch (error) {
                    setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
                    setParsedJson(null);
                }
            }
        }
    }, [formEditVariable]);

    return (
        <form onSubmit={handleSubmit} method="post">
            <div className="p-10 pb-0">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <Heading>{node && node.name}: {formEditVariable?.handle}</Heading>
                    <Button type="button" onClick={() => closeForm()} color="sky">
                        <XMarkIcon className="w-5 h-5"/>
                    </Button>
                </div>
                <Divider className="my-4" soft={true} bleed={true} />
            </div>

            {/* Tab Navigation - Full Width */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-700 mb-4 px-10">
                <button
                    type="button"
                    onClick={() => setActiveTab('visual')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === 'visual'
                            ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                            : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                >
                    <CubeIcon className="w-4 h-4" />
                    Visual
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('code')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === 'code'
                            ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                            : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                >
                    <CodeBracketIcon className="w-4 h-4" />
                    Code
                </button>
            </div>

            <div className="px-10">
                <section className="grid sm:grid-cols-1 relative">
                    {activeTab === 'visual' ? (
                        <div className="h-[500px] overflow-auto">
                            {jsonError ? (
                                <div className="text-center text-zinc-500 dark:text-zinc-400 py-20">
                                    <CubeIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Unable to display visual editor</p>
                                    <p className="text-sm">Fix JSON syntax errors in Code tab first</p>
                                </div>
                            ) : (
                                <VisualJsonEditor 
                                    value={parsedJson} 
                                    onChange={handleVisualChange}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="h-[500px] overflow-hidden -mx-10 relative">
                            <Editor
                                height={`100%`}
                                defaultLanguage="json"
                                value={json}
                                onChange={handleEditorChange}
                                theme={theme === "dark" ? "vs-dark" : "vs"}
                                onMount={handleEditorDidMount}
                                options={{
                                    minimap: {enabled: false},
                                    scrollBeyondLastLine: false,
                                    scrollbar: {
                                        alwaysConsumeMouseWheel: false
                                    },
                                }}
                            />
                            {/* JSON Status Indicator */}
                            <div className="absolute bottom-4 right-14 z-10">
                                <div 
                                    className={`w-3 h-3 rounded-full ${
                                        jsonError 
                                            ? 'bg-red-400 dark:bg-red-500' 
                                            : 'bg-green-400 dark:bg-green-500'
                                    }`}
                                    title={jsonError ? `JSON Error: ${jsonError}` : 'Valid JSON'}
                                />
                            </div>
                        </div>
                    )}
                </section>
            </div>

            <Divider soft={true} bleed={true} />

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