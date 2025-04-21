import React, {ReactElement, useEffect, useState} from "react";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import {FormType, Fundamental, Service, Node} from "@/types/types";
import {PencilIcon, PlusIcon} from "@heroicons/react/24/outline";
import useServicesStore from "@/stores/servicesStore";
import useEditorStore from "@/stores/editorStore";
import findTopLevelGroup from "@/utils/findTopLevelGroup";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";

export default function ServiceTree(): ReactElement {
    const services = useServicesStore((state) => state.services);
    const openForm = useEditorStore((state) => state.openForm);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeServiceId = useEditorStore((state) => state.activeServiceId);
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const addTempNodes = useNodesStore((state) => state.addTempNodes);
    const clearTempNodes = useNodesStore((state) => state.clearTempNodes);
    const clearTempConnections = useConnectionsStore((state) => state.clearTempConnections);
    const addTempConnections = useConnectionsStore((state) => state.addTempConnections);
    const setSelectedNodes = useEditorStore((state) => state.setSelectedNodes);

    const [addDisabled, setAddDisabled] = useState(true);

    useEffect(() => {
        setAddDisabled(!(selectedNodes.length === 1));
    }, [selectedNodes]);

    const handleEditService = (service: Service) => {
        const serviceNodes = service.node_setup.versions[0].content.nodes;
        const serviceConnections = service.node_setup.versions[0].content.connections;
        let topLevelNode: Partial<Node> = findTopLevelGroup(serviceNodes);

        if (!topLevelNode && serviceNodes.length === 1) {
            topLevelNode = {id: serviceNodes[0].id};
        }

        if (!topLevelNode) {
            return;
        }

        clearTempNodes();
        clearTempConnections();

        addTempNodes(serviceNodes);
        addTempConnections(serviceConnections);
        setSelectedNodes([topLevelNode.id as string]);

        openForm(FormType.EditService, service.id);
    };

    return (
        <TreeList
            items={services}
            title={`Services`}
            activeItem={activeServiceId}
            formEditingItem={formEditRecordId}
            fundamental={Fundamental.Service}
            toggleOpen={() => {setAddDisabled(!(selectedNodes.length === 1))}}
            renderItem={(service: Service) => (
                <div className="flex justify-between items-center w-full">
                    <span className={`select-none`}>{service.name}</span>
                    <div className="flex gap-2 mr-2">
                        <button
                            onClick={() => handleEditService(service)}
                            type="button"
                            className={`pt-2 pb-2 rounded focus:outline-none active:text-zinc-200 group ${activeServiceId === service.id || formEditRecordId === service.id ? 'text-gray-800' : 'text-white'}`}
                        >
                            <PencilIcon className="w-4 h-4 transition-colors duration-200"/>
                        </button>
                        <button
                            onClick={() => openForm(FormType.PlaceService, service.id)}
                            type="button"
                            className={`pt-2 pb-2 rounded focus:outline-none active:text-zinc-200 group ${activeServiceId === service.id || formEditRecordId === service.id ? 'text-gray-800' : 'text-white'}`}
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