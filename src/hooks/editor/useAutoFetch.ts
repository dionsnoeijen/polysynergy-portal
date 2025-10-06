import { useEffect } from "react";
import useBlueprintsStore from "@/stores/blueprintsStore";
import useDynamicRoutesStore from "@/stores/dynamicRoutesStore";
import useSchedulesStore from "@/stores/schedulesStore";
import useChatWindowsStore from "@/stores/chatWindowsStore";
import useProjectSecretsStore from "@/stores/projectSecretsStore";
import useServicesStore from "@/stores/servicesStore";
import useStagesStore from "@/stores/stagesStore";
import useEnvVarsStore from "@/stores/envVarsStore";
import useAvailableNodeStore from "@/stores/availableNodesStore";

export function useAutoFetch() {
    const blueprintsStore = useBlueprintsStore.getState();
    const routesStore = useDynamicRoutesStore.getState();
    const schedulesStore = useSchedulesStore.getState();
    const chatWindowsStore = useChatWindowsStore.getState();
    const secretsStore = useProjectSecretsStore.getState();
    const servicesStore = useServicesStore.getState();
    const stagesStore = useStagesStore.getState();
    const envVarsStore = useEnvVarsStore.getState();
    const nodesStore = useAvailableNodeStore.getState();

    useEffect(() => {
        const fetchIf = (should: boolean, fn: () => void) => {
            if (should) fn();
        };

        fetchIf(
            nodesStore.availableNodes.length === 0 &&
                !nodesStore.hasInitialFetched &&
                !nodesStore.isFetching,
            nodesStore.fetchAvailableNodes
        );

        fetchIf(
            blueprintsStore.blueprints.length === 0 &&
                !blueprintsStore.hasInitialFetched &&
                !blueprintsStore.isFetching,
            blueprintsStore.fetchBlueprints
        );

        fetchIf(
            routesStore.routes.length === 0 &&
                !routesStore.hasInitialFetched &&
                !routesStore.isFetching,
            routesStore.fetchDynamicRoutes
        );

        fetchIf(
            schedulesStore.schedules.length === 0 &&
                !schedulesStore.hasInitialFetched &&
                !schedulesStore.isFetching,
            schedulesStore.fetchSchedules
        );

        fetchIf(
            chatWindowsStore.chatWindows.length === 0 &&
                !chatWindowsStore.hasInitialFetched &&
                !chatWindowsStore.isFetching,
            chatWindowsStore.fetchChatWindows
        );

        fetchIf(
            secretsStore.secrets.length === 0 &&
                !secretsStore.hasInitialFetched &&
                !secretsStore.isFetching,
            secretsStore.fetchSecrets
        );

        fetchIf(
            servicesStore.services.length === 0 &&
                !servicesStore.hasInitialFetched &&
                !servicesStore.isFetching,
            servicesStore.fetchServices
        );

        fetchIf(
            stagesStore.stages.length === 0 &&
                !stagesStore.hasInitialFetched &&
                !stagesStore.isFetching,
            stagesStore.fetchStages
        );

        fetchIf(
            envVarsStore.envVars.length === 0 &&
                !envVarsStore.hasInitialFetched &&
                !envVarsStore.isFetching,
            envVarsStore.fetchEnvVars
        );
    // eslint-disable-next-line
    }, []);
}