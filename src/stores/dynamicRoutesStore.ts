import { create, StateCreator } from 'zustand';
import {
    fetchDynamicRoutes as fetchDynamicRoutesAPI,
    storeDynamicRoute as storeDynamicRouteAPI,
    updateDynamicRoute as updateDynamicRouteAPI,
} from '@/api/dynamicRoutesApi';
import { useEditorStore } from "@/stores/editorStore";
import { ListItemWithId } from "@/types/types";

export enum RouteSegmentType {
    Static = 'static',
    Variable = 'variable',
}

export type RouteSegment = {
    id: string;
    segment_order: number;
    type: RouteSegmentType;
    name: string;
    default_value: null|string;
    variable_type: null|string;
};

export type Route = ListItemWithId & {
    id?: string | null;
    description: string;
    created_at?: string;
    updated_at?: string;
    segments: RouteSegment[];
    method: string;
};

type DynamicRoutesStore = {
    routes: Route[];
    getDynamicRoute: (routeId: string) => Route | undefined;
    fetchDynamicRoutes: () => Promise<void>;
    storeDynamicRoute: (route: Route) => Promise<void>;
    updateDynamicRoute: (route: Route) => Promise<void>;
};

const useDynamicRoutesStore = create<DynamicRoutesStore>((
    set:Parameters<StateCreator<DynamicRoutesStore>>[0]
) => ({
    routes: [],

    getDynamicRoute: (routeId): Route | undefined => {
        return useDynamicRoutesStore.getState().routes.find((route) => route.id === routeId);
    },

    fetchDynamicRoutes: async () => {
        const { activeProjectId } = useEditorStore.getState();
        try {
            const data: Route[] = await fetchDynamicRoutesAPI(activeProjectId);
            set({ routes: data });
        } catch (error) {
            console.error('Failed to fetch routes:', error);
        }
    },

    storeDynamicRoute: async (route: Route) => {
        const { activeProjectId } = useEditorStore.getState();
        try {
            const response = await storeDynamicRouteAPI(activeProjectId, route);
            route.id = response.id;
            set((state) => ({ routes: [...state.routes, route] }));
        } catch (error) {
            console.error('Failed to store routes:', error);
        }
    },

    updateDynamicRoute: async (route: Route) => {
        try {
            await updateDynamicRouteAPI(route.id as string, route);
            set((state) => ({
                routes: state.routes.map((r) => (r.id === route.id ? route : r)),
            }));
        } catch (error) {
            console.error('Failed to update routes:', error);
        }
    }
}));

export default useDynamicRoutesStore;
