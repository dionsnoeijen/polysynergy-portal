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
import {LockClosedIcon} from "@heroicons/react/16/solid";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";

const NodeEditorForm: React.FC = () => {
    const {getNode} = useNodesStore();
    const {closeForm, formEditVariable, formEditRecordId} = useEditorStore();
    const [node, setNode] = useState<NodeType>();
    const [code, setCode] = useState<string>('');
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
            const node = json.node;

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
        editor: any,
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
            const node = getNode(formEditRecordId);
            if (!node) return;

            if (node.path.includes('__main__')) {
                setIsBaseNode(false);
            }

            setCode(node.code);
            setNode(node);
        } else {
            // Reset naar default als er geen formEditRecordId is
            setCode(`# @todo, add a default code snippet here`);
        }
    }, [formEditRecordId, getNode]); // 🔥 Deze `useEffect` draait alleen als de node moet worden opgehaald

    useEffect(() => {
        if (code) {
            handleEditorChange(code); // 🔥 Voer pas uit als `code` correct is ingesteld
        }
    }, [code]); // 🔥 Deze `useEffect` wordt alleen uitgevoerd als `code` wijzigt

    return (
        <form onSubmit={handleSubmit} method="post">
            <Heading className="p-10">
                {node && node.name}: {formEditVariable?.handle}

                {isBaseNode && (<p>BASE NODE</p>)}
            </Heading>

            <Divider className="my-0" soft bleed/>

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 p-10">
                {node && <Node node={node} preview={true}/>}
            </section>

            <Divider className="my-0" soft bleed/>

            <div className={'p-5'}>
                <Button onClick={() => setShowUnlockAlert(true)}><LockClosedIcon />Locked</Button>
            </div>
            <section className="grid sm:grid-cols-1">
                <Editor
                    height={`${editorHeight}px`}
                    defaultLanguage="python"
                    defaultValue={code}
                    onChange={handleEditorChange}
                    theme="vs-dark"
                    onMount={handleEditorDidMount}
                    options={{
                        //readOnly: isBaseNode,
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
                       onClose={() => setShowUnlockAlert(false)}>
                    <AlertTitle>Are you sure you want to delete this account?</AlertTitle>
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