'use client';

import React, {useEffect, useState} from 'react';
import { Select } from '@/components/select';
import { Button } from '@/components/button';
import useDynamicRoutesStore from '@/stores/dynamicRoutesStore';
import {ArrowRightCircleIcon, Bars3Icon, BarsArrowDownIcon} from '@heroicons/react/24/outline';
import {createNodeSetupVersionDraftAPI, publishNodeSetupRouteVersionAPI} from "@/api/nodeSetupsApi";
import useEditorStore from "@/stores/editorStore";
import fetchAndApplyNodeSetup from "@/utils/fetchNodeSetup";
import SavingIndicator from "@/components/saving-indicator";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import {FormType, State, StoreName} from "@/types/types";

type VersionPublishedMenuProps = { routeUuid?: string; };

export default function VersionPublishedMenu({ routeUuid }: VersionPublishedMenuProps) {
    const nodes = useNodesStore((state) => state.nodes);
    const connections = useConnectionsStore((state) => state.connections);
    const activeRouteId = useEditorStore((state) => state.activeRouteId);
    const openForm = useEditorStore((state) => state.openForm);

    const routes = useDynamicRoutesStore((state) => state.routes);
    const getDynamicRoute = useDynamicRoutesStore((state) => state.getDynamicRoute);
    const activeVersionId = useEditorStore((state) => state.activeVersionId);
    const fetchDynamicRoutes = useDynamicRoutesStore((state) => state.fetchDynamicRoutes);
    const setActiveVersionId = useEditorStore((state) => state.setActiveVersionId);
    const isSaving = useEditorStore((state) => state.isSaving);
    const isPublished = useEditorStore((state) => state.isPublished);

    const latestStates: Record<StoreName, State> = { nodes, connections };

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
        await fetchAndApplyNodeSetup({ routeId: routeUuid, versionId: newVersionId });
    };

    const handleDraftClick = async () => {
        setShowDraftAlert(true);
    };

    const handleDraft = async () => {
        const response = await createNodeSetupVersionDraftAPI(
            activeRouteId as string,
            activeVersionId as string,
            latestStates,
            'route'
        );
        await fetchDynamicRoutes();
        setActiveVersionId(response.new_version_id);
        setShowDraftAlert(false);
    }

    const handlePublishClick = async () => {
        setShowPublishAlert(true);
    };

    const handlePublish = async () => {
        await publishNodeSetupRouteVersionAPI(activeVersionId as string);
        setShowPublishAlert(false);
    }

    const routeData = getDynamicRoute(routeUuid as string);
    if (!routeData || !routeData.versions) {
        return null;
    }

    return (
        <div className="absolute bottom-5 right-5 flex items-center gap-2 p-2 bg-white/70 dark:bg-black/30 rounded shadow z-50">
            <Select value={activeVersionId} onChange={handleVersionChange}>
                {routeData.versions.map((version: {
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
                })}
            </Select>
            <Button disabled={isPublished} onClick={handlePublishClick}>
                <ArrowRightCircleIcon className="h-6 w-6" />
            </Button>
            <Button onClick={handleDraftClick} >
                <BarsArrowDownIcon className="h-6 w-6" />
            </Button>
            <Button onClick={() => openForm(FormType.ProjectPublish)}>
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