import React from "react";

import useEditorStore from "@/stores/editorStore";
import useNodesStore  from "@/stores/nodesStore";

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

type Props = React.ComponentPropsWithoutRef<"div"> & {
    toggleClose: () => void;
};

export const VariableTypeComponents = {
    [NodeVariableType.String]: VariableTypeString,
    [NodeVariableType.Bytes]: VariableTypeBytes,
    [NodeVariableType.Number]: VariableTypeNumber,
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
};

const Dock: React.FC<Props> = ({ className, toggleClose, ...props }) => {
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const openGroup = useEditorStore((state) => state.openGroup);
    const nodes = useNodesStore((state) => state.nodes);
    const openDocs = useEditorStore((state) => state.openDocs);

    const node: Node | null | undefined = selectedNodes.length === 1 ?
        nodes.find((n) => n.id === selectedNodes[0]) : null;

    const { group, variablesForGroup } = useVariablesForGroup(
        openGroup || (node?.id ?? null)
    );

    return (
        <div
            {...props}
            className={clsx(className, "absolute left-0 top-0 right-0 bottom-0 flex flex-col gap-2")}
        >
            <Heading arrowToLeft={true} toggleClose={toggleClose}>
                Dock: {node ? node.name : "select node"}
            </Heading>

            {!node && !group && (
                <div className="flex flex-1 items-center justify-center text-gray-500 dark:text-gray-400 text-lg">
                    Select node for node fields
                </div>
            )}

            {node && <VariableGroup title={'Handle'}>
                <NodeHandle node={node} />
            </VariableGroup>}

            {node && node.documentation && (
                <Button plain onClick={() => openDocs(node?.documentation as string)}>
                    Documentation <InformationCircleIcon />
                </Button>
            )}

            {group && (
                <>
                    <VariableGroup title={group.name}>
                        <GroupName group={group} />

                        {variablesForGroup?.inVariables && variablesForGroup?.inVariables.length > 0 && (
                            <VariableGroup title="In Variables">
                                {variablesForGroup.inVariables.map(({ variable, nodeId }) => {
                                    if (!variable || !variable.has_dock) return null;
                                    const { baseType } = interpretNodeVariableType(variable);
                                    const VariableComponent = VariableTypeComponents[baseType];
                                    return VariableComponent ? (
                                        <div key={nodeId + '-' + variable.handle}>
                                            <VariableComponent
                                                nodeId={nodeId as string}
                                                variable={variable}
                                                publishedButton={true}
                                            />
                                        </div>
                                    ) : null;
                                })}
                            </VariableGroup>
                        )}

                        {variablesForGroup?.outVariables && variablesForGroup?.outVariables.length > 0 && (
                            <VariableGroup title="Out Variables">
                                {variablesForGroup.outVariables.map(({ variable, nodeId }) => {
                                    if (!variable || !variable.has_dock) return null;
                                    const { baseType } = interpretNodeVariableType(variable);
                                    const VariableComponent = VariableTypeComponents[baseType];
                                    return VariableComponent ? (
                                        <div key={nodeId + '-' + variable.handle}>
                                            <VariableComponent
                                                nodeId={nodeId}
                                                variable={variable}
                                                publishedButton={true}
                                            />
                                        </div>
                                    ) : null;
                                })}
                            </VariableGroup>
                        )}
                    </VariableGroup>
                </>
            )}

            {node && node.variables.length > 0 ? (
                node.variables.some((variable: NodeVariable) => variable.has_dock) ? (
                    <VariableGroup title={node.name}>
                        {node.variables.map((variable: NodeVariable) => {
                            if (!variable.has_dock) return null;
                            const { baseType } = interpretNodeVariableType(variable);
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
