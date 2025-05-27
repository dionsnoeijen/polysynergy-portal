import React, {useCallback, useEffect, useState} from "react";
import {
    Table,
    TableHead,
    TableRow,
    TableHeader,
    TableBody,
    TableCell,
} from "@/components/table";
import {Button} from "@/components/button";
import {
    ArrowUturnLeftIcon,
    ArrowRightCircleIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";

import {fetchPublishMatrixAPI} from "@/api/publishApi";
import {
    publishNodeSetupRouteVersionAPI,
    unpublishNodeSetupRouteVersionAPI,
    updateNodeSetupRouteVersionAPI,
    publishNodeSetupScheduleVersionAPI,
    unpublishNodeSetupScheduleVersionAPI,
    updateNodeSetupScheduleVersionAPI,
} from "@/api/nodeSetupsApi";
import {Stage, PublishMatrixRoute, PublishMatrixSchedule} from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import {formatSegments} from "@/utils/formatters";

const PublishMatrix: React.FC = () => {
    const activeProjectId = useEditorStore((state) => state.activeProjectId);

    const [routes, setRoutes] = useState<PublishMatrixRoute[]>([]);
    const [schedules, setSchedules] = useState<PublishMatrixSchedule[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const {routes, schedules, stages} = await fetchPublishMatrixAPI(activeProjectId);
            setRoutes(routes);
            setSchedules(schedules);
            setStages(stages);
        } catch (error) {
            console.error("Failed to fetch publish matrix:", error);
        } finally {
            setLoading(false);
        }
    }, [activeProjectId]);

    const handleRoutePublish = async (routeId: string, stage: string) => {
        await publishNodeSetupRouteVersionAPI(routeId, stage);
        await fetchData();
    };

    const handleRouteUnpublish = async (routeId: string, stage: string) => {
        await unpublishNodeSetupRouteVersionAPI(routeId, stage);
        await fetchData();
    };

    const handleRouteUpdate = async (routeId: string, stage: string) => {
        await updateNodeSetupRouteVersionAPI(routeId, stage);
        await fetchData();
    };

    const handleSchedulePublish = async (scheduleId: string, stage: string) => {
        await publishNodeSetupScheduleVersionAPI(scheduleId, stage);
        await fetchData();
    };

    const handleScheduleUnpublish = async (scheduleId: string, stage: string) => {
        await unpublishNodeSetupScheduleVersionAPI(scheduleId, stage);
        await fetchData();
    };

    const handleScheduleUpdate = async (scheduleId: string, stage: string) => {
        await updateNodeSetupScheduleVersionAPI(scheduleId, stage);
        await fetchData();
    };

    useEffect(() => {
        if (activeProjectId) {
            fetchData();
        }
    }, [activeProjectId, fetchData]);

    if (loading) {
        return <p>Loading matrix...</p>;
    }

    return (
        <section>
            <Table className="mt-6" dense bleed grid>
                <TableHead>
                    <TableRow>
                        <TableHeader>Routes</TableHeader>
                        {stages.map((stage) => (
                            <TableHeader key={stage.id} className="text-center w-1">
                                {stage.name}
                            </TableHeader>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {routes.map((route) => (
                        <TableRow key={`route-${route.id}`}>
                            <TableCell className="font-semibold text-white">
                                {formatSegments(route.segments)}
                            </TableCell>
                            {stages.map((stage) => {
                                const isPublished = route.published_stages.includes(stage.name);
                                const needsUpdate = route.stages_can_update?.includes(stage.name);
                                return (
                                    <TableCell key={stage.id} className="text-center space-x-1">
                                        {isPublished ? (
                                            <>
                                                <Button
                                                    color="yellow"
                                                    onClick={() => handleRouteUnpublish(route.id, stage.name)}
                                                    title="Unpublish this route"
                                                >
                                                    <ArrowUturnLeftIcon className="w-3.5 h-3.5"/>
                                                </Button>
                                                {needsUpdate && (
                                                    <Button
                                                        color="blue"
                                                        onClick={() => handleRouteUpdate(route.id, stage.name)}
                                                        title="Update code in this stage"
                                                    >
                                                        <ArrowPathIcon className="w-3.5 h-3.5"/>
                                                    </Button>
                                                )}
                                            </>
                                        ) : (
                                            <Button
                                                onClick={() => handleRoutePublish(route.id, stage.name)}
                                                title="Publish this route"
                                            >
                                                <ArrowRightCircleIcon className="w-3.5 h-3.5"/>
                                            </Button>
                                        )}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Table className="mt-6" dense bleed grid>
                <TableHead>
                    <TableRow>
                        <TableHeader>Schedules</TableHeader>
                        <TableHeader className={'w-1'}>Is active</TableHeader>
                        {stages.map((stage) => (
                            <TableHeader key={stage.id} className="text-center w-1">
                                {stage.name}
                            </TableHeader>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {schedules.map((schedule) => (
                        <TableRow key={`schedule-${schedule.id}`}>
                            <TableCell className="font-semibold text-white">
                                Schedule: {schedule.name} ({schedule.cron_expression})
                            </TableCell>
                            <TableCell>
                                Is active
                            </TableCell>
                            {stages.map((stage) => {
                                const isPublished = schedule.published_stages.includes(stage.name);
                                const needsUpdate = schedule.stages_can_update?.includes(stage.name);
                                return (
                                    <TableCell key={stage.id} className="text-center space-x-1">
                                        {isPublished ? (
                                            <>
                                                <Button
                                                    color="yellow"
                                                    onClick={() => handleScheduleUnpublish(schedule.id, stage.name)}
                                                    title="Unpublish this schedule"
                                                >
                                                    <ArrowUturnLeftIcon className="w-3.5 h-3.5"/>
                                                </Button>
                                                {needsUpdate && (
                                                    <Button
                                                        color="blue"
                                                        onClick={() => handleScheduleUpdate(schedule.id, stage.name)}
                                                        title="Update code in this stage"
                                                    >
                                                        <ArrowPathIcon className="w-3.5 h-3.5"/>
                                                    </Button>
                                                )}
                                            </>
                                        ) : (
                                            <Button
                                                onClick={() => handleSchedulePublish(schedule.id, stage.name)}
                                                title="Publish this schedule"
                                            >
                                                <ArrowRightCircleIcon className="w-3.5 h-3.5"/>
                                            </Button>
                                        )}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </section>
    );
};

export default PublishMatrix;