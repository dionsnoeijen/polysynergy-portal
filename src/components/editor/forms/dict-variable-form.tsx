import React, {useEffect, useState} from "react";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";

import {Divider} from "@/components/divider";
import {Button} from "@/components/button";
import {FormType, Node, NodeVariable} from "@/types/types";
import {Heading} from "@/components/heading";

import EditDictVariable from "@/components/editor/forms/variable/edit-dict-variable";
import useConnectionsStore from "@/stores/connectionsStore";
import {XMarkIcon} from "@heroicons/react/24/outline";

const DictVariableForm: React.FC = () => {
    const getNode = useNodesStore((state) => state.getNode);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);
    const closeForm = useEditorStore((state) => state.closeForm);
    const formEditVariable = useEditorStore((state) => state.formEditVariable);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const formType = useEditorStore((state) => state.formType);

    const removeConnectionsLinkedToVariable = useConnectionsStore((state) => state.removeConnectionsLinkedToVariable);
    const updateConnectionsHandle = useConnectionsStore((state) => state.updateConnectionsHandle);

    const [variables, setVariables] = useState<NodeVariable[]>(formEditVariable?.value as NodeVariable[] || []);
    const [node, setNode] = useState<Node>();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formEditRecordId || !formEditVariable) return;

        const oldVars: NodeVariable[] = formEditVariable.value as NodeVariable[] || [];
        const newVars = variables;

        const getDictVariableDiff = (
            oldArr: NodeVariable[],
            newArr: NodeVariable[]
        ) => {
            const removed: string[] = [];
            const added: string[] = [];
            const renamed: { from: string; to: string }[] = [];

            const oldMap = new Map(oldArr.map((v) => [v.handle, v]));
            const newMap = new Map(newArr.map((v) => [v.handle, v]));

            for (const handle of oldMap.keys()) {
                if (!newMap.has(handle)) {
                    removed.push(handle);
                }
            }

            for (const handle of newMap.keys()) {
                if (!oldMap.has(handle)) {
                    added.push(handle);
                }
            }

            for (const oldHandle of removed) {
                const oldVar = oldMap.get(oldHandle);
                for (const newHandle of added) {
                    const newVar = newMap.get(newHandle);
                    if (
                        oldVar?.type === newVar?.type &&
                        oldVar?.has_in === newVar?.has_in &&
                        oldVar?.has_out === newVar?.has_out
                    ) {
                        renamed.push({from: oldHandle, to: newHandle});
                    }
                }
            }

            return {
                removed: removed.filter((h) => !renamed.find((r) => r.from === h)),
                added: added.filter((h) => !renamed.find((r) => r.to === h)),
                renamed,
            };
        };

        const {removed, renamed} = getDictVariableDiff(oldVars as NodeVariable[], newVars);

        removed.forEach((handle) => {
            removeConnectionsLinkedToVariable(
                formEditRecordId,
                `${formEditVariable.handle}.${handle}`
            );
        });

        renamed.forEach(({from, to}) => {
            updateConnectionsHandle(
                formEditRecordId,
                `${formEditVariable.handle}.${from}`,
                `${formEditVariable.handle}.${to}`
            );
        });

        oldVars.forEach((oldVar) => {
            const newVar = newVars.find((v) => v.handle === oldVar.handle);
            if (!newVar) return;

            const fullHandle = `${formEditVariable.handle}.${oldVar.handle}`;

            if (oldVar.has_in && !newVar.has_in) {
                removeConnectionsLinkedToVariable(formEditRecordId, fullHandle);
            }

            if (oldVar.has_out && !newVar.has_out) {
                removeConnectionsLinkedToVariable(formEditRecordId, fullHandle);
            }
        });

        updateNodeVariable(formEditRecordId, formEditVariable.handle, newVars);
        closeForm();
    };

    useEffect(() => {
        if (!formEditRecordId) return;
        setNode(getNode(formEditRecordId));
    }, [getNode, formEditRecordId, formType, formEditVariable?.published]);

    return (
        <form onSubmit={handleSubmit} method={"post"} className={"p-10"}>
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>{node && node.name}: {formEditVariable?.handle}</Heading>
                <Button type="button" onClick={() => closeForm()} plain>
                    <XMarkIcon className="w-5 h-5" />
                </Button>
            </div>
            <Divider className="my-4" soft bleed />

            <EditDictVariable
                title="Array values"
                dock={formEditVariable?.dock}
                variables={variables}
                onChange={setVariables}
                published={formEditVariable?.published}
            />

            <Divider className="my-10" soft bleed/>

            <div className="flex justify-end gap-4">
                <Button type="button" onClick={() => closeForm()} plain>Cancel</Button>
                <Button type="submit">
                    {formType === FormType.EditDict && "Save dictionary"}
                </Button>
            </div>
        </form>
    );
};

export default DictVariableForm;