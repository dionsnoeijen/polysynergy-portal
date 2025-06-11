import {useEffect} from "react";

import useBlueprintsStore from "@/stores/blueprintsStore";
import useDynamicRoutesStore from "@/stores/dynamicRoutesStore";
import useSchedulesStore from "@/stores/schedulesStore";
import useProjectSecretsStore from "@/stores/projectSecretsStore";
import useServicesStore from "@/stores/servicesStore";
import useStagesStore from "@/stores/stagesStore";
import useEnvVarsStore from "@/stores/envVarsStore";
import useAvailableNodeStore from "@/stores/availableNodesStore";

export function useAutoFetch() {
    const blueprints = useBlueprintsStore((s) => s.blueprints);
    const isFetchingBlueprints = useBlueprintsStore((s) => s.isFetching);
    const hasBlueprintsInitialFetched = useBlueprintsStore((s) => s.hasInitialFetched);

    const routes = useDynamicRoutesStore((s) => s.routes);
    const isFetchingRoutes = useDynamicRoutesStore((s) => s.isFetching);
    const hasRoutesInitialFetched = useDynamicRoutesStore((s) => s.hasInitialFetched);

    const schedules = useSchedulesStore((s) => s.schedules);
    const isFetchingSchedules = useSchedulesStore((s) => s.isFetching);
    const hasSchedulesInitialFetched = useSchedulesStore((s) => s.hasInitialFetched);

    const secrets = useProjectSecretsStore((s) => s.secrets);
    const isFetchingSecrets = useProjectSecretsStore((s) => s.isFetching);
    const hasSecretsInitialFetched = useProjectSecretsStore((s) => s.hasInitialFetched);

    const services = useServicesStore((s) => s.services);
    const isFetchingServices = useServicesStore((s) => s.isFetching);
    const hasServicesInitialFetched = useServicesStore((s) => s.hasInitialFetched);

    const stages = useStagesStore((s) => s.stages);
    const isFetchingStages = useStagesStore((s) => s.isFetching);
    const hasStagesInitialFetched = useStagesStore((s) => s.hasInitialFetched);

    const envVars = useEnvVarsStore((s) => s.envVars);
    const isFetchingEnvVars = useEnvVarsStore((s) => s.isFetching);
    const hasEnvVarsInitialFetched = useEnvVarsStore((s) => s.hasInitialFetched);

    const availableNodes = useAvailableNodeStore((s) => s.availableNodes);
    const isFetchingAvailableNodes = useAvailableNodeStore((s) => s.isFetching);
    const hasAvailableNodesInitialFetched = useAvailableNodeStore((s) => s.hasInitialFetched);

    useEffect(() => {
        if (availableNodes.length === 0 && !hasAvailableNodesInitialFetched && !isFetchingAvailableNodes) {
            useAvailableNodeStore.getState().fetchAvailableNodes();
        }
        if (blueprints.length === 0 && !hasBlueprintsInitialFetched && !isFetchingBlueprints) {
            useBlueprintsStore.getState().fetchBlueprints();
        }
        if (routes.length === 0 && !hasRoutesInitialFetched && !isFetchingRoutes) {
            useDynamicRoutesStore.getState().fetchDynamicRoutes();
        }
        if (schedules.length === 0 && !hasSchedulesInitialFetched && !isFetchingSchedules) {
            useSchedulesStore.getState().fetchSchedules();
        }
        if (secrets.length === 0 && !hasSecretsInitialFetched && !isFetchingSecrets) {
            useProjectSecretsStore.getState().fetchSecrets();
        }
        if (services.length === 0 && !hasServicesInitialFetched && !isFetchingServices) {
            useServicesStore.getState().fetchServices();
        }
        if (stages.length === 0 && !hasStagesInitialFetched && !isFetchingStages) {
            useStagesStore.getState().fetchStages();
        }
        if (envVars.length === 0 && !hasEnvVarsInitialFetched && !isFetchingEnvVars) {
            useEnvVarsStore.getState().fetchEnvVars();
        }
    }, [hasBlueprintsInitialFetched, hasRoutesInitialFetched, hasSchedulesInitialFetched, hasSecretsInitialFetched, hasServicesInitialFetched, hasStagesInitialFetched, hasEnvVarsInitialFetched, blueprints.length, isFetchingBlueprints, routes.length, isFetchingRoutes, schedules.length, isFetchingSchedules, secrets.length, isFetchingSecrets, services.length, isFetchingServices, stages.length, isFetchingStages, envVars.length, isFetchingEnvVars]);
}