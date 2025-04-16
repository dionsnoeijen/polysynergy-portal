import React, { useState, useEffect } from "react";
import useServicesStore from "@/stores/servicesStore";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";

import { Heading } from "@/components/heading";
import { Connection, Node, NodeVariable, NodeVariableType, Package, Service } from "@/types/types";
import { Divider } from "@/components/divider";
import { unpackNode } from "@/utils/packageGroupNode";
import { Button } from "@/components/button";
import { globalToLocal } from "@/utils/positionUtils";

import PublishedVariables from "@/components/editor/forms/variable/published-variables";
import {adjectives, animals, colors, uniqueNamesGenerator} from "unique-names-generator";

const PlaceServiceForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const openedGroup = useNodesStore((state) => state.openedGroup);
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

        setUnpackedNodes(nodes);
        setUnpackedConnections(connections || []);
    }, [service]);

    if (!service) return null;

    const handleSubmit = (e: React.MouseEvent) => {
        e.preventDefault();
        const position = globalToLocal(
            (e as React.MouseEvent).screenX,
            (e as React.MouseEvent).screenY
        );

        if (unpackedConnections.length > 0) {
            unpackedConnections.forEach((c) => {
                delete c.temp;
                addConnection(c)
            });
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

                delete nodeCopy.temp;

                nodeCopy.handle = uniqueNamesGenerator({dictionaries: [adjectives, animals, colors]});

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

        if (openedGroup && nodesToAdd.length > 0) {
            addNodeToGroup(openedGroup, nodesToAdd[0].id);
        }

        closeForm();
    };

    return (
        <form method="post" className="p-10">
            <Heading>{service.name}</Heading>
            <Divider className="my-10" soft bleed />

            <PublishedVariables
                nodes={unpackedNodes}
                variables={variables}
                setVariables={setVariables}
                simpleVariables={simpleVariables}
                setSimpleVariables={setSimpleVariables}
                publishedVariables={publishedVariables}
                setPublishedVariables={setPublishedVariables}
            />

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