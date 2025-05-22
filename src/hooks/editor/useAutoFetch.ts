import {useEffect} from "react";

import useBlueprintsStore from "@/stores/blueprintsStore";
import useDynamicRoutesStore from "@/stores/dynamicRoutesStore";
import useSchedulesStore from "@/stores/schedulesStore";
import useProjectSecretsStore from "@/stores/projectSecretsStore";
import useServicesStore from "@/stores/servicesStore";
import useStagesStore from "@/stores/stagesStore";
import useEnvVarsStore from "@/stores/envVarsStore";

export function useAutoFetch() {
    const blueprints = useBlueprintsStore((s) => s.blueprints);
    const hasBlueprintsInitialFetched = useBlueprintsStore((s) => s.hasInitialFetched);

    const routes = useDynamicRoutesStore((s) => s.routes);
    const hasRoutesInitialFetched = useDynamicRoutesStore((s) => s.hasInitialFetched);

    const schedules = useSchedulesStore((s) => s.schedules);
    const hasSchedulesInitialFetched = useSchedulesStore((s) => s.hasInitialFetched);

    const secrets = useProjectSecretsStore((s) => s.secrets);
    const hasSecretsInitialFetched = useProjectSecretsStore((s) => s.hasInitialFetched);

    const services = useServicesStore((s) => s.services);
    const hasServicesInitialFetched = useServicesStore((s) => s.hasInitialFetched);

    const stages = useStagesStore((s) => s.stages);
    const hasStagesInitialFetched = useStagesStore((s) => s.hasInitialFetched);

    const envVars = useEnvVarsStore((s) => s.envVars);
    const hasEnvVarsInitialFetched = useEnvVarsStore((s) => s.hasInitialFetched);

    useEffect(() => {
        if (blueprints.length === 0 && !hasBlueprintsInitialFetched) {
            useBlueprintsStore.getState().fetchBlueprints();
        }
        if (routes.length === 0 && !hasRoutesInitialFetched) {
            useDynamicRoutesStore.getState().fetchDynamicRoutes();
        }
        if (schedules.length === 0 && !hasSchedulesInitialFetched) {
            useSchedulesStore.getState().fetchSchedules();
        }
        if (secrets.length === 0 && !hasSecretsInitialFetched) {
            useProjectSecretsStore.getState().fetchSecrets();
        }
        if (services.length === 0 && !hasServicesInitialFetched) {
            useServicesStore.getState().fetchServices();
        }
        if (stages.length === 0 && !hasStagesInitialFetched) {
            useStagesStore.getState().fetchStages();
        }
        if (envVars.length === 0 && !hasEnvVarsInitialFetched) {
            useEnvVarsStore.getState().fetchEnvVars();
        }
    }, [
        blueprints.length,
        routes.length,
        schedules.length,
        secrets.length,
        services.length,
        stages.length,
        envVars.length,
        hasBlueprintsInitialFetched,
        hasRoutesInitialFetched,
        hasSchedulesInitialFetched,
        hasSecretsInitialFetched,
        hasServicesInitialFetched,
        hasStagesInitialFetched,
        hasEnvVarsInitialFetched,
    ]);
}