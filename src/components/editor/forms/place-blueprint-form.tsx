import React, { useState, useEffect } from "react";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import { Heading, Subheading } from "@/components/heading";
import { Blueprint, Connection, Node, NodeVariable, NodeVariableType, Package } from "@/types/types";
import { Divider } from "@/components/divider";
import { unpackNode } from "@/utils/packageGroupNode";
import { Button } from "@/components/button";
import { globalToLocal } from "@/utils/positionUtils";
import { Text } from "@/components/text";
import { VariableTypeComponents } from "@/components/editor/sidebars/dock";
import interpretNodeVariableType from "@/utils/interpretNodeVariableType";
import useBlueprintsStore from "@/stores/blueprintsStore";
import findPublishedVariables from "@/utils/findPublishedVariables";
import useDraggable from "@/hooks/editor/nodes/useDraggable";
import EditDictVariable from "@/components/editor/forms/variable/edit-dict-variable";

const PlaceBlueprintForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const openGroup = useEditorStore((state) => state.openGroup);
    const addNode = useNodesStore((state) => state.addNode);
    const addNodeToGroup = useNodesStore((state) => state.addNodeToGroup);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const addConnection = useConnectionsStore((state) => state.addConnection);
    const getBlueprint = useBlueprintsStore((state) => state.getBlueprint);
    const { startDraggingAfterPaste } = useDraggable();

    const blueprint: Blueprint | undefined = getBlueprint(formEditRecordId as string);
    const [variables, setVariables] = useState<{ [handle: string]: { [variableHandle: string]: NodeVariable[] } }>({});
    const [simpleVariables, setSimpleVariables] = useState<{ [handle: string]: { [variableHandle: string]: string } }>({});
    const [publishedVariablesByHandle, setPublishedVariablesByHandle] = useState<{ [handle: string]: { variables: NodeVariable[], nodeIds: string[] } }>({});
    const [unpackedNodes, setUnpackedNodes] = useState<Node[]>([]);
    const [unpackedConnections, setUnpackedConnections] = useState<Connection[]>([]);

    useEffect(() => {
        if (!blueprint || !blueprint.node_setup) return;

        const packagedData: Package = blueprint.node_setup.versions[0].content;
        if (!packagedData) return;

        const { nodes, connections } = unpackNode(packagedData);
        const { initialVariables, initialSimpleVariables, variablesByHandle } = findPublishedVariables(nodes);

        setVariables(initialVariables);
        setSimpleVariables(initialSimpleVariables);
        setPublishedVariablesByHandle(variablesByHandle);
        setUnpackedNodes(nodes);
        setUnpackedConnections(connections || []);
    // eslint-disable-next-line
    }, [blueprint]);

    if (!blueprint) return null;

    const handleVariableChange = (handle: string, updatedVariables: NodeVariable[], variableHandle: string) => {
        setVariables((prev) => ({
            ...prev,
            [handle]: {
                ...prev[handle],
                [variableHandle]: updatedVariables,
            },
        }));
    };

    const handleSimpleVariableChange = (handle: string, variableHandle: string, value: string) => {
        setSimpleVariables((prev) => ({
            ...prev,
            [handle]: {
                ...prev[handle],
                [variableHandle]: value,
            },
        }));
    };

    const handleSubmit = (e: React.MouseEvent) => {
        e.preventDefault();
        const position = globalToLocal(
            (e as React.MouseEvent).screenX,
            (e as React.MouseEvent).screenY
        );

        if (unpackedConnections.length > 0) {
            unpackedConnections.forEach((c) => addConnection(c));
        }

        const nodesToAdd = unpackedNodes.map((n) => {
            const nodeCopy = { ...n, variables: [...n.variables] };
            const handle = n.handle;

            nodeCopy.variables.forEach((variable) => {
                if (variable.published) {
                    if (variable.type === NodeVariableType.Dict && variables[handle]?.[variable.handle]) {
                        variable.value = variables[handle][variable.handle];
                    } else if (simpleVariables[handle]?.[variable.handle] !== undefined) {
                        variable.value = simpleVariables[handle][variable.handle];
                    }
                }
            });

            nodeCopy.view = {
                x: nodeCopy.view.x + position.x,
                y: nodeCopy.view.y + position.y,
                width: 200,
                height: 200,
                disabled: false,
                adding: false,
                collapsed: false,
            };

            return nodeCopy;
        });

        nodesToAdd.forEach((n) => addNode(n));

        if (openGroup && nodesToAdd.length > 0) {
            addNodeToGroup(openGroup, nodesToAdd[0].id);
        }

        closeForm();

        startDraggingAfterPaste(
            0,
            0,
            nodesToAdd.map((n) => n.id)
        );
    };

    return (
        <form method="post" className="p-10">
            <Heading>{blueprint.name}</Heading>
            <Divider className="my-10" soft bleed />

            {Object.entries(publishedVariablesByHandle).map(([handle, { variables }]) => (
                variables.map((variable) => {
                    const { baseType } = interpretNodeVariableType(variable);
                    if (baseType === NodeVariableType.Dict) {
                        return (
                            <div key={handle + "-" + variable.handle}>
                                <Subheading>{`${variable.published_title}`}</Subheading>
                                {variable.published_description && (
                                    <div className="mb-4 rounded-md border border-white/10 p-4">
                                        <Text dangerouslySetInnerHTML={{ __html: variable.published_description }} />
                                    </div>
                                )}
                                <EditDictVariable
                                    title={`${variable.handle}`}
                                    onlyValues={true}
                                    // @ts-expect-error - @todo: Test this form and fix the typing
                                    variables={(variables[handle] ?? {})[variable.handle] || []}
                                    handle={variable.handle}
                                    onChange={(updatedVariables, variableHandle) =>
                                        // @ts-expect-error - @todo: Test this form and fix the typing
                                        handleVariableChange(handle, updatedVariables, variableHandle)
                                    }
                                />
                                <Divider className="my-10" soft bleed />
                            </div>
                        );
                    } else {
                        const VariableComponent = VariableTypeComponents[baseType];
                        return VariableComponent ? (
                            <div key={handle + "-" + variable.handle}>
                                <Subheading>{`${variable.published_title}`}</Subheading>
                                {variable.published_description && (
                                    <div className="mb-4 rounded-md border border-white/10 p-4">
                                        <Text dangerouslySetInnerHTML={{ __html: variable.published_description }} />
                                    </div>
                                )}
                                <VariableComponent
                                    nodeId={""} // Niet meer nodig
                                    variable={variable}
                                    publishedButton={false}
                                    // @ts-expect-error - @todo: Test this form and fix the typing
                                    onChange={(value) => handleSimpleVariableChange(handle, variable.handle, value)}
                                    currentValue={simpleVariables[handle]?.[variable.handle]}
                                />
                                <Divider className="my-10" soft bleed />
                            </div>
                        ) : null;
                    }
                })
            ))}

            <div className="flex justify-end gap-4 p-10">
                <Button type="button" onClick={() => closeForm()} plain>
                    Cancel
                </Button>
                <Button type="submit" onClick={(e: React.MouseEvent) => handleSubmit(e)}>Place</Button>
            </div>
        </form>
    );
};

export default PlaceBlueprintForm;