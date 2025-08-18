'use client';

import React, {ReactElement, useState} from "react";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import {FormType, Blueprint, Fundamental, Node, Connection, Package} from "@/types/types";
import {PencilIcon, PlusIcon} from "@heroicons/react/24/outline";
import useBlueprintsStore from "@/stores/blueprintsStore";
import useEditorStore from "@/stores/editorStore";
import Link from "next/link";
import {globalToLocal} from "@/utils/positionUtils";
import {unpackNode} from "@/utils/packageGroupNode";
import useDraggable from "@/hooks/editor/nodes/useDraggable";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";

export default function BlueprintTree(): ReactElement {
    const closeForm = useEditorStore((state) => state.closeForm);
    const openedGroup = useNodesStore((state) => state.openedGroup);
    const blueprints = useBlueprintsStore((state) => state.blueprints);
    const openForm = useEditorStore((state) => state.openForm);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeBlueprintId = useEditorStore((state) => state.activeBlueprintId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const setIsExecuting = useEditorStore((state) => state.setIsExecuting);

    const addNode = useNodesStore((state) => state.addNode);
    const addConnection = useConnectionsStore((state) => state.addConnection);
    const addNodeToGroup = useNodesStore((state) => state.addNodeToGroup);

    const getBlueprint = useBlueprintsStore((state) => state.getBlueprint);
    const {startDraggingAfterPaste} = useDraggable();
    const [unpackedNodes, setUnpackedNodes] = useState<Node[]>([]);
    const [unpackedConnections, setUnpackedConnections] = useState<Connection[]>([]);


    const handleAdd = (blueprintId: string) => (e: React.MouseEvent) => {
        e.preventDefault();

        const blueprint: Blueprint | undefined = getBlueprint(blueprintId);

        if (!blueprint || !blueprint.node_setup) return;

        const packagedData: Package = blueprint.node_setup.versions[0].content;

        if (!packagedData) return;

        const {nodes, connections} = unpackNode(packagedData);

        setUnpackedNodes(nodes);
        setUnpackedConnections(connections || []);

        const position = globalToLocal(
            (e as React.MouseEvent).screenX,
            (e as React.MouseEvent).screenY
        );

        if (unpackedConnections.length > 0) {
            unpackedConnections.forEach((c) => addConnection(c));
        }

        const nodesToAdd = unpackedNodes.map((n) => {
            const nodeCopy = {...n, variables: [...n.variables]};

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
        <TreeList
            items={blueprints}
            title={`Blueprints`}
            activeItem={activeBlueprintId}
            formEditingItem={formEditRecordId as string}
            fundamental={Fundamental.Blueprint}
            dataTourId={"add-blueprint-button"}
            renderItem={(blueprint: Blueprint) => (
                <>
                    <Link
                        href={`/project/${activeProjectId}/blueprint/${blueprint.id}`}
                        title={`${blueprint.name} - ${blueprint.id}`}
                        onClick={() => {
                            // Set loading indicator immediately when user clicks  
                            useEditorStore.getState().setIsLoadingFlow(true);
                        }}
                        className={`block flex-1 truncate text-sky-500 dark:text-gray-200/80 dark:hover:text-white pt-1 pb-1 ${(activeBlueprintId === blueprint.id || formEditRecordId === blueprint.id) ? 'text-white' : 'dark:text-zinc-500'}`}
                    >
                        {blueprint.name}
                    </Link>
                    <div className="flex gap-0 mr-2">
                        <button
                            onClick={() => openForm(FormType.EditBlueprint, blueprint.id)}
                            type="button"
                            className={`p-2 rounded focus:outline-none active:text-zinc-200 group`}
                        >
                            <PencilIcon
                                className={`w-4 h-4 transition-colors duration-200 ${activeBlueprintId === blueprint.id || formEditRecordId === blueprint.id ? 'text-white' : 'text-sky-500 dark:text-white/70'}`}/>
                        </button>
                        <button
                            onClick={handleAdd(blueprint.id as string)}
                            type="button"
                            className={`pt-2 pb-2 rounded focus:outline-none active:text-zinc-200 group`}
                        >
                            <PlusIcon
                                className={`w-4 h-4 transition-colors duration-200 ${activeBlueprintId === blueprint.id || formEditRecordId === blueprint.id ? 'text-white' : 'text-sky-500 dark:text-white/70'}`}/>
                        </button>
                    </div>
                </>
            )}
            addButtonClick={() =>
                openForm(FormType.AddBlueprint)
            }
        />
    )
}