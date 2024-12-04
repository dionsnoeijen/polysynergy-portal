import React from "react";
import clsx from "clsx";
import Heading from "@/components/editor/sidebars/elements/heading";
import { NodeVariable, NodeVariableType } from "@/types/types";
import useNodesStore  from "@/stores/nodesStore";
import { useEditorStore } from "@/stores/editorStore";
import VariableTypeString from "@/components/editor/sidebars/dock/variable-type-string";
import VariableTypeNumber from "@/components/editor/sidebars/dock/variable-type-number";
import VariableTypeArray from "@/components/editor/sidebars/dock/variable-type-array";
import VariableTypeBoolean from "@/components/editor/sidebars/dock/variable-type-boolean";
import GroupName from "@/components/editor/sidebars/dock/group-name";
import VariableGroup from "@/components/editor/sidebars/dock/variable-group";
import useVariablesForGroup from "@/hooks/editor/nodes/useVariablesForGroup";

type Props = React.ComponentPropsWithoutRef<"div"> & {
    toggleClose: () => void;
};

const VariableTypeComponents = {
    [NodeVariableType.String]: VariableTypeString,
    [NodeVariableType.Number]: VariableTypeNumber,
    [NodeVariableType.Array]: VariableTypeArray,
    [NodeVariableType.Boolean]: VariableTypeBoolean,
};

const Dock: React.FC<Props> = ({ className, toggleClose, ...props }) => {
    const { selectedNodes, openGroup } = useEditorStore();
    const nodes = useNodesStore((state) => state.nodes);

    const node = selectedNodes.length === 1 ?
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

            {group && (
                <>
                    <VariableGroup title={group.name}>
                        <GroupName group={group} />

                        {variablesForGroup?.inVariables && variablesForGroup?.inVariables.length > 0 && (
                            <VariableGroup title="In Variables">
                                {variablesForGroup.inVariables.map(({ variable, nodeId }) => {
                                    if (!variable || !variable.has_dock) return null;
                                    const VariableComponent = VariableTypeComponents[variable.type];
                                    return VariableComponent ? (
                                        <div key={variable.handle}>
                                            <VariableComponent
                                                nodeId={nodeId as string}
                                                variable={variable}
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
                                    const VariableComponent = VariableTypeComponents[variable.type];
                                    return VariableComponent ? (
                                        <div key={variable.handle}>
                                            <VariableComponent
                                                nodeId={nodeId}
                                                variable={variable}
                                            />
                                        </div>
                                    ) : null;
                                })}
                            </VariableGroup>
                        )}
                    </VariableGroup>
                </>
            )}

            {node && node.variables.length > 0 && (
                <VariableGroup title="Node Variables">
                    {node.variables.map((variable: NodeVariable) => {
                        if (!variable.has_dock) return;
                        const VariableComponent = VariableTypeComponents[variable.type];
                        return VariableComponent ? (
                            <div key={variable.handle}>
                                <VariableComponent
                                    nodeId={node.id}
                                    variable={variable}
                                />
                            </div>
                        ) : null;
                    })}
                </VariableGroup>
            )}
        </div>
    );
};

export default Dock;
