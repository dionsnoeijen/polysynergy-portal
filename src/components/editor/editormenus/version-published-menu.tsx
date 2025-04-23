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
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import {FormType, Fundamental, Route, Schedule, State, StoreName} from "@/types/types";
import useSchedulesStore from "@/stores/schedulesStore";
import {ConfirmAlert} from "@/components/confirm-alert";

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
    const setIsPublished = useEditorStore((state) => state.setIsPublished);
    const setIsDraft = useEditorStore((state) => state.setIsDraft);
    const setIsExecuting = useEditorStore((state) => state.setIsExecuting);

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

    const [scheduleData, setScheduleData] = useState<Schedule|undefined|null>(null);
    const [routeData, setRouteData] = useState<Route|undefined|null>(null);

    useEffect(() => {
        if (!routeUuid && !scheduleUuid) return;

        let highestVersion = null;

        if (scheduleUuid) {
            const response = getSchedule(scheduleUuid as string);
            setScheduleData(response);
            if (!scheduleData || !scheduleData.id) return;
            highestVersion = scheduleData.versions
                ?.sort((a, b) => b.version_number - a.version_number)[0];
        }

        if (routeUuid) {
            const response = getDynamicRoute(routeUuid as string);
            setRouteData(response);
            if (!routeData || !routeData.id) return;
            highestVersion = routeData.versions
                ?.sort((a, b) => b.version_number - a.version_number)[0];
        }

        setActiveVersionId(highestVersion?.id || '');
    }, [routeUuid, routes, getDynamicRoute, setActiveVersionId, scheduleUuid, getSchedule, scheduleData, routeData]);

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
        setShowDraftAlert(false);
        setIsExecuting('Creating draft...');
        if (scheduleUuid) {
            const response = await createNodeSetupVersionDraftAPI(
                activeScheduleId as string,
                activeVersionId as string,
                activeProjectId as string,
                latestStates,
                Fundamental.Schedule
            );
            await fetchSchedules();
            const versionResponse = getSchedule(scheduleUuid as string);
            setScheduleData(versionResponse);
            console.log(versionResponse);
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
            const versionResponse = getDynamicRoute(routeUuid as string);
            setRouteData(versionResponse);
            setActiveVersionId(response.new_version_id);
        }

        setIsExecuting(null);
        setIsDraft(true);
        setIsPublished(false);
    }

    const handlePublishClick = async () => {
        setShowPublishAlert(true);
    };

    const handlePublish = async () => {
        setShowPublishAlert(false);
        setIsExecuting('Publishing to production...');
        if (scheduleUuid) {
            await publishNodeSetupScheduleVersionAPI(activeVersionId as string);
            await fetchSchedules();
            const versionResponse = getSchedule(scheduleUuid as string);
            setScheduleData(versionResponse);
        } else {
            await publishNodeSetupRouteVersionAPI(activeVersionId as string);
            await fetchDynamicRoutes();
            const versionResponse = getDynamicRoute(routeUuid as string);
            setRouteData(versionResponse);
        }
        setIsExecuting(null);
        setIsDraft(false);
        setIsPublished(true);
    }

    if ((!routeData || !routeData.versions) && (!scheduleData || !scheduleData.versions)) {
        return null;
    }

    return (
        <div className="absolute bottom-5 right-5 flex items-center gap-2 p-2 bg-zinc-800 bg-opacity-80 border border-white/25 rounded-xl z-50">
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
            <Button plain title="Publish to production" disabled={isPublished} onClick={handlePublishClick}>
                <ArrowRightCircleIcon className="h-6 w-6" />
            </Button>
            <Button plain title="Create a new draft" onClick={handleDraftClick} >
                <BarsArrowDownIcon className="h-6 w-6" />
            </Button>
            <Button plain title="Show the publish overview" onClick={() => openForm(FormType.ProjectPublish)}>
                <Bars3Icon className="h-6 w-6" />
            </Button>
            <SavingIndicator isSaving={isSaving} />

            <ConfirmAlert
                open={showPublishAlert}
                onClose={() => setShowPublishAlert(false)}
                onConfirm={handlePublish}
                title={'This will publish the node setup to production?'}
                description={'Do you want to proceed?'}
            />

            <ConfirmAlert
                open={showDraftAlert}
                onClose={() => setShowDraftAlert(false)}
                onConfirm={handleDraft}
                title={'This will create a draft from the currently active node setup?'}
                description={'Do you want to proceed?'}
            />
        </div>
    );
}