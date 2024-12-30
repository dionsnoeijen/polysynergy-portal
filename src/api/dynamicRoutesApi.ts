import {Route} from "@/stores/dynamicRoutesStore";

export const fetchDynamicRoutes = async (projectId: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/dynamic-routes/?project_id=${projectId}`, {
        headers: {
            'Accept': 'application/json',
        },
    });
    return response.json();
};

export const storeDynamicRoute = async (projectId: string, route: Route) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/dynamic-routes/`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...route,
            project_id: projectId,
        }),
    });
    return response.json();
};

export const updateDynamicRoute = async (routeId: string, updatedData: Partial<Route>) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/dynamic-routes/${routeId}/`, {
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
    });
    return response.json();
};
