import { create, StateCreator } from 'zustand';
import {
    fetchDynamicRoutes as fetchDynamicRoutesAPI,
    storeDynamicRoute as storeDynamicRouteAPI,
    updateDynamicRoute as updateDynamicRouteAPI,
    deleteDynamicRoute as deleteDynamicRouteAPI,
} from '@/api/dynamicRoutesApi';
import useEditorStore from "@/stores/editorStore";
import { Route } from "@/types/types";

type DynamicRoutesStore = {
    reset: () => void;
    hasInitialFetched: boolean;
    routes: Route[];
    getDynamicRoute: (routeId: string) => Route | undefined;
    fetchDynamicRoutes: () => Promise<void>;
    storeDynamicRoute: (route: Route) => Promise<Route | undefined>;
    updateDynamicRoute: (route: Route) => Promise<void>;
    deleteDynamicRoute: (routeId: string) => Promise<void>;
};

const useDynamicRoutesStore = create<DynamicRoutesStore>((
    set:Parameters<StateCreator<DynamicRoutesStore>>[0]
) => ({
    reset: () => {
        set({
            routes: [],
            hasInitialFetched: false,
        });
    },

    hasInitialFetched: false,

    routes: [],

    getDynamicRoute: (routeId): Route | undefined => {
        return useDynamicRoutesStore
            .getState()
            .routes
            .find((route) => route.id === routeId);
    },

    fetchDynamicRoutes: async () => {
        const { activeProjectId } = useEditorStore.getState();
        if (!activeProjectId) return;
        try {
            const data: Route[] = await fetchDynamicRoutesAPI(activeProjectId);
            set({ routes: data, hasInitialFetched: true });
        } catch (error) {
            console.error('Failed to fetch routes:', error);
        }
    },

    storeDynamicRoute: async (route: Route): Promise<Route | undefined> => {
        const { activeProjectId } = useEditorStore.getState();
        try {
            const response = await storeDynamicRouteAPI(activeProjectId, route);
            route.id = response.id;
            set((state) => ({ routes: [...state.routes, route] }));
            return route;
        } catch (error) {
            throw error;
        }
    },

    updateDynamicRoute: async (route: Route) => {
        try {
            const { activeProjectId, activeVersionId } = useEditorStore.getState();
            await updateDynamicRouteAPI(activeProjectId, route.id as string, activeVersionId as string, route);
            set((state) => ({
                routes: state.routes.map((r) => (r.id === route.id ? route : r)),
            }));
        } catch (error) {
            console.error('Failed to update routes:', error);
        }
    },

    deleteDynamicRoute: async (routeId: string) => {
        try {
            await deleteDynamicRouteAPI(routeId);
            set((state) => ({
                routes: state.routes.filter((r) => r.id !== routeId),
            }));
        } catch (error) {
            console.error('Failed to delete route:', error);
        }
    }
}));

export default useDynamicRoutesStore;
