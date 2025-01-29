import React, {ReactElement, useCallback, useEffect} from "react";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import {FormType, Node, Service} from "@/types/types";
import {PencilIcon, PlusIcon} from "@heroicons/react/24/outline";
import useServicesStore from "@/stores/servicesStore";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import {unpackNode} from "@/utils/packageNode";
import {globalToLocal} from "@/utils/positionUtils";

export default function ServiceTree(): ReactElement {
    const { services, fetchServices, getService } = useServicesStore();
    const {
        openForm,
        formEditRecordId,
        activeServiceId,
        selectedNodes,
        setAddingNode,
        openGroup
    } = useEditorStore();

    const { addConnection } = useConnectionsStore();
    const { addNode, addNodeToGroup } = useNodesStore();

    const [addDisabled, setAddDisabled] = React.useState(true);

    useEffect(() => {
        setAddDisabled(!(selectedNodes.length === 1));
    }, [selectedNodes]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const handleAddServiceAtPosition = useCallback((
        serviceId: string,
        screenX: number,
        screenY: number
    ) => {
        const service = getService(serviceId);
        if (!service) return null;
        let node: Node = service.node_setup.versions[0].content.nodes[0];
        if (!node) return null;

        const { nodes, connections } = unpackNode(node);

        const position = globalToLocal(screenX, screenY);

        if (connections) {
            connections.map((c) => addConnection(c));
        }

        node = nodes[0];
        setAddingNode(node.id);
        node.view = {
            x: position.x,
            y: position.y,
            width: 200,
            height: 200,
            disabled: false,
            adding: true,
            collapsed: false
        };

        nodes.map((n) => addNode(n));

        if (openGroup) {
            addNodeToGroup(openGroup, node.id);
        }

        console.log('nodes', nodes, 'connections', connections);
    }, []);

    return (
        <TreeList
            items={services}
            title={`Services`}
            activeItem={activeServiceId}
            formEditingItem={formEditRecordId}
            renderItem={(service: Service) => (
                <div className="flex justify-between items-center w-full">
                    <span className={`select-none`}>{service.name}</span>
                    <div className="flex gap-2 mr-2">
                        <button
                            onClick={() => openForm(FormType.EditService, service.id)}
                            type="button"
                            className={`pt-2 pb-2 rounded focus:outline-none active:text-zinc-200 group ${activeServiceId === service.id || formEditRecordId === service.id ? 'text-white' : 'text-zinc-500 '}`}
                        >
                            <PencilIcon className="w-4 h-4 transition-colors duration-200"/>
                        </button>
                        <button
                            onClick={(e) => {
                                handleAddServiceAtPosition(
                                    service.id as string,
                                    e.clientX,
                                    e.clientY,
                                );
                            }}
                            type="button"
                            className={`pt-2 pb-2 rounded focus:outline-none active:text-zinc-200 group ${activeServiceId === service.id || formEditRecordId === service.id ? 'text-white' : 'text-zinc-500 '}`}
                        >
                            <PlusIcon className="w-4 h-4 transition-colors duration-200"/>
                        </button>
                    </div>
                </div>
            )}
            addDisabled={addDisabled}
            addButtonClick={() => openForm(FormType.AddService)}
        />
    )
}