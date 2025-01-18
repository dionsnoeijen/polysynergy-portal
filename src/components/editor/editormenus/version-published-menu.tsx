'use client';

import React, {useEffect, useState} from 'react';
import {Select} from "@/components/select";
import {Button} from "@/components/button";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import {Route, NodeSetupVersion} from "@/types/types";
import {Text} from "@/components/text";

type VersionPublishedMenuProps = {
    routeData?: Route;
};

export default function VersionPublishedMenu({routeData}: VersionPublishedMenuProps) {
    const {editingRouteVersions, setEditingRouteVersion} = useEditorStore();
    const {fetchDynamicRouteNodeSetupContent} = useNodesStore();
    const [selectedVersionId, setSelectedVersionId] = useState<string>('');

    useEffect(() => {
        if (!routeData || !routeData.id) return;
        const activeVersionId = editingRouteVersions[routeData.id];
        if (activeVersionId) {
            setSelectedVersionId(activeVersionId);
        } else {
            if (routeData.node_setup?.published_version) {
                setSelectedVersionId(routeData.node_setup.published_version.id);
            } else if (routeData.node_setup?.versions?.length) {
                const latestVersion = routeData.node_setup.versions.reduce((prev, curr) =>
                    prev.version_number > curr.version_number ? prev : curr
                );
                setSelectedVersionId(latestVersion.id);
            }
        }
    }, [routeData, editingRouteVersions]);

    const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVersionId = e.target.value;
        setSelectedVersionId(newVersionId);
        if (!routeData || !routeData.id) return;
        setEditingRouteVersion(routeData.id, newVersionId);
        fetchDynamicRouteNodeSetupContent(routeData.id);
    };

    const handlePublish = () => {
        // maak hier een call naar je backend, bijv.:
        // POST /node_setups/<nodeSetupId>/publish/<selectedVersionId>
        // of je maakt een dedicated endpoint
        console.log("Publishing version:", selectedVersionId);
    };

    const handleSave = () => {
        console.log('HANDLE SAVE');
    };

    if (!routeData?.node_setup) {
        return null;
    }

    return (
        <div className="absolute top-5 right-5 flex items-center gap-2 p-2 bg-white/70 dark:bg-black/30 rounded shadow">
            <Select value={selectedVersionId} onChange={handleVersionChange}>
                {routeData.node_setup.versions?.map((version: NodeSetupVersion) => {
                    const label = version.id === routeData.node_setup?.published_version?.id
                        ? `v${version.version_number} (published)`
                        : `v${version.version_number}`;
                    return (
                        <option key={version.id} value={version.id}>
                            {label}
                        </option>
                    );
                })}
            </Select>
            <Button onClick={handleSave}><Text>Save</Text></Button>
            <Button onClick={handlePublish}><Text>Publish</Text></Button>
        </div>
    );
}