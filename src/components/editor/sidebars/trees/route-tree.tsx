import TreeList from "@/components/editor/sidebars/elements/tree-list";
import React, {ReactElement} from "react";
import {PencilIcon} from "@heroicons/react/24/outline";
import {formatSegments} from "@/utils/formatters";
import {FormType, Fundamental} from "@/types/types";
import useDynamicRoutesStore from "@/stores/dynamicRoutesStore";
import useEditorStore from "@/stores/editorStore";
import Link from "next/link";

export default function RouteTree(): ReactElement {
    const routes = useDynamicRoutesStore((state) => state.routes);
    const openForm = useEditorStore((state) => state.openForm);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeRouteId = useEditorStore((state) => state.activeRouteId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const setIsExecuting = useEditorStore((state) => state.setIsExecuting);

    return (
        <TreeList
            items={routes}
            title={`Routes`}
            activeItem={activeRouteId}
            formEditingItem={formEditRecordId as string}
            fundamental={Fundamental.Route}
            dataTourId="add-route-button"
            renderItem={(route) => (
                <>
                    <Link
                        href={`/project/${activeProjectId}/route/${route.id}`}
                        onClick={() => {
                            setIsExecuting('Loading Route')
                        }}
                        title={`${route.method}: /${formatSegments(route.segments)} - ${route.id}`}
                        className={`block flex-1 truncate text-sky-500 dark:text-gray-200/80 dark:hover:text-white pt-1 pb-1 ${(activeRouteId === route.id || formEditRecordId === route.id) ? 'text-white' : 'dark:text-zinc-500'}`}
                    >
                        <b className={`${(activeRouteId === route.id || formEditRecordId === route.id) ? 'text-white' : 'dark:text-gray-200/80'}`}>{route.method}</b>:
                        /{formatSegments(route.segments)}
                    </Link>
                    <button
                        onClick={() => openForm(FormType.EditRoute, route.id)}
                        type="button"
                        className={`p-2 rounded focus:outline-none active:text-zinc-200 group`}
                        data-tour-id="add-route-button"
                    >
                        <PencilIcon className={`w-4 h-4 transition-colors duration-200 ${activeRouteId === route.id || formEditRecordId === route.id ? 'text-white' : 'text-sky-500 dark:text-white/70 '}`}/>
                    </button>
                </>
            )}
            addButtonClick={() => openForm(FormType.AddRoute)}
        />
    )
}
