'use client';

import React, { useEffect, useState } from 'react';
import { Select } from '@/components/select';
import { Button } from '@/components/button';
import useDynamicRoutesStore from '@/stores/dynamicRoutesStore';
import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import {publishNodeSetupVersionAPI} from "@/api/nodeSetupsApi";

type VersionPublishedMenuProps = {
    routeUuid?: string;
};

export default function VersionPublishedMenu({ routeUuid }: VersionPublishedMenuProps) {
    const routes = useDynamicRoutesStore((state) => state.routes);
    const getDynamicRoute = useDynamicRoutesStore((state) => state.getDynamicRoute);
    const [selectedVersionId, setSelectedVersionId] = useState<string>('');

    useEffect(() => {
        const routeData = getDynamicRoute(routeUuid as string);
        if (!routeData || !routeData.id) return;

        const highestVersion = routeData.versions
            ?.sort((a, b) => b.version_number - a.version_number)[0];

        setSelectedVersionId(highestVersion?.id || '');
    }, [routeUuid, routes, getDynamicRoute]);

    const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVersionId = e.target.value;
        setSelectedVersionId(newVersionId);
    };

    const handlePublish = () => {
        publishNodeSetupVersionAPI(selectedVersionId);
    };

    const routeData = getDynamicRoute(routeUuid as string);
    if (!routeData || !routeData.versions) {
        return null;
    }

    return (
        <div className="absolute bottom-5 right-5 flex items-center gap-2 p-2 bg-white/70 dark:bg-black/30 rounded shadow z-50">
            <Select value={selectedVersionId} onChange={handleVersionChange}>
                {routeData.versions.map((version: { id: string; version_number: number; published: boolean }) => {
                    const label = version.published
                        ? `v${version.version_number} (published)`
                        : `v${version.version_number}`;
                    return (
                        <option key={version.id} value={version.id}>
                            {label}
                        </option>
                    );
                })}
            </Select>
            <Button onClick={handlePublish}>
                <ArrowRightCircleIcon />
            </Button>
        </div>
    );
}