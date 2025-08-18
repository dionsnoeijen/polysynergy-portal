import React, {useEffect, useRef, useState} from "react";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import {FlowState, Node as NodeType} from "@/types/types";
import Node from "@/components/editor/nodes/node";
import {Heading} from "@/components/heading";
import {Divider} from "@/components/divider";
import Editor from "@monaco-editor/react";
import {Button} from "@/components/button";
import {fetchNodeSerialization} from "@/api/nodeApi";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";
import {XMarkIcon} from "@heroicons/react/24/outline";
import {useTheme} from "next-themes";

const NodeEditorForm: React.FC = () => {
    const {theme} = useTheme();

    const getNode = useNodesStore((state) => state.getNode);
    const closeForm = useEditorStore((state) => state.closeForm);
    const formEditVariable = useEditorStore((state) => state.formEditVariable);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);

    const [node, setNode] = useState<NodeType>();
    const [code, setCode] = useState<string>('');
    // eslint-disable-next-line
    const [isBaseNode, setIsBaseNode] = useState<boolean>(true);
    const [showUnlockAlert, setShowUnlockAlert] = useState<boolean>(false);
    const [editorHeight, setEditorHeight] = useState(400);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorRef = useRef<any>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formEditRecordId || !formEditVariable) return;
        // Update je node variabele hier
        closeForm();
    };

    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleEditorChange = async (value: string | undefined) => {
        if (!value) return;

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            const nodeResponse = await fetchNodeSerialization(value);
            if (nodeResponse.status !== 200) {
                console.log(nodeResponse.json());
                return;
            }

            const json: { node: NodeType } = await nodeResponse.json();
            const node = structuredClone(json.node);

            node.view = {
                x: 0,
                y: 0,
                width: 200,
                height: 200,
                collapsed: false
            };
            node.flowState = FlowState.Enabled;
            node.driven = false;

            setNode(node);
        }, 1000);
    };

    const handleEditorDidMount = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        editor: unknown,
    ) => {
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

    const confirmUnlock = () => {
        setShowUnlockAlert(false);
    };

    useEffect(() => {
        if (formEditRecordId) {
            const node = getNode(formEditRecordId as string);
            if (!node) return;

            if (node.path.includes('__main__')) {
                setIsBaseNode(false);
            }

            setCode(node.code);
            setNode(node);
        } else {
            setCode(`# @todo, add a default code snippet here`);
        }
    }, [formEditRecordId, getNode]);

    useEffect(() => {
        if (code) {
            handleEditorChange(code);
        }
    }, [code]);

    return (
        <form onSubmit={handleSubmit} method="post">
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading className="p-10">
                    {node && node.name}: {formEditVariable?.handle}
                </Heading>
                <Button type="button" onClick={() => closeForm()} color="sky">
                    <XMarkIcon className="w-5 h-5" />
                </Button>
            </div>

            <Divider className="my-0" soft bleed/>

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 p-10">
                {node && <Node node={node} preview={true}/>}
            </section>

            <Divider className="my-0" soft bleed/>

            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md p-4 mx-10 my-6">
                <p className="font-semibold">This feature is under construction.</p>
                <p className="text-sm mt-1">
                    {"You'll soon be able to create and edit your own custom nodes directly in the editor. For now, code editing is disabled."}
                </p>
            </div>

            {/*<div className={'p-5'}>*/}
            {/*    <Button onClick={() => setShowUnlockAlert(true)}><LockClosedIcon />Locked</Button>*/}
            {/*</div>*/}
            <section className="grid sm:grid-cols-1">
                <Editor
                    height={`${editorHeight}px`}
                    defaultLanguage="python"
                    defaultValue={code}
                    onChange={handleEditorChange}
                    theme={theme === "dark" ? "monokai" : "rjv-default"}
                    onMount={handleEditorDidMount}
                    options={{
                        // readOnly: isBaseNode,
                        readOnly: true,
                        minimap: {enabled: false},
                        scrollBeyondLastLine: false,
                        scrollbar: {
                            alwaysConsumeMouseWheel: false
                        },
                    }}
                />
            </section>

            <Divider soft bleed/>

            <div className="flex justify-end gap-4 p-10">
                <Button type="button" onClick={() => closeForm()} plain>
                    Cancel
                </Button>
                <Button type="submit">
                    Save
                </Button>
            </div>

            {showUnlockAlert && (
                <Alert size="md" className="text-center" open={showUnlockAlert}
                       onClose={(

                       ) => setShowUnlockAlert(false)}>
                    <AlertTitle>This editor is locked.</AlertTitle>
                    <AlertDescription>This action cannot be undone, and denies the account access to the
                        system.</AlertDescription>
                    <AlertActions>
                        <Button onClick={() => setShowUnlockAlert(false)} plain>
                            Cancel
                        </Button>
                        <Button color="red" onClick={confirmUnlock}>
                            Yes, delete
                        </Button>
                    </AlertActions>
                </Alert>
            )}
        </form>
    );
};

export default NodeEditorForm;