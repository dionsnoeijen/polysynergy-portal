import React, { useState } from "react";
import useEditorStore from "@/stores/editorStore";
import useDynamicRoutesStore from "@/stores/dynamicRoutesStore";
import useSchedulesStore from "@/stores/schedulesStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Heading, Subheading } from "@/components/heading";
import { Select } from "@/components/select";
import { formatSegments } from "@/utils/formatters";
import { Divider } from "@/components/divider";
import {
    ArrowRightCircleIcon,
    BarsArrowDownIcon,
    ArrowUturnLeftIcon,
    TrashIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";
import { Button } from "@/components/button";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";
import {
    createNodeSetupVersionDraftAPI,
    publishNodeSetupRouteVersionAPI,
    publishNodeSetupScheduleVersionAPI,
    unpublishNodeSetupRouteVersionAPI,
    unpublishNodeSetupScheduleVersionAPI
} from "@/api/nodeSetupsApi";
import {Route, Schedule} from "@/types/types";
import {fetchDynamicRoute} from "@/api/dynamicRoutesApi";
import {fetchSchedule} from "@/api/schedulesApi";

const ProjectPublishForm: React.FC = (): React.ReactElement => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);

    const routes = useDynamicRoutesStore((state) => state.routes);
    const deleteDynamicRoute = useDynamicRoutesStore((state) => state.deleteDynamicRoute);
    const fetchDynamicRoutes = useDynamicRoutesStore((state) => state.fetchDynamicRoutes);

    const schedules = useSchedulesStore((state) => state.schedules);
    const deleteSchedule = useSchedulesStore((state) => state.deleteSchedule);
    const fetchSchedules = useSchedulesStore((state) => state.fetchSchedules);

    const [showDeleteDynamicRouteAlert, setShowDeleteDynamicRouteAlert] = useState(false);
    const [showPublishDynamicRouteAlert, setShowPublishDynamicRouteAlert] = useState(false);
    const [showUnpublishDynamicRouteAlert, setShowUnpublishDynamicRouteAlert] = useState(false);
    const [showMakeDraftDynamicRouteAlert, setShowMakeDraftDynamicRouteAlert] = useState(false);
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

    const [showDeleteScheduleAlert, setShowDeleteScheduleAlert] = useState(false);
    const [showPublishScheduleAlert, setShowPublishScheduleAlert] = useState(false);
    const [showUnpublishScheduleAlert, setShowUnpublishScheduleAlert] = useState(false);
    const [showMakeDraftScheduleAlert, setShowMakeDraftScheduleAlert] = useState(false);
    const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

    const [selectedVersions, setSelectedVersions] = useState<{ [key: string]: string }>(
        routes.reduce((acc, route: Route) => {
            const versions = route.versions ?? [];
            const publishedVersion = versions.find((version) => version.published);
            acc[route?.id as string] = publishedVersion?.id || (versions.length > 0 ? versions[0].id : "");
            return acc;
        }, {} as { [key: string]: string })
    );

    const [selectedScheduleVersions, setSelectedScheduleVersions] = useState<{ [key: string]: string }>(
        schedules.reduce((acc, schedule: Schedule) => {
            const versions = schedule.versions ?? [];
            const publishedVersion = versions.find((version) => version.published);
            acc[schedule?.id as string] = publishedVersion?.id || (versions.length > 0 ? versions[0].id : "");
            return acc;
        }, {} as { [key: string]: string })
    );

    const handleVersionChange = (routeId: string, versionId: string) => {
        setSelectedVersions((prev) => ({
            ...prev,
            [routeId]: versionId,
        }));
    };

    const handleScheduleVersionChange = (scheduleId: string, versionId: string) => {
        setSelectedScheduleVersions((prev) => ({
            ...prev,
            [scheduleId]: versionId,
        }));
    };

    const handleDeleteDynamicRouteClick = (routeId: string) => {
        setSelectedRouteId(routeId);
        setShowDeleteDynamicRouteAlert(true);
    }

    const handleDeleteDynamicRoute = async () => {
        setShowDeleteDynamicRouteAlert(false);
        await deleteDynamicRoute(selectedRouteId as string);
    }

    const handlePublishDynamicRouteClick = (routeId: string) => {
        setSelectedRouteId(routeId);
        setShowPublishDynamicRouteAlert(true);
    }

    const handlePublishDynamicRoute = async () => {
        const nodeSetupVersionId = selectedVersions[selectedRouteId as string] as string;
        await publishNodeSetupRouteVersionAPI(nodeSetupVersionId as string);
        await fetchDynamicRoutes();
        setShowPublishDynamicRouteAlert(false);
    }

    const handleUnpublishDynamicRouteClick = (routeId: string) => {
        setSelectedRouteId(routeId);
        setShowUnpublishDynamicRouteAlert(true);
    }

    const handleUnpublishDynamicRoute = async () => {
        const nodeSetupVersionId = selectedVersions[selectedRouteId as string] as string;
        await unpublishNodeSetupRouteVersionAPI(nodeSetupVersionId as string);
        await fetchDynamicRoutes();
        setShowUnpublishDynamicRouteAlert(false);
    }

    const handleMakeDraftDynamicRouteClick = (routeId: string) => {
        setSelectedRouteId(routeId);
        setShowMakeDraftDynamicRouteAlert(true);
    }

    const handleMakeDraftDynamicRoute = async () => {
        const routeId = selectedRouteId as string;
        const nodeSetupVersionId = selectedVersions[routeId];

        console.log("Drafting route:", routeId, "with version:", nodeSetupVersionId);

        const route: Route = await fetchDynamicRoute(routeId);
        const version = route?.node_setup?.versions.find((v) => v.id === nodeSetupVersionId);

        if (!version) {
            console.error("No version found for route", routeId);
            return;
        }

        await createNodeSetupVersionDraftAPI(
            routeId,
            nodeSetupVersionId,
            activeProjectId,
            version.content,
            'route'
        );
        await fetchDynamicRoutes();
        setShowMakeDraftDynamicRouteAlert(false);
    };

    const handleDeleteScheduleClick = (scheduleId: string) => {
        setSelectedScheduleId(scheduleId);
        setShowDeleteScheduleAlert(true);
    };

    const handleDeleteSchedule = async () => {
        setShowDeleteScheduleAlert(false);
        await deleteSchedule(selectedScheduleId as string);
    };

    const handlePublishScheduleClick = (scheduleId: string) => {
        setSelectedScheduleId(scheduleId);
        setShowPublishScheduleAlert(true);
    };

    const handlePublishSchedule = async () => {
        const nodeSetupVersionId = selectedScheduleVersions[selectedScheduleId as string] as string;
        await publishNodeSetupScheduleVersionAPI(nodeSetupVersionId as string);
        await fetchSchedules();
        setShowPublishScheduleAlert(false);
    };

    const handleUnpublishScheduleClick = (scheduleId: string) => {
        setSelectedScheduleId(scheduleId);
        setShowUnpublishScheduleAlert(true);
    };

    const handleUnpublishSchedule = async () => {
        const nodeSetupVersionId = selectedScheduleVersions[selectedScheduleId as string] as string;
        await unpublishNodeSetupScheduleVersionAPI(nodeSetupVersionId as string);
        await fetchSchedules();
        setShowUnpublishScheduleAlert(false);
    };

    const handleMakeDraftScheduleClick = (scheduleId: string) => {
        setSelectedScheduleId(scheduleId);
        setShowMakeDraftScheduleAlert(true);
    };

    const handleMakeDraftSchedule = async () => {
        const scheduleId = selectedScheduleId as string;
        const nodeSetupVersionId = selectedScheduleVersions[scheduleId];

        const schedule: Schedule = await fetchSchedule(scheduleId);
        const version = schedule?.node_setup?.versions.find((v) => v.id === nodeSetupVersionId);

        if (!version) {
            return;
        }

        await createNodeSetupVersionDraftAPI(
            scheduleId,
            nodeSetupVersionId,
            activeProjectId,
            version.content,
            'schedule'
        );
        await fetchSchedules();
        setShowMakeDraftScheduleAlert(false);
    };

    return (
        <section className="p-10">
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>Project Publish</Heading>
                <Button type="button" onClick={() => closeForm()} plain>
                    <XMarkIcon className="w-5 h-5" />
                </Button>
            </div>
            <Divider className="my-4" soft bleed />

            <Subheading className="ml-2 mb-4">Routes</Subheading>

            <Table dense bleed grid>
                <TableHead>
                    <TableRow>
                        <TableHeader className="w-3/4">Route</TableHeader>
                        <TableHeader className="w-[25%]">Version</TableHeader>
                        <TableHeader className="w-[25%]">Actions</TableHeader>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {routes.map((route, index) => {
                        const selectedVersion = route?.versions?.find((v) => v.id === selectedVersions[route?.id as string]);

                        return (
                            <TableRow key={`route-${index}`}>
                                <TableCell>
                                    <strong>{route.method}:</strong> /{formatSegments(route.segments)}
                                </TableCell>
                                <TableCell>
                                    <Select
                                        value={selectedVersions[route?.id as string]}
                                        onChange={(e) => handleVersionChange(route?.id as string, e.target.value)}
                                    >
                                        {route?.versions?.map((version) => (
                                            <option key={version.id} value={version.id}>
                                                v{version.version_number}
                                                {version.draft ? " (Draft)" : ""}
                                                {version.published ? " (Published)" : ""}
                                                {!version.draft && !version.published ? " (History)" : ""}
                                            </option>
                                        ))}
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <div className="flex space-x-2">
                                        <Button color={'green'} title="Publish" disabled={selectedVersion?.published} onClick={() => handlePublishDynamicRouteClick(route.id as string)}>
                                            <ArrowRightCircleIcon className="h-4 w-4" />
                                        </Button>
                                        <Button color={'yellow'} title="Unpublish" disabled={!selectedVersion?.published} onClick={() => handleUnpublishDynamicRouteClick(route.id as string)}>
                                            <ArrowUturnLeftIcon className="h-4 w-4" />
                                        </Button>
                                        <Button title="Make draft" onClick={() => handleMakeDraftDynamicRouteClick(route.id as string)}>
                                            <BarsArrowDownIcon className="h-4 w-4" />
                                        </Button>
                                        <Button color={'red'} title="Delete" onClick={() => handleDeleteDynamicRouteClick(route.id as string)}>
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            <Divider className="my-10" soft bleed />

            <Subheading className="ml-2 mb-4">Schedules</Subheading>

            <Table dense bleed grid>
                <TableHead>
                    <TableRow>
                        <TableHeader className="w-3/4">Schedule</TableHeader>
                        <TableHeader className="w-[25%]">Version</TableHeader>
                        <TableHeader className="w-[25%]">Actions</TableHeader>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {schedules.map((schedule, index) => {
                        const scheduleKey = schedule.id as string;
                        const selectedVersion = schedule?.versions?.find((v) => v.id === selectedScheduleVersions[scheduleKey]);

                        return (
                            <TableRow key={`schedule-${index}`}>
                                <TableCell>
                                    <strong>{schedule.name}</strong>
                                </TableCell>
                                <TableCell>
                                    <Select
                                        value={selectedScheduleVersions[scheduleKey]}
                                        onChange={(e) => handleScheduleVersionChange(scheduleKey, e.target.value)}
                                    >
                                        {schedule?.versions?.map((version) => (
                                            <option key={version.id} value={version.id}>
                                                v{version.version_number}
                                                {version.draft ? " (Draft)" : ""}
                                                {version.published ? " (Published)" : ""}
                                                {!version.draft && !version.published ? " (History)" : ""}
                                            </option>
                                        ))}
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <div className="flex space-x-2">
                                        <Button color={'green'} title="Publish" disabled={selectedVersion?.published} onClick={() => handlePublishScheduleClick(scheduleKey)}>
                                            <ArrowRightCircleIcon className="h-4 w-4" />
                                        </Button>
                                        <Button color={'yellow'} title="Unpublish" disabled={!selectedVersion?.published} onClick={() => handleUnpublishScheduleClick(scheduleKey)}>
                                            <ArrowUturnLeftIcon className="h-4 w-4" />
                                        </Button>
                                        <Button title="Make draft" onClick={() => handleMakeDraftScheduleClick(scheduleKey)}>
                                            <BarsArrowDownIcon className="h-4 w-4" />
                                        </Button>
                                        <Button color={'red'} title="Delete" onClick={() => handleDeleteScheduleClick(scheduleKey)}>
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            <div className="flex justify-end gap-4 mt-10">
                <Button type="button" onClick={() => closeForm()} plain>
                    Cancel
                </Button>
            </div>

            <Alert size="md" className="text-center" open={showDeleteDynamicRouteAlert} onClose={() => setShowDeleteDynamicRouteAlert(false)}>
                <AlertTitle>Are you sure you want to delete this route?</AlertTitle>
                <AlertDescription>This will permanently delete the route.</AlertDescription>
                <AlertActions>
                    <Button onClick={() => setShowDeleteDynamicRouteAlert(false)} plain>
                        Cancel
                    </Button>
                    <Button color="red" onClick={handleDeleteDynamicRoute}>
                        Yes, delete
                    </Button>
                </AlertActions>
            </Alert>

            <Alert size="md" className="text-center" open={showPublishDynamicRouteAlert} onClose={() => setShowPublishDynamicRouteAlert(false)}>
                <AlertTitle>Are you sure you want to publish this route?</AlertTitle>
                <AlertDescription>This will publish the route to production.</AlertDescription>
                <AlertActions>
                    <Button onClick={() => setShowPublishDynamicRouteAlert(false)} plain>
                        Cancel
                    </Button>
                    <Button color="red" onClick={handlePublishDynamicRoute}>
                        Yes, publish
                    </Button>
                </AlertActions>
            </Alert>

            <Alert size="md" className="text-center" open={showUnpublishDynamicRouteAlert} onClose={() => setShowUnpublishDynamicRouteAlert(false)}>
                <AlertTitle>Are you sure you want to unpublish this route?</AlertTitle>
                <AlertDescription>This will unpublish the route from production.</AlertDescription>
                <AlertActions>
                    <Button onClick={() => setShowUnpublishDynamicRouteAlert(false)} plain>
                        Cancel
                    </Button>
                    <Button color="red" onClick={handleUnpublishDynamicRoute}>
                        Yes, unpublish
                    </Button>
                </AlertActions>
            </Alert>

            <Alert size="md" className="text-center" open={showMakeDraftDynamicRouteAlert} onClose={() => setShowMakeDraftDynamicRouteAlert(false)}>
                <AlertTitle>Are you sure you want to make a draft of this route?</AlertTitle>
                <AlertDescription>This will create a draft from the currently active route.</AlertDescription>
                <AlertActions>
                    <Button onClick={() => setShowMakeDraftDynamicRouteAlert(false)} plain>
                        Cancel
                    </Button>
                    <Button color="red" onClick={handleMakeDraftDynamicRoute}>
                        Yes, make draft
                    </Button>
                </AlertActions>
            </Alert>

            <Alert size="md" className="text-center" open={showDeleteScheduleAlert} onClose={() => setShowDeleteScheduleAlert(false)}>
                <AlertTitle>Are you sure you want to delete this schedule?</AlertTitle>
                <AlertDescription>This will permanently delete the schedule.</AlertDescription>
                <AlertActions>
                    <Button onClick={() => setShowDeleteScheduleAlert(false)} plain>
                        Cancel
                    </Button>
                    <Button color="red" onClick={handleDeleteSchedule}>
                        Yes, delete
                    </Button>
                </AlertActions>
            </Alert>

            <Alert size="md" className="text-center" open={showPublishScheduleAlert} onClose={() => setShowPublishScheduleAlert(false)}>
                <AlertTitle>Are you sure you want to publish this schedule?</AlertTitle>
                <AlertDescription>This will publish the schedule to production.</AlertDescription>
                <AlertActions>
                    <Button onClick={() => setShowPublishScheduleAlert(false)} plain>
                        Cancel
                    </Button>
                    <Button color="red" onClick={handlePublishSchedule}>
                        Yes, publish
                    </Button>
                </AlertActions>
            </Alert>

            <Alert size="md" className="text-center" open={showUnpublishScheduleAlert} onClose={() => setShowUnpublishScheduleAlert(false)}>
                <AlertTitle>Are you sure you want to unpublish this schedule?</AlertTitle>
                <AlertDescription>This will unpublish the schedule from production.</AlertDescription>
                <AlertActions>
                    <Button onClick={() => setShowUnpublishScheduleAlert(false)} plain>
                        Cancel
                    </Button>
                    <Button color="red" onClick={handleUnpublishSchedule}>
                        Yes, unpublish
                    </Button>
                </AlertActions>
            </Alert>

            <Alert size="md" className="text-center" open={showMakeDraftScheduleAlert} onClose={() => setShowMakeDraftScheduleAlert(false)}>
                <AlertTitle>Are you sure you want to make a draft of this schedule?</AlertTitle>
                <AlertDescription>This will create a draft from the currently active schedule.</AlertDescription>
                <AlertActions>
                    <Button onClick={() => setShowMakeDraftScheduleAlert(false)} plain>
                        Cancel
                    </Button>
                    <Button color="red" onClick={handleMakeDraftSchedule}>
                        Yes, make draft
                    </Button>
                </AlertActions>
            </Alert>
        </section>
    );
};

export default ProjectPublishForm;