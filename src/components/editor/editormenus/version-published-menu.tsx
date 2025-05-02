'use client';

import React, {useEffect, useState} from 'react';
import {Select} from '@/components/select';
import {Button} from '@/components/button';
import useDynamicRoutesStore from '@/stores/dynamicRoutesStore';
import useSchedulesStore from '@/stores/schedulesStore';
import useEditorStore from '@/stores/editorStore';
import fetchAndApplyNodeSetup from '@/utils/fetchNodeSetup';
import SavingIndicator from '@/components/saving-indicator';
import useNodesStore from '@/stores/nodesStore';
import useConnectionsStore from '@/stores/connectionsStore';
import {FormType, Fundamental, Route, Schedule, State, StoreName} from '@/types/types';
import {
    createNodeSetupVersionDraftAPI,
    publishNodeSetupRouteVersionAPI,
    publishNodeSetupScheduleVersionAPI
} from '@/api/nodeSetupsApi';
import {fetchSchedule as fetchScheduleAPI} from '@/api/schedulesApi';
import {fetchDynamicRoute as fetchDynamicRouteAPI} from '@/api/dynamicRoutesApi';
import {ConfirmAlert} from '@/components/confirm-alert';
import {ArrowRightCircleIcon, Bars3Icon, BarsArrowDownIcon} from '@heroicons/react/24/outline';

type VersionPublishedMenuProps = { routeUuid?: string; scheduleUuid?: string };

export default function VersionPublishedMenu({routeUuid, scheduleUuid}: VersionPublishedMenuProps) {

    const nodes = useNodesStore((state) => state.nodes);
    const connections = useConnectionsStore((state) => state.connections);
    const latestStates: Record<StoreName, State> = {
        nodes,
        connections,
        groups: {groupStack: [], openedGroup: null}
    };

    const activeRouteId = useEditorStore((state) => state.activeRouteId);
    const activeScheduleId = useEditorStore((state) => state.activeScheduleId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const activeVersionId = useEditorStore((state) => state.activeVersionId);
    const setActiveVersionId = useEditorStore((state) => state.setActiveVersionId);
    const setIsDraft = useEditorStore((state) => state.setIsDraft);
    const setIsPublished = useEditorStore((state) => state.setIsPublished);
    const setIsExecuting = useEditorStore((state) => state.setIsExecuting);
    const isSaving = useEditorStore((state) => state.isSaving);
    const isPublished = useEditorStore((state) => state.isPublished);
    const openForm = useEditorStore((state) => state.openForm);

    // API stores
    const fetchDynamicRoutes = useDynamicRoutesStore((state) => state.fetchDynamicRoutes);
    const fetchSchedules = useSchedulesStore((state) => state.fetchSchedules);

    // Local UI state
    const [routeData, setRouteData] = useState<Route | null>(null);
    const [scheduleData, setScheduleData] = useState<Schedule | null>(null);
    const [showPublishAlert, setShowPublishAlert] = useState(false);
    const [showDraftAlert, setShowDraftAlert] = useState(false);

    // Fetch detailed data (incl. node_setup.versions) when IDs change
    useEffect(() => {
        if (!routeUuid) {
            setRouteData(null);
            return;
        }
        (async () => {
            const detail = await fetchDynamicRouteAPI(routeUuid);
            setRouteData(detail);
        })();
    }, [routeUuid]);

    useEffect(() => {
        if (!scheduleUuid) {
            setScheduleData(null);
            return;
        }
        (async () => {
            const detail = await fetchScheduleAPI(scheduleUuid);
            setScheduleData(detail);
        })();
    }, [scheduleUuid]);

    // Set activeVersionId once detailed data has loaded
    useEffect(() => {
        if (routeData?.node_setup?.versions?.length) {
            const highest = [...routeData.node_setup.versions]
                .sort((a, b) => b.version_number - a.version_number)[0];
            setActiveVersionId(highest.id);
        }
    }, [routeData, setActiveVersionId]);

    useEffect(() => {
        if (scheduleData?.node_setup?.versions?.length) {
            const highest = [...scheduleData.node_setup.versions]
                .sort((a, b) => b.version_number - a.version_number)[0];
            setActiveVersionId(highest.id);
        }
    }, [scheduleData, setActiveVersionId]);

    // Handlers
    const handleVersionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVid = e.target.value;
        if (scheduleUuid) {
            await fetchAndApplyNodeSetup({scheduleId: scheduleUuid, versionId: newVid});
        } else if (routeUuid) {
            await fetchAndApplyNodeSetup({routeId: routeUuid, versionId: newVid});
        }
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
            const updated = await fetchScheduleAPI(scheduleUuid);
            setScheduleData(updated);
            setActiveVersionId(response.new_version_id);
        } else if (routeUuid) {
            const response = await createNodeSetupVersionDraftAPI(
                activeRouteId as string,
                activeVersionId as string,
                activeProjectId as string,
                latestStates,
                Fundamental.Route
            );
            await fetchDynamicRoutes();
            const updated = await fetchDynamicRouteAPI(routeUuid);
            setRouteData(updated);
            setActiveVersionId(response.new_version_id);
        }
        setIsExecuting(null);
        setIsDraft(true);
        setIsPublished(false);
    };

    const handlePublish = async () => {
        setShowPublishAlert(false);
        setIsExecuting('Publishing to production...');
        if (scheduleUuid) {
            await publishNodeSetupScheduleVersionAPI(activeVersionId as string);
            await fetchSchedules();
            const updated = await fetchScheduleAPI(scheduleUuid);
            setScheduleData(updated);
        } else if (routeUuid) {
            await publishNodeSetupRouteVersionAPI(activeVersionId as string);
            await fetchDynamicRoutes();
            const updated = await fetchDynamicRouteAPI(routeUuid as string);
            setRouteData(updated);
        }
        setIsExecuting(null);
        setIsDraft(false);
        setIsPublished(true);
    };

    // Render only if we have detailed versions data
    if (!routeData?.node_setup?.versions && !scheduleData?.node_setup?.versions) {
        return null;
    }

    const versions =
        routeData?.node_setup?.versions || scheduleData?.node_setup?.versions || [];

    return (
        <div
            className="absolute bottom-5 right-5 flex items-center gap-2 p-2 bg-zinc-800 bg-opacity-80 border border-white/25 rounded-xl z-50">
            <Select value={activeVersionId} onChange={handleVersionChange}>
                {versions.map((v) => {
                    const label = [`v${v.version_number}`];
                    if (v.published) label.push('(published)');
                    if (!v.published && !v.draft) label.push('(history)');
                    if (v.draft) label.push('(draft)');
                    return (
                        <option key={v.id} value={v.id}>
                            {label.join(' ')}
                        </option>
                    );
                })}
            </Select>
            <Button plain title="Publish to production" disabled={isPublished} onClick={handlePublish}>
                <ArrowRightCircleIcon className="h-6 w-6"/>
            </Button>
            <Button plain title="Create a new draft" onClick={() => setShowDraftAlert(true)}>
                <BarsArrowDownIcon className="h-6 w-6"/>
            </Button>
            <Button plain title="Show the publish overview" onClick={() => openForm(FormType.ProjectPublish)}>
                <Bars3Icon className="h-6 w-6"/>
            </Button>
            <SavingIndicator isSaving={isSaving}/>

            <ConfirmAlert
                open={showPublishAlert}
                onClose={() => setShowPublishAlert(false)}
                onConfirm={handlePublish}
                title="This will publish the node setup to production?"
                description="Do you want to proceed?"
            />

            <ConfirmAlert
                open={showDraftAlert}
                onClose={() => setShowDraftAlert(false)}
                onConfirm={handleDraft}
                title="This will create a draft from the currently active node setup?"
                description="Do you want to proceed?"
            />
        </div>
    );
}
