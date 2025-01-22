import React, {ReactElement, useEffect} from "react";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import {FormType, Service} from "@/types/types";
import {PencilIcon} from "@heroicons/react/24/outline";
import useServicesStore from "@/stores/servicesStore";
import useEditorStore from "@/stores/editorStore";

export default function ServiceTree(): ReactElement {
    const { services } = useServicesStore();
    const { openForm, formEditRecordId, activeServiceId, selectedNodes } = useEditorStore();

    const [addDisabled, setAddDisabled] = React.useState(true);

    useEffect(() => {
        setAddDisabled(!(selectedNodes.length === 1));

        // Fetch services
    }, [selectedNodes]);

    return (
        <TreeList
            items={services}
            title={`Services`}
            activeItem={activeServiceId}
            formEditingItem={formEditRecordId}
            renderItem={(service: Service) => (
                <>
                    {service.name}
                    <button
                        onClick={() => openForm(FormType.EditService, service.id)}
                        type="button"
                        className={`p-2 rounded focus:outline-none active:text-zinc-200 group ${activeServiceId === service.id || formEditRecordId === service.id ? 'text-white' : 'text-zinc-500 '}`}
                    >
                        <PencilIcon className="w-4 h-4 transition-colors duration-200"/>
                    </button>
                </>
            )}
            addDisabled={addDisabled}
            addButtonClick={() => openForm(FormType.AddService)}
        />
    )
}