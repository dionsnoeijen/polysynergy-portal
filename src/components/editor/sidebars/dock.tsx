import React from "react";

import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";

import clsx from "clsx";
import Heading from "@/components/editor/sidebars/elements/heading";
import VariableTypeString from "@/components/editor/sidebars/dock/variable-type-string";
import VariableTypeNumber from "@/components/editor/sidebars/dock/variable-type-number";
import VariableTypeDict from "@/components/editor/sidebars/dock/variable-type-dict";
import VariableTypeBoolean from "@/components/editor/sidebars/dock/variable-type-boolean";
import GroupName from "@/components/editor/sidebars/dock/group-name";
import VariableGroup from "@/components/editor/sidebars/dock/variable-group";
import useVariablesForGroup from "@/hooks/editor/nodes/useVariablesForGroup";
import VariableTypeList from "@/components/editor/sidebars/dock/variable-type-list";
import VariableTypeBytes from "@/components/editor/sidebars/dock/variable-type-bytes";
import VariableTypeRichTextArea from "@/components/editor/sidebars/dock/variable-type-rich-text-area";
import VariableTypeSecretString from "@/components/editor/sidebars/dock/variable-type-secret-string";
import VariableTypeTextArea from "@/components/editor/sidebars/dock/variable-type-text-area";
import interpretNodeVariableType from "@/utils/interpretNodeVariableType";
import VariableTypeCode from "@/components/editor/sidebars/dock/variable-type-code";
import NodeHandle from "@/components/editor/sidebars/dock/node-handle";
import VariableTypeJson from "@/components/editor/sidebars/dock/variable-type-json";
import VariableTypeFiles from "@/components/editor/sidebars/dock/variable-type-files";

import {Node, NodeVariable, NodeVariableType} from "@/types/types";
import {Button} from "@/components/button";
import {InformationCircleIcon} from "@heroicons/react/24/outline";
import VariableTypeTemplate from "@/components/editor/sidebars/dock/variable-type-template";
import {Input} from "@/components/input";
import {Field, Fieldset, Label} from "@/components/fieldset";

type Props = React.ComponentPropsWithoutRef<"div"> & {
    toggleClose: () => void;
};

export const VariableTypeComponents = {
    [NodeVariableType.String]: VariableTypeString,
    [NodeVariableType.Bytes]: VariableTypeBytes,
    [NodeVariableType.Number]: VariableTypeNumber,
    [NodeVariableType.Int]: VariableTypeNumber,
    [NodeVariableType.Float]: VariableTypeNumber,
    [NodeVariableType.Dict]: VariableTypeDict,
    [NodeVariableType.Boolean]: VariableTypeBoolean,
    [NodeVariableType.List]: VariableTypeList,
    [NodeVariableType.DateTime]: VariableTypeString,
    [NodeVariableType.TruePath]: null,
    [NodeVariableType.FalsePath]: null,
    [NodeVariableType.Unknown]: null,
    [NodeVariableType.Dependency]: null,
    [NodeVariableType.SecretString]: VariableTypeSecretString,
    [NodeVariableType.TextArea]: VariableTypeTextArea,
    [NodeVariableType.RichTextArea]: VariableTypeRichTextArea,
    [NodeVariableType.Code]: VariableTypeCode,
    [NodeVariableType.Json]: VariableTypeJson,
    [NodeVariableType.Files]: VariableTypeFiles,
    [NodeVariableType.Template]: VariableTypeTemplate,
    [NodeVariableType.Node]: null,
};

const Dock: React.FC<Props> = ({className, toggleClose, ...props}) => {
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const openedGroup = useNodesStore((state) => state.openedGroup);
    const nodes = useNodesStore((state) => state.nodes);
    const openDocs = useEditorStore((state) => state.openDocs);
    const setGroupNameOverride = useNodesStore((state) => state.setGroupNameOverride);

    const node: Node | null | undefined = selectedNodes.length === 1 ?
        nodes.find((n) => n.id === selectedNodes[0]) : null;

    const {group, variablesForGroup} = useVariablesForGroup(
        openedGroup || (node?.id ?? null),
        false
    );

    const groupNameOverrides: Record<string, string> = {};


    for (const node of nodes) {
        for (const variable of node.variables) {
            if (!variable.handle) continue;

            if (
                variable.type === NodeVariableType.Dict &&
                Array.isArray(variable.value)
            ) {
                for (const subvar of variable.value as NodeVariable[]) {
                    if (!subvar.handle) continue;

                    const key = `${node.id}::${variable.handle}.${subvar.handle}`;
                    groupNameOverrides[key] = subvar.group_name_override ?? '';
                }
            } else {
                const key = `${node.id}::${variable.handle}`;
                groupNameOverrides[key] = variable.group_name_override ?? '';
            }
        }
    }

    return (
        <div
            {...props}
            className={clsx(className, "absolute left-0 top-0 right-0 bottom-0 flex flex-col gap-2")}
        >
            <Heading arrowToLeft={true} toggleClose={toggleClose}>
                Dock: {node ? `${node.name}` : "select node"}
            </Heading>

            {!node && !group && (
                <div className="flex flex-1 items-center justify-center text-gray-500 dark:text-gray-400 text-lg">
                    Select node for node fields
                </div>
            )}

            {node && <VariableGroup title={'Handle'}>
                <NodeHandle node={node}/>
            </VariableGroup>}

            {node && node.documentation && (
                <Button plain onClick={() => openDocs(node?.documentation as string)}>
                    Documentation <InformationCircleIcon/>
                </Button>
            )}

            {group && (
                <>
                    <VariableGroup title={group.name}>
                        <GroupName group={group}/>

                        {variablesForGroup?.inVariables && variablesForGroup?.inVariables.length > 0 && (
                            <VariableGroup title="In Variables">
                                {variablesForGroup.inVariables
                                    .filter((item): item is { variable: NodeVariable; nodeId: string } => !!item)
                                    .map(({variable, nodeId}) => {
                                        if (!variable) return null;

                                        const {baseType} = interpretNodeVariableType(variable);
                                        const VariableComponent = VariableTypeComponents[baseType];

                                        let handle = variable.handle;
                                        if (variable.parentHandle) {
                                            handle = variable.parentHandle + '.' + variable.handle;
                                        }
                                        const key = `${nodeId}::${handle}`;
                                        const groupNameOverride = groupNameOverrides[key] ?? '';

                                        return (
                                            <div key={nodeId + '-' + variable.handle}>
                                                <Fieldset>
                                                    <Label>In name override ({variable.name}):</Label>
                                                    <Field>
                                                        <Input
                                                            value={groupNameOverride}
                                                            placeholder={`Override ${variable.handle} (${variable.name})`}
                                                            onChange={(e) => {
                                                                setGroupNameOverride(nodeId, handle, e.target.value);
                                                            }}
                                                        />
                                                    </Field>
                                                </Fieldset>
                                                {!variable.has_dock && VariableComponent && (
                                                    <VariableComponent
                                                        nodeId={nodeId}
                                                        variable={variable}
                                                        publishedButton={true}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                            </VariableGroup>
                        )}

                        {variablesForGroup?.outVariables && variablesForGroup?.outVariables.length > 0 && (
                            <VariableGroup title="Out Variables">
                                {variablesForGroup.outVariables
                                    .filter((item): item is { variable: NodeVariable; nodeId: string } => !!item)
                                    .map(({variable, nodeId}) => {
                                        if (!variable) return null;

                                        const {baseType} = interpretNodeVariableType(variable);
                                        const VariableComponent = VariableTypeComponents[baseType];

                                        let handle = variable.handle;
                                        if (variable.parentHandle) {
                                            handle = variable.parentHandle + '.' + variable.handle;
                                        }
                                        const key = `${nodeId}::${handle}`;
                                        const groupNameOverride = groupNameOverrides[key] ?? '';

                                        return (
                                            <div key={nodeId + '-' + variable.handle}>
                                                <Fieldset>
                                                    <Label>Out name override ({variable.name}):</Label>
                                                    <Field>
                                                        <Input
                                                            value={groupNameOverride}
                                                            placeholder={`Override ${variable.handle} (${variable.name})`}
                                                            onChange={(e) => {
                                                                setGroupNameOverride(nodeId, variable.handle, e.target.value);
                                                            }}
                                                        />
                                                    </Field>
                                                </Fieldset>
                                                {variable.has_dock && VariableComponent && (
                                                    <VariableComponent
                                                        nodeId={nodeId}
                                                        variable={variable}
                                                        publishedButton={true}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                            </VariableGroup>
                        )}
                    </VariableGroup>
                </>
            )}

            {node && node.variables.length > 0 ? (
                node.variables.some((variable: NodeVariable) => variable.has_dock) ? (
                    <VariableGroup title={node.name} version={node.version || 0.0}>
                        {node.variables.map((variable: NodeVariable) => {
                            if (!variable.has_dock) return null;
                            const {baseType} = interpretNodeVariableType(variable);
                            const VariableComponent = VariableTypeComponents[baseType];

                            return VariableComponent ? (
                                <div key={node.id + '-' + variable.handle}>
                                    <VariableComponent
                                        nodeId={node.id}
                                        variable={variable}
                                        publishedButton={true}
                                    />
                                </div>
                            ) : null;
                        })}
                    </VariableGroup>
                ) : (
                    <p className="text-zinc-400 text-sm italic p-4">
                        Node does not have variables that can be edited from the dock.
                    </p>
                )
            ) : null}
        </div>
    );
};

export default Dock;
