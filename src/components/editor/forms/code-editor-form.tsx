import React, {useEffect, useState} from "react";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import {Node} from "@/types/types";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import Editor from "@monaco-editor/react";

const CodeEditorForm: React.FC = () => {
    const {getNode, updateNodeVariable} = useNodesStore();
    const {closeForm, formEditVariable, formEditRecordId, formType} = useEditorStore();
    const [ node, setNode ] = useState<Node>();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formEditRecordId || !formEditVariable) return;
        updateNodeVariable(formEditRecordId, formEditVariable?.handle, variables);
        closeForm();
    }

    const handleEditorChange = (value: string | undefined) => {
        console.log(value); // Hier kun je de code opslaan of verwerken
      };

    useEffect(() => {
        if (!formEditRecordId) return;
        setNode(getNode(formEditRecordId));
    }, []);

    return (
        <form onSubmit={handleSubmit} method={"post"} className={"p-10"}>
            <Heading>{node && node.name}: {formEditVariable?.handle}</Heading>

            <Divider className="my-10" soft bleed/>

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-1">
                <div className="space-y-1">
                    <Subheading>Code Editor</Subheading>
                </div>
                <div>
                    <Editor
                      height="400px"
                      defaultLanguage="python"
                      defaultValue="# Schrijf hier je Python-code"
                      onChange={handleEditorChange}
                      theme="vs-dark"
                    />
                </div>
            </section>
        </form>
);
}
export default CodeEditorForm;