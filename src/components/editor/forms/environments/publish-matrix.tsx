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
} from "@/api/nodeSetupsApi";
import {Stage, PublishMatrixRoute} from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import {formatSegments} from "@/utils/formatters";

const PublishMatrix: React.FC = () => {
    const activeProjectId = useEditorStore((state) => state.activeProjectId);

    const [routes, setRoutes] = useState<PublishMatrixRoute[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const {routes, stages} = await fetchPublishMatrixAPI(activeProjectId);
            setRoutes(routes);
            setStages(stages);
        } catch (error) {
            console.error("Failed to fetch publish matrix:", error);
        } finally {
            setLoading(false);
        }
    }, [activeProjectId]);

    const handlePublish = async (routeId: string, stage: string) => {
        await publishNodeSetupRouteVersionAPI(routeId, stage);
        await fetchData();
    };

    const handleUnpublish = async (routeId: string, stage: string) => {
        await unpublishNodeSetupRouteVersionAPI(routeId, stage);
        await fetchData();
    };

    const handleUpdate = async (routeId: string, stage: string) => {
        await updateNodeSetupRouteVersionAPI(routeId, stage);
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
                        <TableHeader className="w-1/2">Route</TableHeader>
                        {stages.map((stage) => (
                            <TableHeader key={stage.id} className="text-center">
                                {stage.name}
                            </TableHeader>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {routes.map((route) => {
                        return (
                            <TableRow key={route.id}>
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
                                                        onClick={() => handleUnpublish(route.id, stage.name)}
                                                        title="Unpublish this route"
                                                    >
                                                        <ArrowUturnLeftIcon className="w-3.5 h-3.5"/>
                                                    </Button>
                                                    {needsUpdate && (
                                                        <Button
                                                            color="blue"
                                                            onClick={() => handleUpdate(route.id, stage.name)}
                                                            title="Update code in this stage"
                                                        >
                                                            <ArrowPathIcon className="w-3.5 h-3.5"/>
                                                        </Button>
                                                    )}
                                                </>
                                            ) : (
                                                <Button
                                                    onClick={() => handlePublish(route.id, stage.name)}
                                                    title="Publish this route"
                                                >
                                                    <ArrowRightCircleIcon className="w-3.5 h-3.5"/>
                                                </Button>
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </section>
    );
};

export default PublishMatrix;