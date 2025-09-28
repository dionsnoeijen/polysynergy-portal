import React, {ReactElement, useEffect, useRef, useState} from "react";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import {FormType, Fundamental, Service, Node} from "@/types/types";
import {PencilIcon, PlusIcon} from "@heroicons/react/24/outline";
import useServicesStore from "@/stores/servicesStore";
import useEditorStore from "@/stores/editorStore";
import findTopLevelGroup from "@/utils/findTopLevelGroup";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import placeService from "@/utils/placeService";
import { fetchServiceById } from "@/api/servicesApi";

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

    const getNodesByServiceHandleAndVariant = useNodesStore((state) => state.getNodesByServiceHandleAndVariant);
    const addNode = useNodesStore((state) => state.addNode);
    const addConnection = useConnectionsStore((state) => state.addConnection);
    const openedGroup = useNodesStore((state) => state.openedGroup);
    const addNodeToGroup = useNodesStore((state) => state.addNodeToGroup);

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

    const mousePos = useRef({x: 0, y: 0});

    /* track global muispositie zodat we die hebben in onClick */
    useEffect(() => {
        const handler = (e: MouseEvent) => (mousePos.current = {x: e.screenX, y: e.screenY});
        window.addEventListener("mousemove", handler);
        return () => window.removeEventListener("mousemove", handler);
    }, []);

    const placeServiceHandler = async (serviceId: string) => {
        try {
            const activeProjectId = useEditorStore.getState().activeProjectId;
            if (!activeProjectId) {
                console.error("No active project ID");
                return;
            }

            // Fetch full service details with node_setup data
            const serviceWithDetails = await fetchServiceById(serviceId, activeProjectId);
            if (!serviceWithDetails) {
                console.error("Failed to fetch service details");
                return;
            }

            placeService({
                service: serviceWithDetails,
                mouseScreenXY: mousePos.current,
                addNode,
                addConnection,
                getNodesByServiceHandleAndVariant,
                openedGroup,
                addNodeToGroup,
            });

            // eventueel UI-state resetten
            clearTempNodes();
            clearTempConnections();
            setSelectedNodes([]);
        } catch (error) {
            console.error("Failed to place service:", error);
        }
    };

    return (
        <TreeList
            items={services}
            title={`Services`}
            activeItem={activeServiceId}
            formEditingItem={formEditRecordId as string}
            fundamental={Fundamental.Service}
            toggleOpen={() => {
                setAddDisabled(!(selectedNodes.length === 1))
            }}
            dataTourId={"add-service-button"}
            renderItem={(service: Service) => (
                <div className="flex justify-between items-center w-full">
                    <span
                        className={`select-none truncate text-sky-500 dark:text-gray-200/80 dark:hover:text-white`}>{service.name}</span>
                    <div className="flex gap-2 mr-2">
                        <button
                            onClick={() => handleEditService(service)}
                            type="button"
                            className={`pt-2 pb-2 rounded focus:outline-none active:text-zinc-200 group ${activeServiceId === service.id || formEditRecordId === service.id ? 'text-white' : 'text-sky-500 dark:text-white/70'}`}
                        >
                            <PencilIcon className="w-4 h-4 transition-colors duration-200"/>
                        </button>
                        <button
                            onClick={() => placeServiceHandler(service.id as string)}
                            type="button"
                            className={`pt-2 pb-2 rounded focus:outline-none active:text-zinc-200 group ${activeServiceId === service.id || formEditRecordId === service.id ? 'text-white' : 'text-sky-500 dark:text-white/70'}`}
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