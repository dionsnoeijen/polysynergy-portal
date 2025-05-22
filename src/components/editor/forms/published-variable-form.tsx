import {Heading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Button} from "@/components/button";
import {Blueprint, Config, Fundamental, NodeVariable, Route, Schedule, Service} from "@/types/types";
import React, {useEffect, useState} from "react";

import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useDynamicRoutesStore from "@/stores/dynamicRoutesStore";
import useSchedulesStore from "@/stores/schedulesStore";
import useServicesStore from "@/stores/servicesStore";
import useConfigsStore from "@/stores/configsStore";
import useProjectSecretsStore from "@/stores/projectSecretsStore";
import useBlueprintsStore from "@/stores/blueprintsStore";

import PublishedVariables from "@/components/editor/forms/variable/published-variables";
import {formatSegments} from "@/utils/formatters";
// import {createProjectSecretAPI} from "@/api/secretsApi";
import {fetchSecretsWithRetry} from "@/utils/filesSecretsWithRetry";
import {XMarkIcon} from "@heroicons/react/24/outline";

const PublishedVariableForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const nodes = useNodesStore((state) => state.nodes);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    // const activeProjectId = useEditorStore((state) => state.activeProjectId);
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
    const fetchSecrets = useProjectSecretsStore((state) => state.fetchSecrets);

    const [error, setError] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<Route | Schedule | Service | Config | Blueprint | null | undefined>();
    const [activeFundamental, setActiveFundamental] = useState<Fundamental | null>(null);
    const [publishedVariables, setPublishedVariables] = useState<{ variable: NodeVariable; nodeId: string }[]>([]);
    const [variables, setVariables] = useState<{ [nodeId: string]: { [handle: string]: NodeVariable[] } }>({});
    const [simpleVariables, setSimpleVariables] = useState<{ [nodeId: string]: { [handle: string]: string } }>({});
    const [secretVariables, setSecretVariables] = useState<{ key: string, value: string }[]>([]);

    useEffect(() => {
        if (!activeRouteId &&
            !activeScheduleId &&
            !activeServiceId &&
            !activeConfigId &&
            !activeBlueprintId
        ) {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        Object.entries(variables).forEach(([nodeId, handles]) => {
            Object.entries(handles).forEach(([handle, value]) => {
                updateNodeVariable(nodeId, handle, value);
            });
        });

        Object.entries(simpleVariables).forEach(([nodeId, handles]) => {
            Object.entries(handles).forEach(([handle, value]) => {
                updateNodeVariable(nodeId, handle, value);
            });
        });

        closeForm();

        await Promise.all(
            secretVariables.map(secret => {
                const {key, value} = secret;
                if (key && value) {
                    // return createProjectSecretAPI(activeProjectId, key, value);
                }
            })
        );

        await fetchSecretsWithRetry(fetchSecrets);
    };

    return (
        <form onSubmit={handleSubmit} className={'p-10'}>
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>{
                    activeFundamental &&
                    activeFundamental.charAt(0).toUpperCase() +
                    activeFundamental.slice(1)
                }: {activeFundamental === Fundamental.Route ?
                    '/' + formatSegments((activeItem as Route)?.segments) :
                    (activeItem as Schedule | Service | Config)?.name}
                </Heading>
                <Button type="button" onClick={() => closeForm()} plain>
                    <XMarkIcon className="w-5 h-5"/>
                </Button>
            </div>
            <Divider className="my-4" soft bleed/>

            <PublishedVariables
                nodes={nodes}
                variables={variables}
                setVariables={setVariables}
                simpleVariables={simpleVariables}
                setSimpleVariables={setSimpleVariables}
                publishedVariables={publishedVariables}
                setPublishedVariables={setPublishedVariables}
                secretVariables={secretVariables}
                setSecretVariables={setSecretVariables}
            />

            <Divider className="my-10" soft bleed />

            <div className="flex justify-end gap-4">
                {error && (<div className="text-red-500">{error}</div>)}
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