'use client';

import React, {useEffect, useState} from 'react';
import { Select } from '@/components/select';
import { Button } from '@/components/button';
import useDynamicRoutesStore from '@/stores/dynamicRoutesStore';
import {ArrowRightCircleIcon, Bars3Icon, BarsArrowDownIcon} from '@heroicons/react/24/outline';
import {
    createNodeSetupVersionDraftAPI,
    publishNodeSetupRouteVersionAPI,
    publishNodeSetupScheduleVersionAPI
} from "@/api/nodeSetupsApi";
import useEditorStore from "@/stores/editorStore";
import fetchAndApplyNodeSetup from "@/utils/fetchNodeSetup";
import SavingIndicator from "@/components/saving-indicator";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import {FormType, Fundamental, State, StoreName} from "@/types/types";
import useSchedulesStore from "@/stores/schedulesStore";

type VersionPublishedMenuProps = { routeUuid?: string; scheduleUuid?: string };

export default function VersionPublishedMenu({ routeUuid, scheduleUuid }: VersionPublishedMenuProps) {

    const nodes = useNodesStore((state) => state.nodes);
    const connections = useConnectionsStore((state) => state.connections);
    const activeRouteId = useEditorStore((state) => state.activeRouteId);
    const activeScheduleId = useEditorStore((state) => state.activeScheduleId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const openForm = useEditorStore((state) => state.openForm);

    const routes = useDynamicRoutesStore((state) => state.routes);
    const getDynamicRoute = useDynamicRoutesStore((state) => state.getDynamicRoute);
    const getSchedule = useSchedulesStore((state) => state.getSchedule);
    const activeVersionId = useEditorStore((state) => state.activeVersionId);
    const fetchDynamicRoutes = useDynamicRoutesStore((state) => state.fetchDynamicRoutes);
    const fetchSchedules = useSchedulesStore((state) => state.fetchSchedules);
    const setActiveVersionId = useEditorStore((state) => state.setActiveVersionId);
    const isSaving = useEditorStore((state) => state.isSaving);
    const isPublished = useEditorStore((state) => state.isPublished);

    const latestStates: Record<StoreName, State> = { 
        nodes, 
        connections,
        groups: {
            groupStack: [],
            openedGroup: null
        }
    };

    const [showPublishAlert, setShowPublishAlert] = useState(false);
    const [showDraftAlert, setShowDraftAlert] = useState(false);

    useEffect(() => {
        const routeData = getDynamicRoute(routeUuid as string);
        if (!routeData || !routeData.id) return;

        const highestVersion = routeData.versions
            ?.sort((a, b) => b.version_number - a.version_number)[0];

        setActiveVersionId(highestVersion?.id || '');
    }, [routeUuid, routes, getDynamicRoute, setActiveVersionId]);

    const handleVersionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVersionId = e.target.value;

        if (scheduleUuid) {
            await fetchAndApplyNodeSetup({ scheduleId: scheduleUuid, versionId: newVersionId });
            return;
        }

        await fetchAndApplyNodeSetup({ routeId: routeUuid, versionId: newVersionId });
    };

    const handleDraftClick = async () => {
        setShowDraftAlert(true);
    };

    const handleDraft = async () => {

        console.log('Handle draft', scheduleUuid, routeUuid);

        if (scheduleUuid) {
            const response = await createNodeSetupVersionDraftAPI(
                activeScheduleId as string,
                activeVersionId as string,
                activeProjectId as string,
                latestStates,
                Fundamental.Schedule
            );
            await fetchSchedules();
            setActiveVersionId(response.new_version_id);
        } else {
            const response = await createNodeSetupVersionDraftAPI(
                activeRouteId as string,
                activeVersionId as string,
                activeProjectId as string,
                latestStates,
                Fundamental.Route
            );
            await fetchDynamicRoutes();
            setActiveVersionId(response.new_version_id);
        }

        // setShowDraftAlert(false);
    }

    const handlePublishClick = async () => {
        setShowPublishAlert(true);
    };

    const handlePublish = async () => {
        if (scheduleUuid) {
            await publishNodeSetupScheduleVersionAPI(activeVersionId as string);
        } else {
            await publishNodeSetupRouteVersionAPI(activeVersionId as string);
        }
        setShowPublishAlert(false);
    }

    const routeData = getDynamicRoute(routeUuid as string);
    const scheduleData = getSchedule(scheduleUuid as string);

    if ((!routeData || !routeData.versions) && (!scheduleData || !scheduleData.versions)) {
        return null;
    }

    return (
        <div className="absolute bottom-5 right-5 flex items-center gap-2 p-2 bg-white/70 dark:bg-black/30 rounded shadow z-50">
            <Select value={activeVersionId} onChange={handleVersionChange}>
                {routeData ? routeData?.versions?.map((version: {
                    id: string;
                    version_number: number;
                    published: boolean;
                    draft: boolean;
                }) => {
                    const label = [ `v${version.version_number}`];

                    if (version.published) {
                        label.push('(published)');
                    }
                    if (!version.published && !version.draft) {
                        label.push('(history)');
                    }
                    if (version.draft) {
                        label.push('(draft)');
                    }

                    return (
                        <option key={version.id} value={version.id}>
                            {label.join(' ')}
                        </option>
                    );
                }): null}
                {scheduleData ? scheduleData?.versions?.map((version: {
                    id: string;
                    version_number: number;
                    published: boolean;
                    draft: boolean;
                }) => {
                    const label = [ `v${version.version_number}`];

                    if (version.published) {
                        label.push('(published)');
                    }
                    if (!version.published && !version.draft) {
                        label.push('(history)');
                    }
                    if (version.draft) {
                        label.push('(draft)');
                    }

                    return (
                        <option key={version.id} value={version.id}>
                            {label.join(' ')}
                        </option>
                    );
                }): null}
            </Select>
            <Button title="Publish to production" disabled={isPublished} onClick={handlePublishClick}>
                <ArrowRightCircleIcon className="h-6 w-6" />
            </Button>
            <Button title="Create a new draft" onClick={handleDraftClick} >
                <BarsArrowDownIcon className="h-6 w-6" />
            </Button>
            <Button title="Show the publish overview" onClick={() => openForm(FormType.ProjectPublish)}>
                <Bars3Icon className="h-6 w-6" />
            </Button>
            <SavingIndicator isSaving={isSaving} />

            {showPublishAlert && (
                <Alert size="md" className="text-center" open={showPublishAlert} onClose={() => setShowPublishAlert(false)}>
                    <AlertTitle>This will publish the node setup to production?</AlertTitle>
                    <AlertDescription>Do you want to proceed?</AlertDescription>
                    <AlertActions>
                        <Button onClick={() => setShowPublishAlert(false)} plain>
                            Cancel
                        </Button>
                        <Button color="red" onClick={handlePublish}>
                            Yes, publish
                        </Button>
                    </AlertActions>
                </Alert>
            )}

            {showDraftAlert && (
                <Alert size="md" className="text-center" open={showDraftAlert} onClose={() => setShowDraftAlert(false)}>
                    <AlertTitle>This will create a draft from the currently active node setup?</AlertTitle>
                    <AlertDescription>Do you want to proceed?</AlertDescription>
                    <AlertActions>
                        <Button onClick={() => setShowDraftAlert(false)} plain>
                            Cancel
                        </Button>
                        <Button color="red" onClick={handleDraft}>
                            Yes, create draft
                        </Button>
                    </AlertActions>
                </Alert>
            )}
        </div>
    );
}