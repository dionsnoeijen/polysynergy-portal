import useBlueprintsStore from "@/stores/blueprintsStore";
import {useEffect} from "react";
import useConfigsStore from "@/stores/configsStore";
import useDynamicRoutesStore from "@/stores/dynamicRoutesStore";
import useSchedulesStore from "@/stores/schedulesStore";
import useProjectSecretsStore from "@/stores/projectSecretsStore";
import useServicesStore from "@/stores/servicesStore";

export function useAutoFetch() {
    const blueprints = useBlueprintsStore((s) => s.blueprints);
    const configs = useConfigsStore((s) => s.configs);
    const routes = useDynamicRoutesStore((s) => s.routes);
    const schedules = useSchedulesStore((s) => s.schedules);
    const secrets = useProjectSecretsStore((s) => s.secrets);
    const services = useServicesStore((s) => s.services);

    useEffect(() => {
        if (blueprints.length === 0) {
            useBlueprintsStore.getState().fetchBlueprints();
        }
        if (configs.length === 0) {
            useConfigsStore.getState().fetchConfigs();
        }
        if (routes.length === 0) {
            useDynamicRoutesStore.getState().fetchDynamicRoutes();
        }
        if (schedules.length === 0) {
            useSchedulesStore.getState().fetchSchedules();
        }
        if (secrets.length === 0) {
            useProjectSecretsStore.getState().fetchSecrets();
        }
        if (services.length === 0) {
            useServicesStore.getState().fetchServices();
        }
    }, [blueprints.length, configs.length, routes.length, schedules.length, secrets.length, services.length]);
}