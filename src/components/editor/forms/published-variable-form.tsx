import {Heading} from "@/components/heading";
import {Divider} from "@/components/divider";
import React, {useEffect, useState} from "react";
import {Button} from "@/components/button";
import {Fundamental} from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useDynamicRoutesStore from "@/stores/dynamicRoutesStore";
import useSchedulesStore from "@/stores/schedulesStore";
import useServicesStore from "@/stores/servicesStore";
import useConfigsStore from "@/stores/configsStore";
import useBlueprintsStore from "@/stores/blueprintsStore";

const PublishedVariableForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);

    const getNodesToRender = useNodesStore((state) => state.getNodesToRender);

    const activeRouteId = useEditorStore((state) => state.activeRouteId);
    const activeScheduleId = useEditorStore((state) => state.activeScheduleId);
    const activeServiceId = useEditorStore((state) => state.activeServiceId);
    const activeConfigId = useEditorStore((state) => state.activeConfigId);
    const activeBlueprintId = useEditorStore((state) => state.activeBlueprintId);

    const getDynamicRoute = useDynamicRoutesStore((state) => state.getDynamicRoute);
    const getSchedule = useSchedulesStore((state) => state.getSchedule);
    const getService = useServicesStore((state) => state.getService);
    const getConfig = useConfigsStore((state) => state.getConfig);
    const getBlueprint = useBlueprintsStore((state) => state.getBlueprint);

    const [error, setError] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<any>(null);
    const [activeFundamental, setActiveFundamental] = useState<Fundamental|null>(null);

    useEffect(() => {
        if (!activeRouteId && !activeScheduleId && !activeServiceId && !activeConfigId && !activeBlueprintId) {
            setError('No active route');
        }
        let activeItem = null;
        if (activeRouteId) {
            activeItem = getDynamicRoute(activeRouteId);
            setActiveFundamental(Fundamental.Route);
        } else if (activeScheduleId) {
            activeItem = getSchedule(activeScheduleId);
            setActiveFundamental(Fundamental.Schedule);
        } else if (activeServiceId) {
            activeItem = getService(activeServiceId);
            setActiveFundamental(Fundamental.Service);
        } else if (activeConfigId) {
            activeItem = getConfig(activeConfigId);
            setActiveFundamental(Fundamental.Config);
        } else if (activeBlueprintId) {
            activeItem = getBlueprint(activeBlueprintId);
            setActiveFundamental(Fundamental.Blueprint);
        }

        setActiveItem(activeItem);
    }, [
        activeBlueprintId,
        activeConfigId,
        activeRouteId,
        activeScheduleId,
        activeServiceId,
        getBlueprint,
        getConfig,
        getDynamicRoute,
        getSchedule,
        getService
    ]);

    const handleCancel = (e: React.FormEvent) => {
        e.preventDefault();

        closeForm();
    };

    return (
        <form method={'post'} className={'p-10'}>
            <Heading>{
                activeFundamental &&
                activeFundamental.charAt(0).toUpperCase() +
                activeFundamental.slice(1)
            }: {activeItem?.name}</Heading>
            <Divider className="my-10" soft bleed />

            <div className="flex justify-end gap-4">
                {error && (
                    <div className="text-red-500">
                        {error}
                    </div>
                )}
                <Button type="button" onClick={handleCancel} plain>
                    Cancel
                </Button>
                <Button type="submit">
                    Save
                </Button>
            </div>
        </form>
    )
};

export default PublishedVariableForm;