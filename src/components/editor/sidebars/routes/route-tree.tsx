import TreeList from "@/components/editor/sidebars/elements/tree-list";
import React, {ReactElement, useEffect} from "react";
import useDynamicRoutesStore from "@/stores/dynamicRoutesStore";
import {PencilIcon, PlusIcon} from "@heroicons/react/24/outline";
import {Button} from "@/components/button";
import useEditorStore from "@/stores/editorStore";
import {FormType} from "@/types/types";
import {formatSegments} from "@/utils/formatters";
import Link from "next/link";

export default function RouteTree(): ReactElement {

    const { routes, fetchDynamicRoutes } = useDynamicRoutesStore();
    const { openForm, formEditRecordId, activeRouteId, activeProjectId } = useEditorStore();

    useEffect(() => {
        fetchDynamicRoutes();
    }, [fetchDynamicRoutes]);

    return (
        <TreeList
            items={routes}
            title={`Routes`}
            activeItem={activeRouteId}
            formEditingItem={formEditRecordId}
            renderItem={(route) => (
                <>
                    <Link href={`/project/${activeProjectId}/route/${route.id}`}
                       title={`${route.method}}: /${formatSegments(route.segments)}`}
                       className={`block flex-1 truncate dark:hover:text-white pt-1 pb-1 ${(activeRouteId === route.id || formEditRecordId === route.id) ? 'dark:text-white' : 'dark:text-zinc-500'}`}
                    >
                        <b className="dark:text-white">{route.method}</b>: /{formatSegments(route.segments)}
                    </Link>
                    <button
                        onClick={() => openForm(FormType.EditRoute, route.id)}
                        type="button"
                        className={`p-2 rounded focus:outline-none active:text-zinc-200 group ${activeRouteId === route.id || formEditRecordId === route.id ? 'text-white' : 'text-zinc-500 '}`}
                    >
                        <PencilIcon className="w-4 h-4 transition-colors duration-200"/>
                    </button>
                </>
            )}
            addButton={
                <Button
                    onClick={() => openForm(FormType.AddRoute)}
                    plain
                    className="w-full hover:cursor-pointer rounded-tr-none rounded-tl-none after:rounded-tl-none after:rounded-tr-none p-0">
                    <PlusIcon/>
                </Button>
            }
        />
    )
}
