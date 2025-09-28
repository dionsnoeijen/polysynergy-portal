import React from "react";

import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import { fetchNodeDocumentationAPI } from "@/api/documentationApi";

import GroupName from "@/components/editor/sidebars/dock/group-name";
import VariableGroup from "@/components/editor/sidebars/dock/variable-group";
import useVariablesForGroup from "@/hooks/editor/nodes/useVariablesForGroup";
import interpretNodeVariableType from "@/utils/interpretNodeVariableType";
import NodeHandle from "@/components/editor/sidebars/dock/node-handle";
import {Node, NodeVariable, NodeVariableType, VariableTypeComponents} from "@/types/types";
import {Button} from "@/components/button";
import {InformationCircleIcon} from "@heroicons/react/24/outline";
import {Input} from "@/components/input";
import {Field, Fieldset, Label} from "@/components/fieldset";
import {
    getCategoryGradientBackgroundColor,
    getCategoryBorderColor,
    getCategoryTextColor,
    NodeSubType
} from "@/hooks/editor/nodes/useNodeColor";

type Props = React.ComponentPropsWithoutRef<"div"> & {
    toggleClose: () => void;
};

// This is a wrapper version of Dock without absolute positioning for use in tabs
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DockWrapper: React.FC<Props> = ({toggleClose, ...restProps}) => {
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const openedGroup = useNodesStore((state) => state.openedGroup);
    const nodes = useNodesStore((state) => state.nodes);
    const openDocs = useEditorStore((state) => state.openDocs);
    const setGroupNameOverride = useNodesStore((state) => state.setGroupNameOverride);
    // const setDocumentationType = useDocumentationStore((state) => state.setDocumentationType);


    const node: Node | null | undefined = selectedNodes.length === 1 ?
        nodes.find((n) => n.id === selectedNodes[0]) : null;

    const category = node?.category ?? '';
    const isNodeInService = useNodesStore((state) => state.isNodeInService([node?.id ?? ""]));
    const isService = !!node?.service?.id || isNodeInService;

    // Use neutral styling for individual dock variable types
    const categoryBorder = 'border border-zinc-950/20 dark:border-white/10';
    const categoryBackground = 'bg-white dark:bg-zinc-800 shadow-sm';
    const categoryGradientBackground = getCategoryGradientBackgroundColor(category, isService ? NodeSubType.Service : undefined);
    const categoryMainTextColor = getCategoryTextColor('main', category, isService ? NodeSubType.Service : undefined);
    const categorySubTextColor = getCategoryTextColor('sub', category, isService ? NodeSubType.Service : undefined);
    
    // Keep colored borders for container boxes (VariableGroup)
    const categoryContainerBorder = getCategoryBorderColor(category, isService ? NodeSubType.Service : undefined);

    const {group, variablesForGroup} = useVariablesForGroup(
        openedGroup || (node?.id ?? null),
        false
    );

    const groupNameOverrides: Record<string, string> = {};


    for (const node of nodes) {
        // Add node-level override for targetHandle === 'node'
        const nodeKey = `${node.id}::node`;
        groupNameOverrides[nodeKey] = node.group_name_override ?? '';

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

    // When no node is selected, return a centered message
    if (!node && !group) {
        return (
            <div {...restProps} className="h-full flex flex-col items-center pt-[150px]">
                <div className="bg-sky-50/50 dark:bg-zinc-800/50 rounded-lg px-4 py-3">
                    <div className="text-center text-zinc-500 dark:text-zinc-500 text-sm">
                        Select node for node fields
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            {...restProps}
            className="h-full flex flex-col gap-2 mb-2"
        >
            {node && <VariableGroup
                title={'Handle'}
                categoryBorderColor={categoryContainerBorder}
                categoryMainTextColor={categoryMainTextColor}
                categorySubTextColor={categorySubTextColor}
                categoryBackgroundColor={categoryBackground}
                categoryGradientBackgroundColor={categoryGradientBackground}
            >
                <NodeHandle node={node} categoryBorder={categoryBorder} />
            </VariableGroup>}

            {node && node.has_documentation && (
                <div className="px-2">
                    <Button color={'skyLight'} className="w-full" onClick={async () => {
                        if (!node?.type) return;
                        
                        try {
                            const nodeType = node.path.split('.').pop() || node.type;
                            const docData = await fetchNodeDocumentationAPI(nodeType);
                            openDocs(docData.content);
                        } catch (error) {
                            console.error('Failed to fetch node documentation:', error);
                        }
                    }}>
                        Documentation <InformationCircleIcon/>
                    </Button>
                </div>
            )}

            {isService && (
              <div className={`relative z-20 p-2`}>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                    This is a service, only the published variables are editable from the published variables form.
                </span>
            </div>
            )}

            {node && node.variables.length > 0 ? (
                node.variables.some((variable: NodeVariable) => variable.has_dock) ? (
                    <VariableGroup
                        title={node.name}
                        version={node.version || 0.0}
                        nodeId={node.id}
                        categoryBorderColor={categoryContainerBorder}
                        categoryMainTextColor={categoryMainTextColor}
                        categorySubTextColor={categorySubTextColor}
                        categoryBackgroundColor={categoryBackground}
                        categoryGradientBackgroundColor={categoryGradientBackground}
                        isService={isService}
                    >
                        {node.variables.map((variable: NodeVariable) => {
                            if (!variable.has_dock) return null;
                            const {baseType} = interpretNodeVariableType(variable);
                            const VariableComponent = VariableTypeComponents[baseType];


                            return VariableComponent ? (
                                <div key={node.id + '-' + variable.handle} className="min-w-0 overflow-hidden">
                                    <VariableComponent
                                        nodeId={node.id}
                                        variable={variable}
                                        publishedButton={true}
                                        inDock={true}
                                        categoryBorder={categoryBorder}
                                    />
                                </div>
                            ) : null;
                        })}
                    </VariableGroup>
                ) : (
                    <VariableGroup
                        title={node.name}
                        version={node.version || 0.0}
                        nodeId={node.id}
                        categoryBorderColor={categoryContainerBorder}
                        categoryMainTextColor={categoryMainTextColor}
                        categorySubTextColor={categorySubTextColor}
                        categoryBackgroundColor={categoryBackground}
                        categoryGradientBackgroundColor={categoryGradientBackground}
                        isService={isService}
                    >
                        <p className="text-zinc-400 text-sm italic p-4">
                            Node does not have variables that can be edited from the dock.
                        </p>
                    </VariableGroup>
                )
            ) : null}
            {group && (
                <>
                    <VariableGroup
                        title={group.name}
                        categoryBorderColor={categoryContainerBorder}
                        categoryMainTextColor={categoryMainTextColor}
                        categorySubTextColor={categorySubTextColor}
                        categoryBackgroundColor={categoryBackground}
                        categoryGradientBackgroundColor={categoryGradientBackground}
                        isService={isService}
                    >
                        <GroupName group={group}/>

                        {variablesForGroup?.inVariables && variablesForGroup?.inVariables.length > 0 && (
                            <VariableGroup
                                title="In Variables"
                                categoryBorderColor={categoryContainerBorder}
                                categoryMainTextColor={categoryMainTextColor}
                                categorySubTextColor={categorySubTextColor}
                                categoryBackgroundColor={categoryBackground}
                                categoryGradientBackgroundColor={categoryGradientBackground}
                            >
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
                                                        inDock={true}
                                                        categoryBorder={categoryBorder}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                            </VariableGroup>
                        )}

                        {variablesForGroup?.outVariables && variablesForGroup?.outVariables.length > 0 && (
                            <VariableGroup
                                title="Out Variables"
                                categoryBorderColor={categoryContainerBorder}
                                categoryMainTextColor={categoryMainTextColor}
                                categorySubTextColor={categorySubTextColor}
                                categoryBackgroundColor={categoryBackground}
                                categoryGradientBackgroundColor={categoryGradientBackground}
                            >
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
                                                        inDock={true}
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
        </div>
    );
};

export default DockWrapper;