import React, { useState, useEffect } from "react";
import useServicesStore from "@/stores/servicesStore";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import { Heading, Subheading } from "@/components/heading";
import {Connection, Node, NodeVariable, NodeVariableType, Package, Service} from "@/types/types";
import { Divider } from "@/components/divider";
import { unpackNode } from "@/utils/packageGroupNode";
import { Button } from "@/components/button";
import { globalToLocal } from "@/utils/positionUtils";
import EditDictVariable from "@/components/editor/forms/variable/edit-dict-variable";
import { Text } from "@/components/text";
import { VariableTypeComponents } from "@/components/editor/sidebars/dock";
import interpretNodeVariableType from "@/utils/interpretNodeVariableType";

const PlaceServiceForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const openGroup = useEditorStore((state) => state.openGroup);
    const addNode = useNodesStore((state) => state.addNode);
    const addNodeToGroup = useNodesStore((state) => state.addNodeToGroup);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const addConnection = useConnectionsStore((state) => state.addConnection);
    const getService = useServicesStore((state) => state.getService);

    const service: Service | undefined = getService(formEditRecordId as string);
    const [variables, setVariables] = useState<{ [nodeId: string]: { [handle: string]: NodeVariable[] } }>({});
    const [simpleVariables, setSimpleVariables] = useState<{ [nodeId: string]: { [handle: string]: string } }>({});
    const [publishedVariables, setPublishedVariables] = useState<{ variable: NodeVariable; nodeId: string }[]>([]);
    const [unpackedNodes, setUnpackedNodes] = useState<Node[]>([]);
    const [unpackedConnections, setUnpackedConnections] = useState<Connection[]>([]);

    useEffect(() => {
        if (!service) return;

        const packagedData: Package = service.node_setup.versions[0].content;
        if (!packagedData) return;

        const { nodes, connections } = unpackNode(packagedData);
        const initialVariables: { [nodeId: string]: { [handle: string]: NodeVariable[] } } = {};
        const initialSimpleVariables: { [nodeId: string]: { [handle: string]: string } } = {};
        const pubVariables: { variable: NodeVariable; nodeId: string }[] = [];

        nodes.forEach((node) => {
            const dictVariables = node.variables.filter(
                (variable) => variable.published && variable.type === NodeVariableType.Dict
            );
            const otherVariables = node.variables.filter(
                (variable) => variable.published && variable.type !== NodeVariableType.Dict
            );
            if (dictVariables.length > 0) {
                initialVariables[node.id] = {};
                dictVariables.forEach((variable) => {
                    initialVariables[node.id][variable.handle] = (variable.value as NodeVariable[]) || [];
                    pubVariables.push({ variable, nodeId: node.id });
                });
            }
            if (otherVariables.length > 0) {
                initialSimpleVariables[node.id] = {};
                otherVariables.forEach((variable) => {
                    initialSimpleVariables[node.id][variable.handle] = (variable.value as string) || "";
                    pubVariables.push({ variable, nodeId: node.id });
                });
            }
        });

        setVariables(initialVariables);
        setSimpleVariables(initialSimpleVariables);
        setPublishedVariables(pubVariables);
        setUnpackedNodes(nodes);
        setUnpackedConnections(connections || []);
    }, [service]);

    if (!service) return null;

    const handleVariableChange = (nodeId: string, updatedVariables: NodeVariable[], handle?: string) => {
        if (!handle) return;
        setVariables((prev) => ({
            ...prev,
            [nodeId]: {
                ...prev[nodeId],
                [handle]: updatedVariables,
            },
        }));
    };

    const handleSimpleVariableChange = (nodeId: string, handle: string, value: string) => {
        setSimpleVariables((prev) => ({
            ...prev,
            [nodeId]: {
                ...prev[nodeId],
                [handle]: value,
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

        const nodesToAdd =
            unpackedNodes.map((n, index) => {
                const nodeCopy = { ...n, variables: [...n.variables] };

                publishedVariables.forEach(({ variable, nodeId }) => {
                    if (nodeCopy.id === nodeId) {
                        const targetVariable = nodeCopy.variables.find((v) => v.handle === variable.handle);
                        if (targetVariable) {
                            if (variable.type === NodeVariableType.Dict && variables[nodeId]?.[variable.handle]) {
                                targetVariable.value = variables[nodeId][variable.handle];
                            } else if (simpleVariables[nodeId]?.[variable.handle] !== undefined) {
                                targetVariable.value = simpleVariables[nodeId][variable.handle];
                            }
                        }
                    }
                });

                nodeCopy.view = {
                    x: nodeCopy.view.x + position.x,
                    y: nodeCopy.view.y + position.y,
                    width: 200,
                    height: 200,
                    disabled: false,
                    adding: index === unpackedNodes.length - 1, // The last node is the top service node
                    collapsed: false,
                };

                return nodeCopy;
            });

        nodesToAdd.forEach((n) => addNode(n));

        if (openGroup && nodesToAdd.length > 0) {
            addNodeToGroup(openGroup, nodesToAdd[0].id);
        }

        closeForm();

    };

    return (
        <form method="post" className="p-10">
            <Heading>{service.name}</Heading>
            <Divider className="my-10" soft bleed />

            {publishedVariables.map(({ variable, nodeId }) => {
                const { baseType } = interpretNodeVariableType(variable);
                if (baseType === NodeVariableType.Dict) {
                    return (
                        <div key={nodeId + "-" + variable.handle}>
                            <Subheading>{`${variable.published_title}`}</Subheading>
                            {variable.published_description && (
                                <div className="mb-4 rounded-md border border-white/10 p-4">
                                    <Text dangerouslySetInnerHTML={{ __html: variable.published_description }} />
                                </div>
                            )}
                            <EditDictVariable
                                title={`${variable.handle}`}
                                onlyValues={true}
                                variables={variables[nodeId]?.[variable.handle] || []}
                                handle={variable.handle}
                                onChange={(updatedVariables, handle) =>
                                    handleVariableChange(nodeId, updatedVariables, handle)
                                }
                            />
                            <Divider className="my-10" soft bleed />
                        </div>
                    );
                } else {
                    const VariableComponent = VariableTypeComponents[baseType];
                    return VariableComponent ? (
                        <div key={nodeId + "-" + variable.handle}>
                            <Subheading>{`${variable.published_title}`}</Subheading>
                            {variable.published_description && (
                                <div className="mb-4 rounded-md border border-white/10 p-4">
                                    <Text dangerouslySetInnerHTML={{ __html: variable.published_description }} />
                                </div>
                            )}
                            <VariableComponent
                                nodeId={nodeId}
                                variable={variable}
                                publishedButton={false}
                                // @ts-expect-error - @todo: Test this form and fix the typing
                                onChange={(value) => handleSimpleVariableChange(nodeId, variable.handle, value)}
                                currentValue={simpleVariables[nodeId]?.[variable.handle]}
                            />
                            <Divider className="my-10" soft bleed />
                        </div>
                    ) : null;
                }
            })}

            <div className="flex justify-end gap-4 p-10">
                <Button type="button" onClick={() => closeForm()} plain>
                    Cancel
                </Button>
                <Button type="submit" onClick={(e: React.MouseEvent) => handleSubmit(e)}>Place</Button>
            </div>
        </form>
    );
};

export default PlaceServiceForm;