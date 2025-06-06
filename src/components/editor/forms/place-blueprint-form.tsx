import React, { useState, useEffect } from "react";
import { Heading } from "@/components/heading";
import { Blueprint, Connection, Node, NodeVariable, NodeVariableType, Package } from "@/types/types";
import { Divider } from "@/components/divider";
import { unpackNode } from "@/utils/packageGroupNode";
import { Button } from "@/components/button";
import { globalToLocal } from "@/utils/positionUtils";
import useConnectionsStore from "@/stores/connectionsStore";
import useNodesStore from "@/stores/nodesStore";
import useEditorStore from "@/stores/editorStore";
import useBlueprintsStore from "@/stores/blueprintsStore";
import findPublishedVariables from "@/utils/findPublishedVariables";
import useDraggable from "@/hooks/editor/nodes/useDraggable";
import PublishedVariables from "@/components/editor/forms/variable/published-variables";
import {XMarkIcon} from "@heroicons/react/24/outline";

const PlaceBlueprintForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const openedGroup = useNodesStore((state) => state.openedGroup);
    const addNode = useNodesStore((state) => state.addNode);
    const addConnection = useConnectionsStore((state) => state.addConnection);
    const addNodeToGroup = useNodesStore((state) => state.addNodeToGroup);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const getBlueprint = useBlueprintsStore((state) => state.getBlueprint);
    const { startDraggingAfterPaste } = useDraggable();

    const blueprint: Blueprint | undefined = getBlueprint(formEditRecordId as string);
    const [variables, setVariables] = useState<{ [handle: string]: { [variableHandle: string]: NodeVariable[] } }>({});
    const [simpleVariables, setSimpleVariables] = useState<{ [handle: string]: { [variableHandle: string]: string } }>({});
    const [publishedVariables, setPublishedVariables] = useState<{ variable: NodeVariable; nodeId: string }[]>([]);
    const [secretVariables, setSecretVariables] = useState<{ key: string, value: string }[]>([]);
    const [unpackedNodes, setUnpackedNodes] = useState<Node[]>([]);
    const [unpackedConnections, setUnpackedConnections] = useState<Connection[]>([]);

    useEffect(() => {
        if (!blueprint || !blueprint.node_setup) return;

        const packagedData: Package = blueprint.node_setup.versions[0].content;
        if (!packagedData) return;

        const { nodes, connections } = unpackNode(packagedData);
        const { initialVariables, initialSimpleVariables } = findPublishedVariables(nodes);

        setVariables(initialVariables);
        setSimpleVariables(initialSimpleVariables);
        setUnpackedNodes(nodes);
        setUnpackedConnections(connections || []);
    // eslint-disable-next-line
    }, [blueprint]);

    if (!blueprint) return null;

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

        if (openedGroup && nodesToAdd.length > 0) {
            addNodeToGroup(openedGroup, nodesToAdd[0].id);
        }

        closeForm();

        startDraggingAfterPaste(
            nodesToAdd.map((n) => n.id)
        );
    };

    return (
        <form method="post" className="p-10">
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>{blueprint.name}</Heading>
                <Button type="button" onClick={() => closeForm()} color="sky">
                    <XMarkIcon className="w-5 h-5" />
                </Button>
            </div>
            <Divider className="my-4" soft bleed />

            <PublishedVariables
                nodes={unpackedNodes}
                variables={variables}
                setVariables={setVariables}
                simpleVariables={simpleVariables}
                setSimpleVariables={setSimpleVariables}
                publishedVariables={publishedVariables}
                setPublishedVariables={setPublishedVariables}
                secretVariables={secretVariables}
                setSecretVariables={setSecretVariables}
            />

            <Divider className="my-10" soft bleed />

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