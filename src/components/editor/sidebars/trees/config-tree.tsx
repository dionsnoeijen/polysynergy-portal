import React, {ReactElement, useEffect} from "react";
import {PencilIcon, PlusIcon} from "@heroicons/react/24/outline";
import {Config, FormType, Fundamental} from "@/types/types";
import useConfigsStore from "@/stores/configsStore";
import useEditorStore from "@/stores/editorStore";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import Link from "next/link";

export default function ConfigTree(): ReactElement {
    const configs = useConfigsStore((state) => state.configs);
    const fetchConfigs = useConfigsStore((state) => state.fetchConfigs);
    const openForm = useEditorStore((state) => state.openForm);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeConfigId = useEditorStore((state) => state.activeConfigId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);

    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    return (
        <TreeList
            items={configs}
            title={`Configs`}
            activeItem={activeConfigId}
            formEditingItem={formEditRecordId}
            fundamental={Fundamental.Config}
            renderItem={(config: Config) => (
                <div className={`flex justify-between items-center w-full`}>
                    <Link
                        href={`/project/${activeProjectId}/config/${config.id}`}
                        title={`${config.name} - ${config.id}`}
                        className={`block flex-1 truncate dark:text-gray-200/80 dark:hover:text-white pt-1 pb-1 ${(activeConfigId === config.id || formEditRecordId === config.id) ? 'dark:text-zinc-800' : 'dark:text-zinc-200'}`}
                    >
                        {config.name}
                    </Link>
                    <div className="flex gap-2 mr-2">
                        <button
                            onClick={() => openForm(FormType.EditConfig, config.id)}
                            type="button"
                            className={`p-2 rounded focus:outline-none active:text-zinc-200 group ${activeConfigId === config.id || formEditRecordId === config.id ? 'text-zinc-800' : 'text-white'}`}
                        >
                            <PencilIcon className="w-4 h-4 transition-colors duration-200"/>
                        </button>
                        <button
                            onClick={() => openForm(FormType.PlaceConfig, config.id)}
                            type="button"
                            className={`pt-2 pb-2 rounded focus:outline-none active:text-zinc-200 group ${activeConfigId === config.id || formEditRecordId === config.id ? 'text-zinc-800' : 'text-white'}`}
                        >
                            <PlusIcon className="w-4 h-4 transition-colors duration-200"/>
                        </button>
                    </div>
                </div>
            )}
            addButtonClick={() => openForm(FormType.AddConfig)}
        />
    );
}