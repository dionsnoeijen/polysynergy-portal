import React, {ReactElement, useEffect} from "react";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import {FormType, Service} from "@/types/types";
import {PencilIcon, PlusIcon} from "@heroicons/react/24/outline";
import useServicesStore from "@/stores/servicesStore";
import useEditorStore from "@/stores/editorStore";

export default function ServiceTree(): ReactElement {
    const services = useServicesStore((state) => state.services);
    const fetchServices = useServicesStore((state) => state.fetchServices);
    const openForm = useEditorStore((state) => state.openForm);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeServiceId = useEditorStore((state) => state.activeServiceId);
    const selectedNodes = useEditorStore((state) => state.selectedNodes);

    const [addDisabled, setAddDisabled] = React.useState(true);

    useEffect(() => {
        setAddDisabled(!(selectedNodes.length === 1));
    }, [selectedNodes]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

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
                            onClick={() => openForm(FormType.PlaceService, service.id)}
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